import type { InferenceParams, ModelInferenceParams } from '@/lib/types'
import { makeBatch } from './inference-engine'


export type SocketHandlers = {
  onBatch?: (data: any) => void
  onComplete?: () => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onModelReturn?: (data: any) => void
  onChangeReport?: (data: any) => void
  onEmptyBatch?: (data: any) => void
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL!
if (!WS_URL) {throw new Error("Missing NEXT_PUBLIC_WS_URL environment variable")}

export class InferenceSocket {
  private ws: WebSocket

  constructor(handlers: SocketHandlers) {
    this.ws = new WebSocket(WS_URL)

  // Handle Basic Operations //
    // Open
    this.ws.onopen = () => {
      console.log("WebSocket connected")
      handlers.onOpen?.()
    }

    // Error
    const onError = handlers.onError
    if (onError) {
      this.ws.onerror = (event) => {
        console.error("WebSocket error:", event)
        onError(event) 
      }
    }

    // Close
    this.ws.onclose = (event) => {
      console.log("WebSocket closed")
      console.log("Code:", event.code)
      console.log("Reason:", event.reason)
      console.log("Clean:", event.wasClean)
    }



  // Handle Incoming Messages //
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'status':
          console.log("Received websocket message:", msg.data)
          break

        case 'batch':
          handlers.onBatch?.(msg.data)
          break

        case 'model_return':
          handlers.onModelReturn?.(msg.data)
          break

        case 'change_report':
          handlers.onChangeReport?.(msg.data)
          break

        case 'emptyBatch':
          handlers.onEmptyBatch?.(msg.data)
          break

        case 'complete':
          console.log('Complete message received')
          handlers.onComplete?.()
          break

      }
    }
  }

  execute(params: InferenceParams) {
    this.ws.send(
      JSON.stringify({
        type: "collect",
        params,
      })
    )
  }

  executeModel(params: ModelInferenceParams) {
    this.ws.send(
      JSON.stringify({
        type: "model_inference",
        params,
      })
    )

  }



  close() {
    this.ws.close()
  }
}