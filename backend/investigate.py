# Custom Imports
from backend.data import point_observation
from backend.models.inference import Model
from backend.utils.helper import crop32
from backend.models.utils.display import sentinel_worldcover_image_and_mask_display as wc_display

# Library Imports
from datetime import datetime, timedelta


def multi_observations(lat, lon, sqkm, target_date, observation_increments):
    observations = []

    initial_obs = point_observation.collect_observation(lat, lon, sqkm, target_date, windows = [45, 60, 90, 360])
    if initial_obs.items == []: 
        print('Could not collect sufficient cloudless items of given location')
        return None
    
    # Get the oldest date from the observation to use as the new benchmark
    first_year_date = initial_obs.date
    print('Collected the initial observation')
    observations.append(initial_obs)

    # Collect all following observations
    for year in observation_increments:
        new_target_date = first_year_date - timedelta(days = 365*year)
        new_obs = point_observation.collect_observation(lat, lon, sqkm, new_target_date, windows = [45, 90, 180])
        new_year_date = new_obs.date 
        observations.append(new_obs)
        print(f'Collected the observation {year} year(s) before the initial observation')
    print('Completed observations for given areas')

    return observations  
        
 
    #------------------------------------------------------------------------------------------------
    #---------Main-Function--------------------------------------------------------------------------
    #------------------------------------------------------------------------------------------------


def forest_investigation(
        lat, lon,
        sqkm,
        model_checkpoint_path,
        observation_increments = [1, 3, 5]
        ):
    
    #------------------------------------------------
    #---------Collect-the-Observations---------------
    #------------------------------------------------
    target_date = datetime.now().date() 
    observations = multi_observations(lat, lon, sqkm, target_date, observation_increments)



    #------------------------------------------------
    #---------Inference-the-Model--------------------
    #------------------------------------------------

    # Setup the model
    model = Model(checkpoint_path = model_checkpoint_path)

    # Inference Each observation
    for obs in observations:
        obs.inference(model, 'tropical_forest')

    return observations

        
'''
    # Display the results
    if model.label_map and model.wc_code_map:
        wc_display(cropped_data, mask, 
            label_map=model.label_map, 
            wc_code_map=model.wc_code_map)
    else: wc_display(cropped_data, mask)
'''







