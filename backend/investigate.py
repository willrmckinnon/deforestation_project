# Custom Imports
from backend.data import point_observation
from backend.models.inference import Model
from backend.utils.helper import crop32
from backend.models.utils.display import sentinel_worldcover_image_and_mask_display as wc_display

# Library Imports
import numpy as np
from datetime import datetime, timedelta


def forest_investigation(
        lat, lon,
        sqkm,
        #model_checkpoint_path
        ):
    
#------------------------------------------------
#---------Collect-the-Observations---------------
#------------------------------------------------
    observations = {}
    years_back_from_initial_obs = [1, 3, 5]
    
    target_date = datetime.now().date()

    initial_obs = point_observation.collect_observation(lat, lon, sqkm, target_date, windows = [45, 60, 90, 360])
    if initial_obs.items == []: 
        print('Could not collect sufficient cloudless items of given location')
        return None
    
    # Get the oldest date from the observation to use as the new benchmark
    dates = []
    for item in initial_obs.items:
        date_str = item.properties['datetime'][:10]
        dates.append(datetime.strptime(date_str,'%Y-%m-%d'))
    first_year_date = min(dates).date()
    print('Collected the initial observation')

    observations[first_year_date] = initial_obs

    for year in years_back_from_initial_obs:
        new_target_date = first_year_date - timedelta(days = 365*year)
        new_obs = point_observation.collect_observation(lat, lon, sqkm, new_target_date, windows = [45, 90, 180])
        dates = []
        for item in new_obs.items:
            date_str = item.properties['datetime'][:10]
            dates.append(datetime.strptime(date_str,'%Y-%m-%d'))
        new_year_date = min(dates).date()    
        observations[new_year_date] = new_obs
        print(f'Collected the observation {year} year(s) before the initial observation')
        


    return observations




#------------------------------------------------
#---------Inference-the-Model--------------------
#------------------------------------------------
    '''
    # Setup the model
    model = Model(checkpoint_path = model_checkpoint_path)

    # Collect the data
    data, image = sample_observation(lat = -12.680635, lon=-69.365719, bands = model.bands)
    data = np.transpose(data, (2, 0, 1))
    cropped_data = crop32(data)

    # Inference the model
    mask = model.inference(cropped_data)

    # Display the results
    if model.label_map and model.wc_code_map:
        wc_display(cropped_data, mask, 
            label_map=model.label_map, 
            wc_code_map=model.wc_code_map)
    else: wc_display(cropped_data, mask)

    '''







