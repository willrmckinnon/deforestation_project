
'''
File to simulate running an investigation for the app development 
environment without actually having to run models or call STAC commands

Needs to be updated every time new edits happen that affect how investigations
happen on the models feature branch

'''
from backend.investigate import ForestInvestigation
from backend.utils.helper import load_config
 
def run_inv(lat, lon, sqkm, logger = print):
    lat, lon, sqkm = map(float, [lat, lon, sqkm])

    logger(f'Running Investigation on {lat}, {lon}', 'status')

    config = load_config()
    model_path = config['model_paths']['forest_model']

    try: investigation = ForestInvestigation(lat, lon, sqkm, model_path, observation_increments=[1, 2], logger=logger)
    except Exception as e: logger(f'Investigation failed from the following error: \n{e}')

    logger(f'Investigation complete for {lat}, {lon}.', 'status')






'''
    logger(f'Completing sim for {lat}, {lon}', 'status')

    img1 = Image.open('sample_data/after_img.png')
    img2 = Image.open('sample_data/before_img.png')
    chg_img = Image.open('sample_data/change_img.png')
                         

    logger(img1, 'image')
    sleep(.2)
    logger(' This is initial image collected of the target area')
    sleep(1)
    logger(img2, 'image')
    paragraph2 = 10 * " This is an initial statement about paragraph 2."
    logger(paragraph2)
    sleep(0.3)
    logger(chg_img, 'image')
    logger(f'Sim Complete for {lat}, {lon}', 'status')
'''


