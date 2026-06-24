# Custom Imports
from data import point_observation
from models.inference import Model
from utils.helper import crop32

# Library Imports
import uuid
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from geopandas import GeoDataFrame
from datetime import datetime, timedelta





class Investigation():
    def __init__(self,
                lat, lon,
                sqkm,
                models_to_inference = {},
                observation_increments = [], #Years back to search
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
        #self.generate_masks()



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
        def image_to_base64(img):
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            header = "data:image/png;base64,"
            return header + str(base64.b64encode(buffer.getvalue()).decode("utf-8"))

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
            new_obs = point_observation.collect_observation(self.lat, self.lon, self.sqkm, new_target_date, windows = [45, 90, 180], logger = self.logger) 
            self.observations.append(new_obs)
            batch = self.package_obs_batch(obs_index, new_obs)
            self.logger(batch,'batch')
            obs_index +=1
        self.logger('Completed observations for given areas', 'status')




    def generate_masks(self):
        self.models = {}
        for model_type, model_path in self.models_to_inference.items():
            self.models[model_type] = Model(model_path, model_name=model_type)

        for model_type, model in self.models.items():
            for obs in self.observations:
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
    

    @classmethod
    def rehydrate(cls, lat, lon, sqkm, models_to_inference, logger, observations):
        obj = cls.__new__(cls)
        setattr(obj, 'lat', lat)
        setattr(obj, 'lon', lon)
        setattr(obj, 'sqkm', sqkm)
        setattr(obj, 'models_to_inference', models_to_inference)
        setattr(obj, 'logger', logger)
        setattr(obj, 'observations', observations)
        return obj
        
    


