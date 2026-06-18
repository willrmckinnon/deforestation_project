import type { InferenceParams } from '@/lib/types'


export type SocketHandlers = {
  onStatus?: (data: any) => void
  onBatch?: (data: any) => void
  onComplete?: () => void
  onError?: (error: Event) => void
  onOpen?: () => void
}


export class InferenceSocket {
  private ws: WebSocket

  constructor(url: string, handlers: SocketHandlers) {
    this.ws = new WebSocket(url)

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
          handlers.onStatus?.(msg.data)
          break

        case 'batch':
          handlers.onBatch?.(msg.data)
          break

        case 'complete':
          handlers.onComplete?.()
          break
      }
    }
  }

  execute(params: InferenceParams) {
    this.ws.send(
      JSON.stringify({
        type: "execute",
        params,
      })
    )
  }

  close() {
    this.ws.close()
  }
}