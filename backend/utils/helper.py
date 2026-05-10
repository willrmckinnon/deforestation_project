import yaml

from shapely.geometry import box, Polygon
from pyproj import Transformer

from PIL import Image, ImageDraw, ImageTk
import tkinter as tk

import geopandas as gpd

import xarray
import numpy as np
#import matplotlib.pyplot as plt


#Reads the config file
def load_config():
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)
    return config


#converts a point to a polygon
def point_to_polygon(lat, lon, dim=4000):
    # WGS84 → Web Mercator (meters)
    to_m = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    to_wgs = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)

    # convert center point to meters
    x, y = to_m.transform(lon, lat)

    half_size = dim/2 

    # create square in meters
    square = box(
        x - half_size, y - half_size,
        x + half_size, y + half_size
    )

    # convert back to WGS84
    coords = [
        list(to_wgs.transform(px, py))
        for px, py in square.exterior.coords
    ]

    return Polygon(coords)


#Simple function to convert a normalize a muliband nparray or xarray for display
def normalize_per_band(img, saturation = 5, xarraybands=["B02", "B03", "B04"]):
    def normalize_nparray(img, saturation):
        img = img.astype(np.float32)
        out = np.zeros_like(img, dtype=np.float32)

        for b in range(img.shape[-1]):
            band = img[:, :, b]

            min_val = np.min(band)
            max_val = np.max(band)

            if max_val > min_val:
                out[:, :, b] = saturation * (band - min_val) / (max_val - min_val)
            else:
                out[:, :, b] = 0.0  # constant band fallback
    
        return out
    
    def normalize_xarray(img, saturation, xarraybands):
        xx = img.copy()
        for band in xarraybands:
            arr = xx[band]
            band_min = arr.min()
            band_max = arr.max()

            xx[band] = (saturation * (arr - band_min)) / (band_max - band_min + 1e-6)

        return xx
    
    
    img_type = str(type(img)).split('.')[-1].split('\'')[0]
    if img_type == 'ndarray': return normalize_nparray(img, saturation)
    elif img_type == 'Dataset': return normalize_xarray(img, saturation, xarraybands = xarraybands)
    else: raise RuntimeError('Cannot normalize array - invalid data type - normalize_per_band() requires xarray or np.array')


#Complex function to make an image out of Image, Xarray or NParray
'''
def disp_image(img, xarraybands=["B02", "B03", "B04"]):
    def pil_image(image):
        #Display if the image type is a pilllow image
        root = tk.Tk()
        root.title("Simple Image Display")

        y, x = image.height, image.width
        new_y = 1000
        new_x = int((new_y/y) * x)
        image = image.resize((new_x, new_y))

        photo = ImageTk.PhotoImage(image)
        label = tk.Label(root, image=photo)
        label.image = photo 
        label.pack()
        root.mainloop()

    def nparray_image(image):
        rgb = image[:, :, [2, 1, 0]]

        rgb = rgb.astype("float32")
        rgb = np.clip(rgb, 0, 1)

        # Plot
        plt.figure(figsize=(8, 8))
        plt.imshow(rgb)
        plt.axis("off")
        plt.show()

    def xx_image(image, xarraybands):   
        #Convert to an nparray and then display
        if 'time' in image.dims:            
            rgb = (
                image[xarraybands]
                .to_array()
                .isel(time=0)
                .transpose("y", "x", "variable")
                .values
            )
        else:
            rgb = (
                image[xarraybands]
                .to_array()
                .transpose("y", "x", "variable")
                .values
            )
        nparray_image(rgb)

    img_type = str(type(img)).split('.')[-1].split('\'')[0]
    if img_type == 'Image': pil_image(img)
    elif img_type == 'ndarray': nparray_image(img)
    elif img_type == 'Dataset': xx_image(img, xarraybands=["B02", "B03", "B04"])
    else: raise RuntimeError('Cannot produce image - invalid data type - simple_image() requires Pillow Image, xarray or np.array')
'''

#Simple function to return the area of a polygon that is in WGS coordinates
def get_wgs_area(poly):
    gdf = gpd.GeoDataFrame(index=[0], crs='EPSG:4326', geometry=[poly])
    A = gdf.to_crs('EPSG:32618').area[0]
    return A/1000000 #Will return result in square km


#Simple function to convert xarray to PIL Image
def xarray_to_img(xr):
    rgb = xarray.DataArray(np.zeros((xr.shape)), dims = ('band', 'y', 'x'))
    i=0
    #normalize
    for band in xr:
        band_max = int(band.max())
        rgb[i] = (band/(band_max*0.75)).clip(min=0, max=1, keep_attrs = True)
        i+=1


    rgb = rgb.transpose('y', 'x', 'band')
    rgb_uint8 = (rgb.values * 255).astype(np.uint8)
    return Image.fromarray(rgb_uint8)

#Function to convert np array into a PIL Image
def npy_to_img(img, saturation = 1):
    rgb = img[:,:,[2, 1, 0]].astype(np.float32)

    low = np.percentile(rgb,2)
    high = np.percentile(rgb, 98)

    rgb = (rgb-low)/(high - low)

    #Saturate and normalize
    sat = np.clip(rgb * saturation, 0, 1)
    norm_sat = (sat * 255).astype(np.uint8)

    
    return Image.fromarray(norm_sat)

