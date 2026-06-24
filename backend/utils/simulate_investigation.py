
'''
File to simulate running an investigation for the app development 
environment without actually having to run models or call STAC commands

Needs to be updated every time new edits happen that affect how investigations
happen on the models feature branch

'''
from PIL import Image
from time import sleep
from io import BytesIO
import base64
import uuid





def inv_sim(name, lat, lon, area, num_obs, logger = print):
    BATCH_INDEX = 1
    def new_batch(date, image):
        def image_to_base64(img):
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            header = "data:image/png;base64,"
            return header + str(base64.b64encode(buffer.getvalue()).decode("utf-8"))
        
        return {
            'batch_id': "Observation "+str(BATCH_INDEX),
            'id': str(uuid.uuid4()),
            'index': BATCH_INDEX,
            'date': date,
            'area': str(area),
            'image': image_to_base64(image),
            'lat': float(lat),
            'lng': float(lon)
            }

    logger('connection complete', 'status')

    sample_image = Image.open('sample_data/before_img.png')

    for i in range(int(num_obs)):
        sleep(1)
        next_year = 2026-i
        date = str(next_year) + '-06-01'
        logger(new_batch(date, sample_image), 'batch')

    logger('','complete')

'''
    logger('running sim', 'status')
    sleep(.2)

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

