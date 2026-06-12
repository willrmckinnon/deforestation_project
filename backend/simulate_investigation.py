
'''
File to simulate running an investigation for the app development 
environment without actually having to run models or call STAC commands

Needs to be updated every time new edits happen that affect how investigations
happen on the models feature branch

'''
from PIL import Image
from time import sleep


def inv_sim(lat, lon, sqkm, logger = print):
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



