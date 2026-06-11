# Custom Imports
from backend.data import point_observation
from backend.models.inference import Model

# Library Imports
import numpy as np
from PIL import Image
from geopandas import GeoDataFrame
from backend.utils.helper import crop32
from datetime import datetime, timedelta


class Investigation():
    def __init__(self,
                lat, lon,
                sqkm,
                models_to_inference,
                observation_increments = [1, 3, 5], #Years back to search
                logger = print
                ):
        
        self.lat = lat
        self.lon = lon
        self.sqkm = sqkm
        self.logger = logger
        self.models = {}
        self.models_to_inference = models_to_inference
        self.observation_increments = observation_increments
        
        self.collect_observations()
        self.generate_masks()



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

            



    def collect_observations(self):
        target_date = datetime.now().date()
        self.observations = []

        initial_obs = point_observation.collect_observation(self.lat, self.lon, self.sqkm, target_date, windows = [45, 60, 90, 360])
        if initial_obs.items == []: 
            self.logger('Could not collect sufficient cloudless items of given location')
            return None
        
        # Get the oldest date from the observation to use as the new benchmark
        first_year_date = initial_obs.date
        self.observations.append(initial_obs)

        # Collect all following observations
        for year in self.observation_increments:
            new_target_date = first_year_date - timedelta(days = 365*year)
            new_obs = point_observation.collect_observation(self.lat, self.lon, self.sqkm, new_target_date, windows = [45, 90, 180]) 
            self.observations.append(new_obs)
        self.logger('Completed observations for given areas')




    def generate_masks(self):
        for model_type, model_path in self.models_to_inference.items():
            self.models[model_type] = Model(model_path)

        for model_type, model in self.models.items():
            for obs in self.observations:
                self.logger(f'Generating {model_type} mask for {obs.date} observation')
                obs.inference(model, model_type)



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
        
    


