# Custom Functions
from backend.utils.helper import point_to_bbox

# Basic Libraries
import warnings
import odc.stac
import numpy as np
from PIL import Image
import rioxarray as rxr
import planetary_computer
import matplotlib.pyplot as plt
from pystac_client import Client
from shapely.geometry import shape
from shapely.ops import unary_union
from pympler.asizeof import asizeof
from datetime import datetime, timedelta

# Retry libraries
from urllib3 import Retry
from pystac_client.stac_api_io import StacApiIO


#SPECIFICALLY FOR SENTINEL ITEMS
#Class to collect items for a spacific observation area at a given time
class ObservedArea:
    def __init__(
            self, 
            aoi, 
            target_date, 
            windows,
            catalog,
            logger,
            collection = ['sentinel-2-l2a'],
            cloud_cover = 10
            ):
        
        self.aoi = aoi
        self.target_date = target_date
        self.collection = collection
        self.catalog = catalog
        self.logger = logger


        # ---------------------------
        # Iteratively attempt to collect with an increasing date window
        # ---------------------------
        for window in windows:
            start_day = str(self.target_date) 
            end_day = str(self.target_date - timedelta(days=window))
            date_window = end_day + '/' + start_day #Configure in a format for retrieval
            logger(f'Attempting Observation - {date_window}')

            # Attempt the search
            if self.get_items(date_window, cloud_cover): break


    #Function to collect the items associated with that area during that time
    def get_items(self, date_window, cloud_cover):
        #Selects only the most recent item from each MGRS tile
        def filter_items(items):
            latest_items = {}
            for item in items:
                # Get the Grid
                tile_id = item.properties.get("s2:mgrs_tile")
                
                if tile_id and tile_id not in latest_items:
                    latest_items[tile_id] = item

            return list(latest_items.values())
        #Confirms if the items cover the observation AOI
        def confirm_coverage(items):
            item_geoms = [shape(item.geometry) for item in items]
            combined_geom = unary_union(item_geoms)
            intersection = combined_geom.intersection(self.aoi)
            self.coverage = intersection.area / self.aoi.area

            if self.coverage > 0.9: return True
            else: return False       

        #---------------------------------------------
        #Search
        #---------------------------------------------
        search = self.catalog.search(
            collections=self.collection,
            bbox = self.aoi.bounds,
            datetime=date_window,
            query={"eo:cloud_cover": {"lt": cloud_cover}},
            sortby="eo:cloud_cover",
            max_items = 10
        )
        items = search.get_all_items()

        if len(items) >= 0 and confirm_coverage(items): 
            self.items = filter_items(items)
            return True
        else: return False


#---------------------------------------------------------------------
#-----------------------Support-Methods-------------------------------
#---------------------------------------------------------------------


    #Method to stack specified bands of the observation's items
    #RETURNS: Numpy Array and X Array
    def stack(self, bands):

        #Sign the items
        signed_items = []
        for item in self.items: signed_items.append(planetary_computer.sign(item))
        
        #collect the xarray
        xx = odc.stac.load(
            signed_items,
            bands = bands,
            geopolygon=self.aoi,
            resampling = 'bilinear',
            chunks = {'x': 512, 'y': 512}
        )
        self.logger(f'Resulting file size of {(asizeof(xx)/ 1000000000):.2f} GB')

        image_array = (
            xx
            .isel(time=0)[bands]
            .to_array()
            .transpose("y", "x", "variable")
            .values
        )

        return image_array, xx
    
    #Method to quickly return the visual as a PIL image
    def get_visual(self):
        rgb = self.stack(['B04', 'B03', 'B02'])[0]

        #Per band normalization
        rgb_scaled = rgb.copy()
        for i in range(rgb.shape[2]):
            band_max = 0.2 * rgb[:,:,i].max()
            rgb_scaled[:,:,i] = np.clip((rgb_scaled[:,:,i] / band_max), 0, 1)
        rgb_uint8 = (rgb_scaled * 255).astype(np.uint8)

        # Image creation
        return Image.fromarray(rgb_uint8)

    # Returns the entire tile image for analysis
    def get_whole_item(self, ind):
        signed_item = planetary_computer.sign(self.items[ind])
        visual_href = signed_item.assets["visual"].href
        img = rxr.open_rasterio(visual_href)
        return img




#---------------------------------------------------------------------
#-----------------------Calling-Function------------------------------
#---------------------------------------------------------------------


#Function to return an observation without clouds closest to target date
def collect_observation(lat, lon, sqkm, target_date: datetime.date, windows = [45], logger = print):
    # ---------------------------
    # Setup the AOI
    # ---------------------------
    aoi = point_to_bbox(lat, lon, sqkm)
    
    # ---------------------------
    # Setup the Client
    # ---------------------------
    retry = Retry(total=5, backoff_factor=1,status_forcelist=[502, 503, 504],allowed_methods=None)
    stac_api_io = StacApiIO(max_retries=retry)
    catalog = Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", stac_io = stac_api_io)

    # ---------------------------
    # Get the observation
    # ---------------------------
    warnings.filterwarnings("ignore")
    obs =ObservedArea(aoi, target_date, windows, catalog, logger)

    return obs




