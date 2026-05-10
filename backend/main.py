#Base Libraries
import os
import queue
import asyncio
from fastapi import FastAPI, WebSocket

#Scripts
from image_collection import main as image_collection


#Set the Correct base directory to reference the other folders
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

#Setup the app
app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    
    #Setup the queue for communication
    log_queue = queue.Queue()
    def logger(message, type = 'message'):
        log_queue.put({
                'type': type,
                'data': message
        })


    # RUN THE SCRIPT
    await websocket.accept()

    while True:
        data = await websocket.receive_json()
        task = asyncio.create_task(
            asyncio.to_thread(
                image_collection,
                float(data['lat']),
                float(data['lon']), 
                float(data['sqkm']),
                logger
        ))

        while not task.done():
            #Once an item is queued log it
            while not log_queue.empty():
                msg = log_queue.get()
                await websocket.send_json(msg)
            await asyncio.sleep(0.1)

        #Empty the queue once the process is complete
        while not log_queue.empty():
            msg = log_queue.get()
            await websocket.send_json(msg)


