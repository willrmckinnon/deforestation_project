# Custom Functions
from backend.utils.helper import point_to_bbox, crop32
from backend.models.utils.display import sentinel_worldcover_image_and_mask_display as wc_display

# Basic Libraries
import warnings
import odc.stac
import numpy as np
from PIL import Image
import rioxarray as rio
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
            logger = print,
            collection = ['sentinel-2-l2a'],
            cloud_cover = 30
            ):
        
        self.aoi = aoi
        self.target_date = target_date
        self.collection = collection
        self.catalog = catalog
        self.logger = logger
        self.items = []
        self.date = None
        self.masks = {}

        # ---------------------------
        # Iteratively attempt to collect with an increasing date window
        # ---------------------------
        for window in windows:
            start_day = str(self.target_date) 
            end_day = str(self.target_date - timedelta(days=window))
            date_window = end_day + '/' + start_day #Configure in a format for retrieval
            #logger(f'Attempting Observation - {date_window}')

            # Attempt the search
            if self.get_items(date_window, cloud_cover): break




    #Function to collect the items associated with that area during that time
    def get_items(self, date_window, cloud_cover):

        #Selects only the most recent item from each MGRS tile
        def filter_items(items):
            #filter out those with clouds over AOI
            cloudless_items = []
            for item in items:
                scl = self.stack(['SCL'],[item])[0]
                cloud_mask = np.isin(scl, [1, 3, 7, 8, 9, 10,11]).astype('int64')
                cloud_fraction = cloud_mask.mean()
                if cloud_fraction < 0.1: cloudless_items.append(item)
            #Only take the most recent item of each MGRS grid
            latest_items = {}
            for item in cloudless_items:
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

        # Sets the date for the observation
        # If observation contains items from multiple dates, will select the oldest date (first date)
        def set_date():
            dates = []
            for item in self.items:
                date_str = item.properties['datetime'][:10]
                dates.append(datetime.strptime(date_str,'%Y-%m-%d'))
            self.date = min(dates).date()       

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
        items = filter_items(items)

        if len(items) >= 0 and confirm_coverage(items): 
            self.items = items
            set_date()
            self.logger(f'Observation collected on {self.date}')
            return True
        else: return False


#---------------------------------------------------------------------
#-----------------------Support-Methods-------------------------------
#---------------------------------------------------------------------


    #Method to stack specified bands of the observation's items
    #RETURNS: Numpy Array and X Array
    def stack(self, bands, items = None):
        if items == None: items = self.items
        #Sign the items
        signed_items = []
        for item in items: signed_items.append(planetary_computer.sign(item))
        
        #collect the xarray
        xx = odc.stac.load(
            signed_items,
            bands = bands,
            geopolygon=self.aoi,
            resampling = 'bilinear',
            chunks = {'x': 512, 'y': 512}
        )
        #self.logger(f'Resulting file size of {(asizeof(xx)/ 1000000000):.2f} GB')
        xx = xx[bands].median(dim="time")
        image_array = (
            xx
            .to_array()
            .transpose("y", "x", "variable")
            .values
        )

        return image_array, xx
    
    #Method to quickly return the visual as a PIL image
    def get_image(self,
                    mask_type = None,
                    saturation = 2,
                    pos_color = [255, 0, 0],
                    neg_color = [0, 255, 0]
                   ):
        data = self.stack(['B02','B03','B04'])[0]
        data =crop32(np.transpose(data,(2,0,1)))
        data = np.transpose(data,(1,2,0))
        norm_data = np.zeros(data.shape)

        for i in range(data.shape[2]):
            band = data[:,:,i]
            band = (band - band.min()) / (band.max() - band.min())
            band = (255 * band).astype(np.uint8)
            norm_data[:,:,i] = band
        norm_data = norm_data[:,:,[2,1,0]]
        norm_data = np.clip((norm_data * saturation),0,255).astype(np.uint8)

        # Add a mask if requested and return
        if mask_type:
            overlay = norm_data.copy()
            mask = self.masks[mask_type]['mask']
            label_map = self.masks[mask_type]['metadata']['label_map']
            for label, _ in label_map.items():
                if label != 0:
                    overlay[mask == label] = [np.random.randint(50, 256, size=3, dtype=np.uint8)]
            overlay = overlay.astype(np.uint8)
            return Image.fromarray(overlay)
        else:
            return Image.fromarray(norm_data)


    # Returns the entire tile image for analysis
    def get_whole_item(self, ind):
        signed_item = planetary_computer.sign(self.items[ind])
        visual_href = signed_item.assets["visual"].href
        img = rio.open_rasterio(visual_href)
        return img



    # Provided a model, creates the mask for the observation 
    def inference(self, model, mask_type):
        '''
        Mehod designed specifically for a model with the following characteristics
        - Model contains .bands <list> attribute that lists the various sentinel bands required as input
        - Model requires input height and width to be in multiples of 32
        - Model is designed to receive input in (B x H x W) shape
        '''
        # Setup the data
        bands = model.bands
        data, xx = self.stack(bands)
        data = np.transpose(data, (2,0,1))
        transform = xx.rio.transform()
        data, transform = crop32(data, transform)

        #Add crs and transform to metadata
        metadata = model.mask_tag
        metadata['transform'] = transform
        metadata['crs'] = xx.rio.crs

        # Inference
        mask = model.inference(data)

        self.masks[mask_type] = {
            'mask': mask,
            'data': data,
            'metadata': metadata
        }

        if self.logger != print: 
            self.logger(f'Mask of observation {self.date}')
            self.logger(self.get_image(mask_type=mask_type),'image')


    def display_mask_on_image(self, model_tag):
        mask = self.masks[model_tag]
        if mask['metadata']['label_map'] and mask['metadata']['wc_code_map']:
            wc_display(mask['data'], mask['mask'], 
                label_map=mask['metadata']['label_map'], 
                wc_code_map=mask['metadata']['wc_code_map'])
        else: wc_display(mask['data'], mask)





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
    obs = ObservedArea(aoi, target_date, windows, catalog, logger)

    return obs




