from utils import helper
from data.load_planetary_comp_data import get_first_item_no_clouds
from datetime import datetime


import matplotlib.pyplot as plt
import argparse
from PIL import Image

def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--loc", type=str, required=False)
    parser.add_argument("--lat", type=float, required=False)
    parser.add_argument("--lon", type=float, required=False)
    parser.add_argument("--date", type=float, required=False)

    return parser.parse_args()


def main():
    args = get_args()
    config = helper.load_config()


    #Setup the DATETIME based on whether input is given | If no input argument is given, start with today
    target_date = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else datetime.now().date()

    #Setup the AOI
    if args.lat and args.lon:
        lat, lon = args.lat, args.lon
    elif args.loc:
        lat,lon = config['known_locations'][args.loc]
    else:   
        lat, lon = config['known_locations']['dc']
    
    aoi = helper.point_to_polygon(lat, lon, dim = 8000)



    print("Started - Fetching Data")
    item = get_first_item_no_clouds(aoi, target_date)



    print("Displaying Image")
    plt.imshow(item.get_visual())





if __name__ == "__main__":
    main()