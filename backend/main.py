from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
import subprocess
import os
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect

import asyncio


app = FastAPI()
#PROCESS_FILE = 'image_process.py'
#BASE_DIR = os.path.dirname(os.path.abspath(__file__))

#Set the Correct base directory to reference the other folders
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

#Import the packages
from utils import helper
from data.load_observation import standard_observation
from datetime import datetime




@app.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    
    async def logger(message):
        await websocket.send_json({
                'type': 'log',
                'message': message
                })
        await asyncio.sleep(0.5)

    #----------------------------------------------
    # THIS IS THE MAIN SCRIPT
    #----------------------------------------------
    async def RUN_PROCESS(lat, lon, sqkm, date = None):
        await logger('PROCESS_STARTED')

        #----------------------------------------------
        #Setup - Collect the AOI and Datewindow needed
        #----------------------------------------------
        #Setup the DATETIME based on whether input is given | If no input argument is given, start with today
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now().date()

        #Setup the square area to be covered
        target_width = 1000 * ((sqkm/0.9540802499563914)**(0.5))

        #Setup the AOI
        aoi = helper.point_to_polygon(lat, lon, dim = target_width)



        #----------------------------------------------
        # Get the Observation
        #----------------------------------------------
        #Fetch Observation
        await logger("Started - Fetching Data")
        obs = standard_observation(aoi, target_date, max_cloud_threshold=30)

        #Set the bands and stitch together the xarrays for the total observed area
        bands = ['B02', 'B03','B04']
        img, _ = obs.stack(bands)


        #----------------------------------------------
        # Display the result
        #----------------------------------------------
        await logger("Displaying Image")
        rgb = helper.normalize_per_band(img, saturation=7)

        #helper.disp_image(rgb)











    #----------------------------------------------
    # THIS RUNS THE SCRIPT
    #----------------------------------------------
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            await RUN_PROCESS(float(data['lat']), float(data['lon']), float(data['sqkm']))

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        print("Actual backend error:", e)

        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    





'''
process = subprocess.Popen(
    [
        "python", 
        '-u',
        PROCESS_FILE,
        '--lat', data['lat'],
        '--lon', data['lon'],
        '--sqkm', data['sqkm']
    ],
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
    cwd=BASE_DIR
)
for line in process.stdout:
    
    clean_line = line.strip()

    #print(clean_line, flush=True)
    if clean_line:
        await websocket.send_json({
            "type": "log",
            "message": clean_line
        })
process.wait()
'''