# Custom Imports
from models.inference import Model
from utils.helper import load_config
from utils.forest_investigation_class import ForestInvestigation
from utils.point_observation import ObservedArea


# Basic Libraries
 
def collect_inferences(params, logger):
    model_name = params['modelName']
    observation_strings = params['observations']
    lat = params['lat']
    lon = params['lng']
    sqkm = float(params['area'].split(' ')[0])

    # Genertate the Masks
    try:
        config = load_config()
        if config['model_paths'][model_name]:
            models_to_inference = {model_name: config['model_paths'][model_name]}
        else:
            logger('Could not find specified model name', 'status')
            return

        results = []

        observations = []
        for obs_str in observation_strings:
            obs = ObservedArea.unpack(obs_str['observation'], logger)
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

    except Exception as e: 
        logger(f'Failed to collect masks because of the following error: \n{e}','status')   


    # Compare masks
    try:
        investigation.analyze_vegetation_change(model_name)
    except Exception as e: 
        logger(f'Time Analysis failed because of the following error: \n{e}','status')          

    # Send Complete Message
    logger('','complete')
