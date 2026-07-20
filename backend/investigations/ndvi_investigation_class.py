# Custom Imports
from utils.helper import image_to_base64
from investigations.investigation_class import Investigation

# Library Imports
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt




# --------------------------------------------------
# Support Functions for calculating NDVI 
# --------------------------------------------------
def set_ndvi(obs):
    ndvi_bands = ['B04','B08']
    ndvi_stack = obs.stack(ndvi_bands)
    ndvi_xx=ndvi_stack[1]
    red_band = ndvi_xx['B04']
    nir_band = ndvi_xx['B08']

    return (nir_band-red_band)/(nir_band+red_band)



def ndvi_heatmap(ndvi, cmap="viridis"):
    ndvi_arr = ndvi.to_numpy()
    arr = np.clip(ndvi_arr, 0, 1)

    # Apply colormap from plt
    rgba = plt.get_cmap(cmap)(arr)

    # Convert to uint8 RGB
    rgb = (rgba[:, :, :3] * 255).astype(np.uint8)
    return Image.fromarray(rgb)






# --------------------------------------------------
# Class
# --------------------------------------------------
class NDVIInvestigation(Investigation):
    def __init__(self,
                lat, lon,
                sqkm,
                observation_increments = [], #Years back to search
                logger = print
                ):
        
            
        super().__init__(lat, lon, sqkm, observation_increments, logger)    




    # A method unique to each investigation type that completes the setup
    def complete_setup(self):
        placeholder = None
 




    # Method to generate the return for each batch
    def single_obs_mask(self, obs, model_info):
        # Setup Containers for logger return to frontend
        result = {}

        # Set basic info to return
        result['model_name'] = model_info['tag']
        result['model_tag'] = model_info['tag']
        result['batchId'] = obs.batch

        # Set image to return
        obs.ndvi = set_ndvi(obs)
        heatmap_img = ndvi_heatmap(obs.ndvi)
        result['image'] = image_to_base64(heatmap_img)

        # Perform calculations and set metadata to return
        metadata = {}
        labels = []
        forest_threshold = 0.3
        percent_veg = float((obs.ndvi > forest_threshold).mean() * 100)
        percent_veg = f'{percent_veg:.2f}%'
        veg_count = float((obs.ndvi > forest_threshold).sum())
        veg_area = veg_count/10000
        veg_area = f'{veg_area:.2f} sqkm'

        labels.append({
            'class': 'NDVI Detected Vegetation',
            'sub': percent_veg,
            'Total Area of Vegetation:': str(veg_area),
            'Percentage of Observation with Vegetation:': percent_veg,
        })

        metadata['labels'] = labels
        


        #Set metadata to return
        result['metadata'] = metadata

        # Return the data to the frontend
        self.logger([result],'model_return')










    # method to generate a complete report of change
    def analyze_change(self, model_info):
        self.logger("None")  





