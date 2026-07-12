#Base Libraries
import os
import queue
import asyncio
from utils.helper import load_config
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
import base64
from io import BytesIO
from time import sleep


#####################################################################
# Retrofit for saving
import json
from pathlib import Path

recorded_messages = []


def save_recording(messages, run_name):
    output_dir = Path("saved_runs")
    output_dir.mkdir(exist_ok=True)
    path = output_dir / f"{run_name}.json"
    with open(path, "w") as f:
        json.dump(messages, f, indent=2)


#####################################################################

#Scripts
from subprocesses.collect_observations import collect_observations
from subprocesses.run_inference import run_inference

# Define the domains that this api might receive requests from
ALLOWED_ORIGINS = load_config()['allowed_origins']

#Set the Correct base directory to reference the other folders
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

#Setup the app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins= ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Image handling
def image_to_base64(img):
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    log_queue = queue.Queue()
    def logger(message, type='text', meta = ''):
        payload = {
            "type": type,
            "data": message,
            "meta": meta
        }

        recorded_messages.append(payload)
        log_queue.put(payload)
        if type == 'complete': save_recording(recorded_messages, "peru_collection")


 
    await websocket.accept()
    try:
        while True:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                print("Client disconnected")
                break

            if data['type'] == 'collect':
                task = asyncio.create_task(
                    asyncio.to_thread(
                        collect_observations,
                        data['params']['latitude'],
                        data['params']['longitude'],
                        data['params']['area'],
                        data['params']['num_obs'],
                        logger
                    )
                )
            elif data['type'] == 'model_inference':
                num_observations = len(data['params']['observations'])
                logger(f'Backend running model inferences on {num_observations} observations', 'status')
                task = asyncio.create_task(
                    asyncio.to_thread(
                        run_inference,
                        data['params'],
                        logger
                    )
                )
                

            

            while not task.done():
                while not log_queue.empty():
                    msg = log_queue.get()
                    await websocket.send_json(msg)

                await asyncio.sleep(0.1)

            while not log_queue.empty():
                msg = log_queue.get()
                await websocket.send_json(msg)

    except WebSocketDisconnect:
        print("WebSocket closed cleanly")

    finally:
        print("Cleaning up socket")