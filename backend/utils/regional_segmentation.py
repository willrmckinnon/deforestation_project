from __future__ import annotations

import numpy as np
import xarray as xr
import geopandas as gpd

from scipy import ndimage
from shapely.geometry import shape
from skimage.morphology import disk
from rasterio.features import shapes


def segmented_regions(
    change_da: xr.DataArray,
    threshold: float = 0.10,
    minimum_width_pixels: int = 10,
    minimum_area_pixels: int = 100,
):
    """
    Return a gpd dataframe that contains all the regions in an xarray that
    meet the given thresholds

    Parameters
    ----------
    change_da: Signed DataArray with dimensions including y and x.
    rgb_da: Georeferenced RGB DataArray aligned to change_da.
    threshold: Minimum absolute NDVI change considered meaningful.
    minimum_width_pixels: Approximate minimum feature width retained by morphological opening.
    minimum_area_pixels: Connected regions smaller than this pixel count are discarded.

    Returns
    -------
    Dataframe sorted with the largest areas first
    """

    change_values = np.asarray(change_da.values).squeeze()

    if change_values.ndim != 2:
        raise ValueError(
            f"change_da must resolve to a 2D array, got shape "
            f"{change_values.shape}."
        )

    valid_mask = np.isfinite(change_values)
    change_mask = (valid_mask & (np.abs(change_values) > threshold))
    cleaned_mask = _remove_narrow_features(change_mask=change_mask,minimum_width_pixels=minimum_width_pixels)
    labeled_regions, number_of_regions = ndimage.label(cleaned_mask, structure=np.ones((3, 3), dtype=np.uint8))

    if number_of_regions == 0: return None

    labeled_regions = _remove_small_components(labeled_regions=labeled_regions, minimum_area_pixels=minimum_area_pixels,)
    unique_labels = np.unique(labeled_regions)
    unique_labels = unique_labels[unique_labels != 0]

    if len(unique_labels) == 0: return None

    segment_gdf = _polygonize_regions(
        labeled_regions=labeled_regions,
        change_values=change_values,
        change_da=change_da,
    )

    if segment_gdf.empty: return None

    segment_gdf = _add_area_columns(segment_gdf)
    segment_gdf = segment_gdf.sort_values("area_sqm", ascending=False).reset_index(drop=True)
    #largest_segment = segment_gdf.iloc[[0]].copy()
    
    return segment_gdf




def _remove_narrow_features(
    change_mask: np.ndarray,
    minimum_width_pixels: int = 10,
):
    if minimum_width_pixels <= 1: return change_mask.astype(bool)
    radius = max(1, minimum_width_pixels // 2)
    footprint = disk(radius)
    return ndimage.binary_opening(change_mask, structure=footprint)


def _remove_small_components(
    labeled_regions: np.ndarray,
    minimum_area_pixels: int,
):
    component_sizes = np.bincount(labeled_regions.ravel())
    keep_labels = np.where(component_sizes >= minimum_area_pixels)[0]
    keep_labels = keep_labels[keep_labels != 0]
    keep_mask = np.isin(labeled_regions, keep_labels)

    relabeled, _ = ndimage.label(keep_mask, structure=np.ones((3, 3), dtype=np.uint8))

    return relabeled


def _polygonize_regions(
    labeled_regions: np.ndarray,
    change_values: np.ndarray,
    change_da: xr.DataArray,
) -> gpd.GeoDataFrame:
    transform = change_da.rio.transform()
    crs = change_da.rio.crs

    if crs is None:
        raise ValueError(
            "change_da does not have a CRS. Assign one using "
            "change_da.rio.write_crs(...)."
        )

    rows: list[dict] = []

    for geometry_mapping, region_value in shapes(
        labeled_regions.astype(np.int32),
        mask=labeled_regions > 0,
        transform=transform,
    ):
        region_id = int(region_value)
        if region_id == 0: continue

        region_pixels = labeled_regions == region_id
        region_changes = change_values[region_pixels]
        region_changes = region_changes[np.isfinite(region_changes)]

        if region_changes.size == 0: continue

        mean_change = float(np.mean(region_changes))
        mean_absolute_change = float(np.mean(np.abs(region_changes)))
        loss_fraction = float(np.mean(region_changes > 0))
        gain_fraction = float(np.mean(region_changes < 0))

        predominant_change = (
            "vegetation_loss"
            if mean_change > 0
            else "vegetation_gain"
        )

        rows.append(
            {
                "segment_id": region_id,
                "pixel_count": int(region_pixels.sum()),
                "mean_ndvi_change": mean_change,
                "mean_abs_ndvi_change": mean_absolute_change,
                "minimum_ndvi_change": float(
                    np.min(region_changes)
                ),
                "maximum_ndvi_change": float(
                    np.max(region_changes)
                ),
                "loss_fraction": loss_fraction,
                "gain_fraction": gain_fraction,
                "predominant_change": predominant_change,
                "geometry": shape(geometry_mapping),
            }
        )

    return gpd.GeoDataFrame(rows, geometry="geometry", crs=crs)




def _add_area_columns(
    segment_gdf: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    result = segment_gdf.copy()

    if result.crs is None: raise ValueError("Segment GeoDataFrame has no CRS.")

    if result.crs.is_geographic:
        area_crs = result.estimate_utm_crs()

        if area_crs is None:
            raise ValueError(
                "Could not determine an appropriate projected CRS."
            )

        projected = result.to_crs(area_crs)
    else:
        projected = result

    result["area_sqm"] = projected.geometry.area.values
    result["area_sqkm"] = result["area_sqm"] / 1_000_000

    return result
