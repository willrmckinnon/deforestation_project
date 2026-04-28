from pystac_client import Client
import rasterio
import planetary_computer
import numpy as np
from datetime import datetime, timedelta
import warnings

from rasterio import windows, features, warp
from rasterio.features import shapes
from rasterio.enums import Resampling

from shapely.geometry import shape, Polygon, mapping
from shapely.ops import unary_union

import geopandas as gpd
import pandas as pd

import cv2

import torch
import torch.nn as nn

from PIL import Image

from utils import helper

import stackstac
import dask.diagnostics
from pympler.asizeof import asizeof




#SPECIFICALLY FOR SENTINEL ITEMS
#Class to collect items for a spacific observation area at a given time
class ObservedArea:
    def __init__(self, aoi, date_window, cloud_threshold = None):
        self.aoi = aoi
        self.date_window = date_window
        self.cloud_threshold = cloud_threshold

        candidate_items = self.get_items()

        if len(candidate_items) > 0: 
            self.items, self.coverage = self.filter_items(candidate_items)
        else: 
            self.items = []
            self.coverage = 0


    #Function to collect the items associated with that area during that time
    def get_items(self):
        items = []
        
        catalog = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier = planetary_computer.sign_inplace)

        #Setup the Search
        if self.cloud_threshold == None:
            #Search without filtering clouds
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                intersects=mapping(self.aoi),
                datetime=self.date_window
            )
        else:
            #Search with cloud filter
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                intersects=mapping(self.aoi),
                datetime=self.date_window,
                query={"eo:cloud_cover": {"lt": self.cloud_threshold}}
            )



        #Collect the items and save as class Item in list
        return list(search.get_items())
  


    #method to take all the potential items and only get the most recent without cloud cover
    def filter_items(self, item_candidates):
        #A SERIES OF CHECKS
        items = []

        #Filter to only look at the newest item for each tile -----------
        df = pd.DataFrame()
        for item in item_candidates:
            new_row = pd.DataFrame({
                'item': [item],
                'tile': [item.properties['s2:mgrs_tile']],
                'date': [item.datetime]
            })
            df = pd.concat([df,new_row], ignore_index=True)

        tile_names = list(set(df['tile']))

        #Find the newest item and save to list
        for name in tile_names:
            tile_df = df[df['tile'] == name]
            row = tile_df[tile_df['date'] == max(tile_df['date'])]
            items.append(row.iloc[0]['item'])


        #Check that the total area is covered --------------
        area_list = []
        for item in items:
            item_poly = Polygon(item.geometry['coordinates'][0])
            area_list.append(item_poly)

        #Calculate first and last date ----------------------
        dates = []
        for item in items: dates.append(item.datetime)
        first = min(dates)
        earliest_date = f'{first.year}-{first.month}-{first.day}'
        last = max(dates)
        latest_date = f'{last.year}-{last.month}-{last.day}'


        #Calc combined area of tiles and subtract from aoi
        tot_coverage = unary_union(area_list) 
        diff_poly = self.aoi.difference(tot_coverage)
        missing_area = helper.get_wgs_area(diff_poly) #in square kilometers
        aoi_area = helper.get_wgs_area(self.aoi)
        coverage = (aoi_area-missing_area)/aoi_area
        print(f'{self.cloud_threshold}% Cloud Cover: {len(items)} item(s) collected with {100*coverage:.2f}% of AOI covered -- Collected between {earliest_date} and {latest_date}', flush = True, end='\r' )
        
        return items, coverage



#Function to return an observation without clouds closest to target date
def get_observation_no_clouds(aoi, target_date: datetime.date, max_attempts = 3, max_cloud_threshold = 50):
    num_days_per_attempt = 30
    start_cloud_threshold = 20


    obs = None
    for attempt in range(max_attempts):

        #Setup observation window
        delay = int(attempt * num_days_per_attempt)
        start_day = str(target_date) 
        end_day = str(target_date - timedelta(days=delay))
        date_window = end_day + '/' + start_day #Configure in a format for retrieval
        print(f'Attempt {attempt+1} - {date_window}', end = '\r', flush=True)
        


        warnings.filterwarnings("ignore")
        temp_obs = ObservedArea(aoi, date_window, cloud_threshold=start_cloud_threshold)

        if temp_obs.coverage < 0.9: continue
        else:
            obs = temp_obs
            return obs


    #Increment the cloud threshold
    for threshold in range(start_cloud_threshold, max_cloud_threshold+1, 10):
        warnings.filterwarnings("ignore")
        temp_obs = ObservedArea(aoi, date_window, cloud_threshold=threshold)
        
        if temp_obs.coverage < 0.9: continue
        else:
            obs = temp_obs
            return obs

            
    if obs == None: 
        raise Exception(f'No item without clouds found within {max_attempts*num_days_per_attempt} days of the search date')



#Function to stitch together all the items in an observation to get a single snapshot for given bands
def merge_obs(obs, bands):
    if len(obs.items) < 1: raise Exception('Attempted to merge items for an empty observation')
    signed_items = [planetary_computer.sign(item) for item in obs.items]

    stack = stackstac.stack(
        signed_items, 
        bounds_latlon=obs.aoi.bounds,
        assets = bands,
        epsg = 4326)
    median = stack.median(dim="time")

    with dask.diagnostics.ProgressBar():
        result = median.compute()
        print(f'Resulting file size of {(asizeof(result)/ 1000000000):.2f} GB')

    return result

    



#Function to return an observation without clouds closest to target date
def get_first_item_no_clouds(aoi, target_date: datetime.date, max_attempts = 12):
    num_days_per_attempt = 5


    item = None
    for attempt in range(max_attempts):
        print(f'Attempt {attempt+1} ', end = '\r', flush=True)

        #Calculate the start and end dates for this search
        delay1 = int((attempt-1) * num_days_per_attempt)
        delay2 = int(attempt * num_days_per_attempt)
        start_day = str(target_date - timedelta(days=delay1)) 
        end_day = str(target_date - timedelta(days=delay2))
        date_window = end_day + '/' + start_day #Configure in a format for retrieval

        warnings.filterwarnings("ignore")
        obs = ObservedArea(aoi, date_window, filter_cloud_cover=True)

        if len(obs.items) < 1: continue
        else:
            item = obs.items[0]
            print(f'First Item with no clouds found on {item.date}')
            return item

            
    if item == None: 
        raise Exception(f'No item without clouds found within {max_attempts*num_days_per_attempt} days of the search date')


