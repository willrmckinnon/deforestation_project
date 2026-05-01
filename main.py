from utils import helper
from data.load_planetary_comp_data import get_observation_no_clouds
from datetime import datetime


import matplotlib.pyplot as plt
import argparse


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--loc", type=str, required=False, default = 'dc')
    parser.add_argument("--lat", type=float, required=False)
    parser.add_argument("--lon", type=float, required=False)
    parser.add_argument("--sqkm", type=float, required=False, default = 100)
    parser.add_argument("--date", type=float, required=False)
    parser.add_argument("--sat", type=float, required=False, default = 7)

    return parser.parse_args()


def main():
    args = get_args()
    config = helper.load_config()

    #----------------------------------------------
    #Setup - Collect the AOI and Datewindow needed
    #----------------------------------------------

    #Setup the DATETIME based on whether input is given | If no input argument is given, start with today
    target_date = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else datetime.now().date()

    #Setup the square area to be covered
    target_width = 1000 * ((args.sqkm/0.9540802499563914)**(0.5))

    #Setup the AOI
    if args.lat and args.lon: lat, lon = args.lat, args.lon
    elif args.loc: lat,lon = config['known_locations'][args.loc]
    else: lat, lon = config['known_locations']['dc']
    
    aoi = helper.point_to_polygon(lat, lon, dim = target_width)



    #----------------------------------------------
    # Get the Observation
    #----------------------------------------------
    #Fetch Observation
    print("Started - Fetching Data")
    obs = get_observation_no_clouds(aoi, target_date, max_attempts=6, max_cloud_threshold=70)

    #Set the bands and stitch together the xarrays for the total observed area
    bands = ['B02', 'B03','B04']
    img, _ = obs.stack_obs(bands)


    #----------------------------------------------
    # Display the result
    #----------------------------------------------
    print("Displaying Image")
    rgb = helper.normalize_per_band(img, saturation=7)

    helper.disp_image(rgb)



if __name__ == "__main__":
    main()