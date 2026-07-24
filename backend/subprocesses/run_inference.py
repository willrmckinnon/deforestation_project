# Custom Imports
from models.inference import Model
from utils.helper import load_config
from investigations.forest_investigation_class import ForestInvestigation
from utils.point_observation import ObservedArea


# Basic Libraries
import traceback
from importlib import import_module


# Method to dynamically setup the investigation type
def load_class(path: str):
    module_name, class_name = path.rsplit(".", 1)
    module = import_module(module_name)
    return getattr(module, class_name) 


def run_inference(params, logger):
    model_name = params['modelName']
    observation_strings = params['observations']
    lat = params['lat']
    lon = params['lng']
    sqkm = float(params['area'].split(' ')[0])

    # Genertate the Masks
    try:
        # Collect the model information from config
        config = load_config()
        if config['models'][model_name]:
            model_info = config['models'][model_name]
        else:
            logger('Could not find specified model name', 'status')
            return

        # Re-hydrate the observations
        observations = []
        for obs_str in observation_strings:
            obs = ObservedArea.unpack(obs_str['observation'], logger)
            obs.batch = obs_str['batchId']
            observations.append(obs)


        # Setup the investigation (mask generation) class based on the config input
        Investigation = load_class(model_info['class'])
        investigation = Investigation.rehydrate(
            lat = lat,
            lon = lon,
            sqkm = sqkm,
            logger = logger,
            observations=observations
        )

        # Run the Investigation
        investigation.generate_masks(model_info)

        # Generate Comparison
        try:
            investigation.analyze_change(model_info)
        except Exception as e: 
            logger(f'Time Analysis failed because of the following error: \n{traceback.format_exc()}','status') 


    except Exception as e: 
        logger(f'Failed to collect masks because of the following error: \n{traceback.format_exc()}','status')   


         

    # Send Complete Message
    logger('','complete')
