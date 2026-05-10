from pystac_client import Client
import numpy as np
from datetime import datetime, timedelta
import time
import warnings

import planetary_computer
import rasterio
from rasterio import windows, features, warp
from rasterio.features import shapes
from rasterio.enums import Resampling
import odc.stac
from shapely.geometry import shape, Polygon, mapping
from shapely.ops import unary_union
import dask.diagnostics
from pympler.asizeof import asizeof

from collections import defaultdict

from utils import helper

#Retry libs
from urllib3 import Retry
from pystac_client.stac_api_io import StacApiIO


#SPECIFICALLY FOR SENTINEL ITEMS
#Class to collect items for a spacific observation area at a given time
class ObservedArea:
    def __init__(
            self, 
            aoi, 
            date_window, 
            catalog,
            cloud_threshold = 100, 
            collection = ['sentinel-2-l2a']
            ):
        
        self.aoi = aoi
        self.date_window = date_window
        self.cloud_threshold = cloud_threshold
        self.collection = collection
        self.catalog = catalog
        self.observation_report = None


        self.get_items()
        self.check()


    #Function to collect the items associated with that area during that time
    def get_items(self):
        min_cloud_threshold = 10

        def filter_items(items):
            latest_items = {}
            for item in items:
                # Get the Grid
                tile_id = item.properties.get("s2:mgrs_tile")
                
                if tile_id and tile_id not in latest_items:
                    latest_items[tile_id] = item

            return list(latest_items.values())

        #Iterate the search with increasing cloud threshold until enough area is covered
        for clouds in range(min_cloud_threshold, self.cloud_threshold+1, 10):
            items = None
            search = self.catalog.search(
                collections=self.collection,
                intersects=mapping(self.aoi),
                datetime=self.date_window,
                sortby="-properties.datetime",
                query={"eo:cloud_cover": {"lt": clouds}},
                max_items = 10
            )
            items = search.get_all_items()



            if len(items) > 0:
                self.items = filter_items(items)
                if self.get_coverage() > 0.9:
                    self.cloud_cover = clouds
                    break
            elif clouds >= self.cloud_threshold-9:
                self.items = None
                self.cloud_cover = self.clouds
        

    def get_coverage(self):
        aoi_area = helper.get_wgs_area(self.aoi)

        geom_list = []
        for item in self.items:
            geom_list.append(shape(item.geometry))

        difference = self.aoi - unary_union(geom_list)
        diff_area = helper.get_wgs_area(difference)
        
        coverage = (aoi_area - diff_area) / aoi_area
        return coverage




    #Check to print the observation characteristics
    def check(self):
        #---------------------------------------------------
        #Check that the total area is covered 
        #---------------------------------------------------
        coverage = self.get_coverage()


        #---------------------------------------------------
        #Calculate first and last date 
        #---------------------------------------------------
        dates = []
        for item in self.items: dates.append(item.datetime)
        first = min(dates)
        earliest_date = f'{first.year}-{first.month}-{first.day}'
        last = max(dates)
        latest_date = f'{last.year}-{last.month}-{last.day}'        
        
        self.observation_report = f'{self.cloud_cover}% Cloud Cover: {len(self.items)} item(s) collected with {100*coverage:.2f}% of AOI covered -- Collected between {earliest_date} and {latest_date}'

        print(self.observation_report, flush = True )


    

    #Method to stack specified bands of the observation's items
    #RETURNS: Numpy Array and X Array
    def stack(self, bands):

        #Sign the items
        signed_items = []
        for item in self.items:
            signed_items.append(planetary_computer.sign(item))
        
        #collect the xarray
        #with dask.diagnostics.ProgressBar():
        xx = odc.stac.load(
            signed_items,
            bands = bands,
            geopolygon=self.aoi,
            resampling = 'bilinear',
            chunks = {'x': 512, 'y': 512}
        )
        print(f'Resulting file size of {(asizeof(xx)/ 1000000000):.2f} GB', flush = True)

        image_array = (
            xx
            .isel(time=0)[bands]
            .to_array()
            .transpose("y", "x", "variable")
            .values
        )

        return image_array, xx



#Function to return an observation without clouds closest to target date
def standard_observation(aoi, target_date: datetime.date, max_cloud_threshold = 50):
    
    # ---------------------------
    # Setup the Client
    # ---------------------------
    retry = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[502, 503, 504],
        allowed_methods=None
    )
    stac_api_io = StacApiIO(max_retries=retry)

    catalog = Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1", 
        stac_io = stac_api_io
        )

    # ---------------------------
    # Setup the Date Window
    # ---------------------------

    #Setup observation window
    delay = 90
    start_day = str(target_date) 
    end_day = str(target_date - timedelta(days=delay))
    date_window = end_day + '/' + start_day #Configure in a format for retrieval
    print(f'Attempting Observation - {date_window}', flush=True)


    # ---------------------------
    # Get the observation
    # ---------------------------
    warnings.filterwarnings("ignore")
    obs =ObservedArea(aoi, date_window, catalog, cloud_threshold = max_cloud_threshold)

    return obs




