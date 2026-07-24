# Custom Imports
from utils.helper import image_to_base64
from utils.regional_segmentation import segmented_regions
from investigations.investigation_class import Investigation

# Configure Matplotlib to run as non-interactive 
import matplotlib
matplotlib.use("Agg")

# Library Imports
import json
import numpy as np
import xarray as xr
from PIL import Image
from typing import Any
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import box
from odc.geo import Geometry, CRS
import matplotlib.dates as mdates
from itertools import combinations
from scipy.interpolate import make_interp_spline



# --------------------------------------------------
# Support Functions for calculating NDVI 
# --------------------------------------------------
def set_ndvi(obs):
    ndvi_bands = ['B04','B08']
    ndvi_stack = obs.stack(ndvi_bands)
    ndvi_xx=ndvi_stack[1]
    red_band = ndvi_xx['B04']
    nir_band = ndvi_xx['B08']

    return (nir_band-red_band)/(nir_band+red_band)



def ndvi_heatmap(ndvi, cmap="viridis"):
    ndvi_arr = ndvi.to_numpy()
    arr = np.clip(ndvi_arr, 0, 1)

    # Apply colormap from plt
    rgba = plt.get_cmap(cmap)(arr)

    # Convert to uint8 RGB
    rgb = (rgba[:, :, :3] * 255).astype(np.uint8)
    return Image.fromarray(rgb)




def create_ndvi_comparison_masks(
    observations: list[Any],
    transparent_threshold: float = 0.05,
    full_opacity_threshold: float = 0.3,
) -> list[dict[str, str]]:
    """
    Create an NDVI-change heat mask for every chronological observation pair.

    Each observation must have:
      - observation.date
      - observation.ndvi: xarray.DataArray

    Color convention:
      - Green: base NDVI is higher than comparison NDVI
               (NDVI decreased over time)
      - Red:   comparison NDVI is higher than base NDVI
               (NDVI increased over time)

    Opacity:
      - abs(change) <= transparent_threshold: transparent
      - abs(change) between thresholds: linearly increasing opacity
      - abs(change) >= full_opacity_threshold: fully opaque

    Returns:
        A list of dictionaries compatible with the frontend
        NdviComparisonMask type.
    """


    #Create one transparent RGBA NDVI-change mask
    def create_ndvi_change_mask(
        base_ndvi: np.ndarray,
        comparison_ndvi: np.ndarray,
        transparent_threshold: float = 0.02,
        full_opacity_threshold: float = 0.10,
    ) -> Image.Image:

        valid_pixels = (np.isfinite(base_ndvi) & np.isfinite(comparison_ndvi))

        # Positive values mean NDVI decreased:
        # base NDVI was greater than the later NDVI.
        ndvi_change = base_ndvi - comparison_ndvi
        change_magnitude = np.abs(ndvi_change)

        normalized_opacity = (
            change_magnitude - transparent_threshold
        ) / (
            full_opacity_threshold - transparent_threshold
        )

        normalized_opacity = np.clip(normalized_opacity, 0.0, 1.0,)

        alpha = np.round(normalized_opacity * 255).astype(np.uint8)
        alpha[~valid_pixels] = 0
        rgba = np.zeros((*base_ndvi.shape, 4), dtype=np.uint8,)

        ndvi_decreased = ((ndvi_change > 0) & valid_pixels)
        ndvi_increased = ((ndvi_change < 0) & valid_pixels)

        # Green where NDVI decreased.
        rgba[ndvi_decreased, 0] = 255
        rgba[ndvi_decreased, 1] = 0
        rgba[ndvi_decreased, 2] = 0

        # Red where NDVI increased.
        rgba[ndvi_increased, 0] = 0
        rgba[ndvi_increased, 1] = 255
        rgba[ndvi_increased, 2] = 0

        rgba[..., 3] = alpha

        return Image.fromarray(rgba, mode="RGBA")


    # Convert datetime, date, or date-like values to YYYY-MM-DD
    def format_observation_date(date_value: Any) -> str:
        if hasattr(date_value, "strftime"):
            return date_value.strftime("%Y-%m-%d")

        return str(date_value).split("T")[0]


    
    sorted_observations = sorted(observations, key=lambda observation: observation.date)
    masks: list[dict[str, str]] = []

    for base_observation, comparison_observation in combinations(sorted_observations, 2,):
        base_ndvi, comparison_ndvi = xr.align(
            base_observation.ndvi,
            comparison_observation.ndvi,
            join="exact",
        )

        # Extract Areas of change
        regions_gdf = segmented_regions(comparison_ndvi-base_ndvi)
        largest_area = regions_gdf.iloc[0].copy()
        largest_geometry_wgs84 = (
            gpd.GeoSeries(
                [largest_area.geometry],
                crs=regions_gdf.crs,
            ).to_crs("EPSG:4326").iloc[0]
        )
        bounds = box(*largest_geometry_wgs84.bounds)
        aoi_geometry = Geometry(
            bounds.__geo_interface__,
            CRS("EPSG:4326"),
        ) 
        largest_area_img = comparison_observation.get_image(aoi=aoi_geometry)


        base_array = np.asarray(base_ndvi.values, dtype=np.float32)
        comparison_array = np.asarray(comparison_ndvi.values, dtype=np.float32)

        if base_array.ndim != 2 or comparison_array.ndim != 2:
            raise ValueError("Each NDVI observation must be a two-dimensional array.")

        if base_array.shape != comparison_array.shape:
            raise ValueError("NDVI observations must have matching pixel dimensions.")

        mask_image = create_ndvi_change_mask(
            base_ndvi=base_array,
            comparison_ndvi=comparison_array,
            transparent_threshold=transparent_threshold,
            full_opacity_threshold=full_opacity_threshold,
        )

        masks.append(
            {
                "baseDate": format_observation_date(base_observation.date),
                "comparisonDate": format_observation_date(comparison_observation.date),
                "image": image_to_base64(mask_image),
                "change_area_gdf": json.loads(regions_gdf.head(10).to_json()),
                "change_area_image": image_to_base64(largest_area_img),
            }
        )

    return masks






# --------------------------------------------------
# Class
# --------------------------------------------------
class NDVIInvestigation(Investigation):
    def __init__(self,
                lat, lon,
                sqkm,
                observation_increments = [], #Years back to search
                logger = print
                ):
        
            
        super().__init__(lat, lon, sqkm, observation_increments, logger)    




    # A method unique to each investigation type that completes the setup
    def complete_setup(self):
        placeholder = None
 




    # Method to generate the return for each batch
    def single_obs_mask(self, obs, model_info):
        # Setup Containers for logger return to frontend
        result = {}

        # Set basic info to return
        result['model_name'] = model_info['tag']
        result['model_tag'] = model_info['tag']
        result['batchId'] = obs.batch

        # Set image to return
        obs.ndvi = set_ndvi(obs)
        heatmap_img = ndvi_heatmap(obs.ndvi)
        result['image'] = image_to_base64(heatmap_img)

        # Calculate mean NDVI and add to data
        result['mean_ndvi'] = float(obs.ndvi.mean(skipna=True).values)

        # Perform calculations and set metadata to return
        metadata = {}
        labels = []
        forest_threshold = 0.3
        percent_veg = float((obs.ndvi > forest_threshold).mean() * 100)
        percent_veg = f'{percent_veg:.2f}%'
        veg_count = float((obs.ndvi > forest_threshold).sum())
        veg_area = veg_count/10000
        veg_area = f'{veg_area:.2f} sqkm'

        labels.append({
            'class': 'NDVI Detected Vegetation',
            'sub': percent_veg,
            'Total Area of Vegetation:': str(veg_area),
            'Percentage of Observation with Vegetation:': percent_veg,
        })

        metadata['labels'] = labels
        


        #Set metadata to return
        result['metadata'] = metadata

        # Return the data to the frontend
        self.logger([result],'model_return')










    # method to generate a complete report of change
    def analyze_change(self, model_info):
        report = {
            'type': model_info['tag']
        }

        report['comparison_masks'] = create_ndvi_comparison_masks(self.observations)


        self.logger(report, 'change_report')  






