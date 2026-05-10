#Base Libraries
import io
import base64
import argparse
from datetime import datetime

#Scripts
from utils import helper
from data.load_observation import standard_observation

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--loc", type=str, required=False, default = 'dc')
    parser.add_argument("--lat", type=float, required=False)
    parser.add_argument("--lon", type=float, required=False)
    parser.add_argument("--sqkm", type=float, required=False, default = 100)
    parser.add_argument("--date", type=float, required=False)
    parser.add_argument("--sat", type=float, required=False, default = 7)

    return parser.parse_args()

def main(lat, lon, sqkm, logger, date = None):
    logger('PROCESS_STARTED')

    #----------------------------------------------
    #Setup - Collect the AOI and Datewindow needed
    #----------------------------------------------
    #Setup the DATETIME based on whether input is given | If no input argument is given, start with today
    target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now().date()

    #Setup the square area to be covered
    target_width = 1000 * ((sqkm/0.9540802499563914)**(0.5))

    #Setup the AOI
    aoi = helper.point_to_polygon(lat, lon, dim = target_width)



    #----------------------------------------------
    # Get the Observation
    #----------------------------------------------
    #Fetch Observation
    logger("Started - Fetching Data")
    obs = standard_observation(aoi, target_date, logger, max_cloud_threshold=30)

    #Set the bands and stitch together the xarrays for the total observed area
    bands = ['B02', 'B03','B04']
    img, _ = obs.stack(bands)


    #----------------------------------------------
    # Display the result
    #----------------------------------------------
    logger("Displaying Image")
    rgb = helper.npy_to_img(img)


    #Format image for return
    buffer = io.BytesIO() #Creating a local space to save the image
    rgb.save(buffer, format="PNG")
    rgb_encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    #Send image back to app
    logger(rgb_encoded, 'image')

    logger(obs.observation_report)






if __name__ == "__main__":
    args = get_args()
    main(args.lat, args.lon, args.sqkm, print)