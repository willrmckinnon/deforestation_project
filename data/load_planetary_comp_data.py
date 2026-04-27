from pystac_client import Client
import rasterio
import planetary_computer
import numpy as np
from datetime import datetime, timedelta

from rasterio import windows, features, warp
from rasterio.features import shapes
from rasterio.enums import Resampling

from shapely.geometry import shape, Polygon

import geopandas as gpd

import cv2

import torch
import torch.nn as nn

from PIL import Image


#SPECIFICALLY FOR SENTINEL ITEMS
#Primary class that performs actions on a a particular planetary_computer item
class Sentinel_Item:
    def __init__(self, item, aoi):
        self.item = item
        self.date = item.properties['datetime'][:10]
        
        #Collect the specific window in the item
        with rasterio.open(item.assets["visual"].href) as ds:
            aoi_bounds = features.bounds(aoi)
            warped_aoi_bounds = warp.transform_bounds("epsg:4326", ds.crs, *aoi_bounds)
            aoi_window = windows.from_bounds(*warped_aoi_bounds, transform=ds.transform)
            self.window = aoi_window.round_offsets().round_lengths()
            self.transform = ds.window_transform(self.window)
            self.crs = ds.crs
        
        #Add coverage information
        if item.properties['s2:high_proba_clouds_percentage']> 40: 
            self.cloud_cover = True
        else: self.cloud_cover = False

        if item.properties['s2:thin_cirrus_percentage']> 10:
            self.haze = True
        else: self.haze = False


    #Function to display the visual of the item
    def get_visual(self):
        #Setup the image
        with rasterio.open(self.item.assets["visual"].href) as ds:
            band_data = ds.read(window=self.window)

        #Format the image for viewing
        img = Image.fromarray(np.transpose(band_data, axes=[1, 2, 0]))

        return img
    

    def get_array(self):
        with rasterio.open(self.item.assets["visual"].href) as ds:
            return ds.read(window=self.window)



    #A function to collect the data from a specific band, not just visual
    def collect_band_data(self, band, shape = None):
        href = self.item.assets[band].href

        with rasterio.open(href) as ds:            
            #Method of reading the data depends on whether we neeed to define the exact shape
            if shape == None:
                return ds.read(1, window=self.window)    
            else:
                return ds.read(
                    1,
                    window = self.window,
                    out_shape = shape,
                    resampling = Resampling.bilinear
                )



    #Function to collect the thermal data for a given item
    #Thermal logic taken from: https://www.sciencedirect.com/science/article/pii/S0924271621001337?via%3Dihub
    def get_thermals(self):
        self.thermal_bands = {}

        self.thermal_bands['B8A'] = self.collect_band_data('B8A')

        ref_shape = self.thermal_bands['B8A'].shape
        for band in ['B11', 'B12']:
            self.thermal_bands[band] = self.collect_band_data(band, shape = ref_shape)

        SWIR1, SWIR2, NIR = self.thermal_bands['B11'], self.thermal_bands['B12'], self.thermal_bands['B8A']

        self.thermal_array1 = (SWIR2 - SWIR1)/NIR
        self.thermal_array2 = (SWIR2 - SWIR1)/(SWIR1 - NIR)

        viewable_array1 = np.clip(self.thermal_array1/20 , 0, 1)
        viewable_array2 = np.clip(self.thermal_array2/20 , 0, 1)

        thermal_view1 = Image.fromarray((viewable_array1 * 255).astype("uint8"))
        thermal_view2 = Image.fromarray((viewable_array2 * 255).astype("uint8"))

        return [thermal_view1, thermal_view2]




#SPECIFICALLY FOR SENTINEL ITEMS
#Class to collect items for a spacific observation area at a given time
class ObservedArea:
    def __init__(self, aoi, datetime, filter_cloud_cover = False):
        self.aoi = aoi
        self.datetime = datetime
        self.filter_cloud_cover = filter_cloud_cover

        self.get_items()


    #Function to collect the items associated with that area during that time
    def get_items(self):
        self.items = []
        
        catalog = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier = planetary_computer.sign_inplace)

        #Setup the Search
        if self.filter_cloud_cover:
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                intersects=self.aoi,
                datetime=self.datetime,
                query={"eo:cloud_cover": {"lt": 5}}
            )
        else:
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                intersects=self.aoi,
                datetime=self.datetime
            )

        #Collect the items and save as class Item in list
        item_names = list(search.get_items())
        for name in item_names: self.items.append(Sentinel_Item(name, self.aoi))


def get_first_item_no_clouds(aoi, target_date: datetime.date, max_attempts = 10):
    num_days_per_attempt = 6


    item = None
    for attempt in range(max_attempts):
        #Calculate the start and end dates for this search
        delay1 = int((attempt-1) * num_days_per_attempt)
        delay2 = int(attempt * num_days_per_attempt)
        start_day = str(target_date - timedelta(days=delay1)) 
        end_day = str(target_date - timedelta(days=delay2))
        date_window = end_day + '/' + start_day #Configure in a format for retrieval

        obs = ObservedArea(aoi, date_window, filter_cloud_cover=True)

        if len(obs.items) < 1: continue
        else:
            item = obs.items[0]
            print(f'First Item with no clouds found on {item.date}')
            return item

            
    if item == None: 
        raise Exception(f'No item without clouds found within {max_attempts*num_days_per_attempt} days of the search date')


