import os
import boto3
from botocore import UNSIGNED
from botocore.config import Config

import rasterio
import numpy as np
import pandas as pd
from pathlib import Path



def main():
    # Public bucket access
    s3 = boto3.client(
        "s3",
        config=Config(signature_version=UNSIGNED),
        region_name="eu-central-1"
    )

    BUCKET = "esa-worldcover"



    # Collect all the tif files
    tif_files = []

    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(
        Bucket=BUCKET,
        Prefix="v200/2021/map/"
    ):

        for obj in page.get("Contents", []):

            key = obj["Key"]

            if key.endswith(".tif"):
                tif_files.append(key)

    print(f"Found {len(tif_files)} tif files")

    # Collect data for each row
    rows = []

    for file_name in tif_files:
        try:
            file_path = Path("https://esa-worldcover.s3.amazonaws.com/") / file_name
            url = (file_path)
        
            with rasterio.open(url) as src:

                for tag, val in src.profile.items():
                    if tag == 'transform': transform = val

                rows.append({
                    'id': file_name.split('_')[5],
                    'name': file_name,
                    'path': file_path,
                    'url': url,
                    'year': file_name.split('/')[1],
                    'crs': src.crs,
                    'height': src.shape[0],
                    'width': src.shape[1],
                    'left': src.bounds.left,
                    'bottom': src.bounds.bottom,
                    'right': src.bounds.right,
                    'top': src.bounds.top,
                    'bounds': src.bounds,
                    'transform': transform
                })
        except Exception as e: print(f'Failed for {file_name}')

    # Save to file
    df = pd.DataFrame(rows)
    df.to_csv('worldcover_index.csv', index=False)




if __name__ == "__main__":
    main()