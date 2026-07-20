
'''
File to simulate running an investigation for the app development 
environment without actually having to run models or call STAC commands

Needs to be updated every time new edits happen that affect how investigations
happen on the models feature branch
 
'''
from investigations.forest_investigation_class import ForestInvestigation

 
def collect_observations(lat, lon, sqkm, num_obs, logger = print):
    sqkm = sqkm.split(' ')[0]
    lat, lon = map(float, [lat, lon])
    sqkm, num_obs = map(int, [sqkm, num_obs])


    logger(f'Running Investigation on {lat}, {lon}', 'status')

    obs_increments = []
    for i in range(num_obs-1): obs_increments.append(i+1)

    try: investigation = ForestInvestigation(lat, lon, sqkm, observation_increments=obs_increments, logger=logger)
    except Exception as e: logger(f'Investigation failed from the following error: \n{e}','status')

    logger(f'Investigation complete for {lat}, {lon}.', 'status')
    logger('','complete')

 


