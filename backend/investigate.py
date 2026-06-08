# Custom Imports
from backend.models.inference import Model
from backend.utils.helper import sample_observation, crop32
from backend.models.utils.display import sentinel_worldcover_image_and_mask_display as wc_display

# Library Imports
import numpy as np


def forest_investigation(model_checkpoint_path):
    
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









