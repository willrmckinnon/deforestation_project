# Custom Imports
from utils import point_observation
from utils.helper import crop32, load_config, image_to_base64


# Library Imports
import uuid
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from geopandas import GeoDataFrame
from datetime import datetime, timedelta



def blank_obs_mask_return(obs):
    config = load_config()
    placeholder_img = Image.open(config['placeholder_image_path'])
    blank_return = {
        'model_name': 'No Model Defined',
        'model_tag': 'No Model Defined',
        'batchId': obs.batch,
        'image': image_to_base64(placeholder_img),
        'metadata': {'labels': []}
    }
    return blank_return


 

class Investigation():
    def __init__(self,
                lat, lon,
                sqkm,
                observation_increments = [], #Years back to search
                logger = print
                ):
        
        self.lat = lat
        self.lon = lon
        self.sqkm = sqkm
        self.logger = logger
        self.models = {}
        self.observation_increments = observation_increments        
        self.collect_observations()




    class ChangeLog(GeoDataFrame):
        def generate_change_image(self, row_index, 
                          obs_col = 'newer_observation', 
                          mask_col = 'change_mask',
                          pos_color = [255, 0, 0],
                          neg_color = [0, 255, 0],
                          saturation = 2,
                          return_data = False
                          ):
            row = self.iloc[row_index]
            obs = row[obs_col]
            data = obs.stack(['B02','B03','B04'])[0]
            mask = row[mask_col]

            #Crop and normalize the data
            data =crop32(np.transpose(data,(2,0,1)))
            data = np.transpose(data,(1,2,0))
            norm_data = np.zeros(data.shape)

            for i in range(data.shape[2]):
                band = data[:,:,i]
                band = (band - band.min()) / (band.max() - band.min())
                band = (255 * band).astype(np.uint8)
                norm_data[:,:,i] = band
            norm_data = norm_data[:,:,[2,1,0]]
            norm_data = np.clip((norm_data * saturation),0,255)
            

            # Concat and save
            overlay = norm_data.copy()
            overlay[mask == 1] = pos_color
            overlay[mask == -1] = neg_color
            overlay = overlay.astype(np.uint8)
            img = Image.fromarray(overlay)

            if return_data: return img, [norm_data, mask]
            else: return img

            
    def package_obs_batch(self, ind, obs):

        return {
            'batch_id': "Observation "+str(ind),
            'id': str(uuid.uuid4()),
            'index': ind,
            'date': str(obs.date),
            'area': str(self.sqkm),
            'image': image_to_base64(obs.get_image()),
            'lat': float(self.lat),
            'lng': float(self.lon),
            'obs': obs.pack()
            }


    def collect_observations(self):
        obs_index = 1
        target_date = datetime.now().date()
        self.observations = []
        initial_obs = point_observation.collect_observation(self.lat, self.lon, self.sqkm, target_date, windows = [45, 60, 90, 360], logger = self.logger)
        if initial_obs.items == []: 
            self.logger('Could not collect sufficient cloudless items of given location', 'status')
            return None
        batch = self.package_obs_batch(obs_index, initial_obs)
        self.logger(batch,'batch')
        obs_index +=1
        
        # Get the oldest date from the observation to use as the new benchmark
        first_year_date = initial_obs.date
        self.observations.append(initial_obs)

        # Collect all following observations
        for year in self.observation_increments:
            new_target_date = first_year_date - timedelta(days = 365*year)
            try:    
                new_obs = point_observation.collect_observation(self.lat, self.lon, self.sqkm, new_target_date, windows = [45, 90, 180], logger = self.logger) 
                self.observations.append(new_obs)       
                batch = self.package_obs_batch(obs_index, new_obs)
                self.logger(batch,'batch')
            except ValueError as e:
                self.logger(f'An error occured when collecting batch for target date {new_target_date}: {e}', 'status')
                self.logger(str(new_target_date), 'emptyBatch') 
                continue
            obs_index +=1
        self.logger('Completed observations for given areas', 'status')


    # Cycles through each observation in the investigation and return mask
    def generate_masks(self, model_info):
        # Run the inferences for each observation
        # If Failed, return a blank return for that observation
        for obs in self.observations:
            try: self.single_obs_mask(obs, model_info)
            except: self.logger(blank_obs_mask_return(obs), 'model_return')



    # To be over written by individual investigation types
    def single_obs_mask(self, obs, model_info):
        self.logger(blank_obs_mask_return(obs), 'model_return')




    def save_cache(self, path = 'sample_investivation.pkl'):
        import pickle
        keys_not_to_save = ['models']
        state = {}
        for key, value in self.__dict__.items():
            if key not in keys_not_to_save: 
                state[key] = value
        with open(path, 'wb') as f:
            pickle.dump(state, f)
        self.logger(f'File saved as <{path}>')

    def complete_setup(self):
        self.logger("complete_setup method not defined for this investigation type")


    @classmethod
    def load(cls, path):
        import pickle
        with open(path, 'rb') as f:
            state = pickle.load(f)
        obj = cls.__new__(cls)
        keys = []
        for key, value in state.items():
            setattr(obj, key, value)
            keys.append(key)
        print(f'Investigation Object loaded with the following attributes: {keys}')
        return obj
     

    @classmethod
    def rehydrate(cls, lat, lon, sqkm, logger, observations):
        obj = cls.__new__(cls)
        setattr(obj, 'lat', lat)
        setattr(obj, 'lon', lon)
        setattr(obj, 'sqkm', sqkm)
        setattr(obj, 'logger', logger)
        setattr(obj, 'observations', observations)
        obj.complete_setup()
        return obj
        
     


