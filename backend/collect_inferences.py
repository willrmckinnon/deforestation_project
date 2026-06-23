# Custom Imports
from models.inference import Model
from utils.helper import load_config
from investigate import ForestInvestigation
from data.point_observation import ObservedArea


# Basic Libraries
import base64
from PIL import Image
from io import BytesIO



def collect_inferences(params, logger):
    model_name = params['modelName']
    observation_strings = params['observations']
    lat = params['lat']
    lon = params['lng']
    sqkm = float(params['area'].split(' ')[0])

    try:

        config = load_config()
        print(config)
        print(model_name)
        print(config['model_paths'][model_name])
        if config['model_paths'][model_name]:
            models_to_inference = {model_name: config['model_paths'][model_name]}
        else:
            logger('Could not find specified model name', 'status')
            return

        logger(f'Masks requested for observations from {model_name}', 'status')
        results = []

        observations = []
        for obs_str in observation_strings:
            obs = ObservedArea.unpack(obs_str['observation'])
            obs.batch = obs_str['batchId']
            observations.append(obs)

        investigation = ForestInvestigation.rehydrate(
            lat = lat,
            lon = lon,
            sqkm = sqkm,
            models_to_inference = models_to_inference,
            logger = logger,
            observations=observations
        )

        investigation.generate_masks()

    except Exception as e: logger(f'Inference failed from the following error: \n{e}','status')
