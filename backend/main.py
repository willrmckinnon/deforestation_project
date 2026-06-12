#Base Libraries
import os
import queue
import asyncio
from fastapi import FastAPI, WebSocket
from starlette.websockets import WebSocketDisconnect
import base64
from io import BytesIO

#Scripts
from simulate_investigation import inv_sim


#Set the Correct base directory to reference the other folders
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

#Setup the app
app = FastAPI()

# Image handling
def image_to_base64(img):
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    log_queue = queue.Queue()
    def logger(message, type='text', meta = ''):
        if type == 'image':
            message = image_to_base64(message)

        log_queue.put({
            "type": type,
            "data": message,
            "meta": meta
        })

    await websocket.accept()
    try:
        while True:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                print("Client disconnected")
                break

            task = asyncio.create_task(
                asyncio.to_thread(
                    inv_sim,
                    data['lat'],
                    data['lon'],
                    data['sqkm'],
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