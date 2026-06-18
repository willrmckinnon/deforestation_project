'use client'
 
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Batch, InferenceParams, Run } from './types'
import { makeBatch } from './inference-engine'
import {InferenceSocket} from './websocket'

export function useInvestigations() {
  const [runs, setRuns] = useState<Run[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const cancelMap = useRef<Map<string, () => void>>(new Map())

  const startRun = useCallback((params: InferenceParams) => {
    const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const expectedBatches = 2 //4 + Math.floor(Math.random() * 3)
    const run: Run = {
      id,
      params,
      createdAt: Date.now(),
      status: 'streaming',
      batches: [],
      expectedBatches,
    }
    setRuns((prev) => [run, ...prev])
    setActiveRunId(id)

    const socket = new InferenceSocket(
      "ws://localhost:8000/ws",
      {
        onOpen: () => {
          socket.execute(params)
        },

        onStatus: (msg) => {
          console.log("Received websocket message:", msg)
        },

        onBatch: (msg) => {
          console.log("RAW BATCH:", msg)
          const batch = makeBatch(msg)

          setRuns((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    batches: [...r.batches, batch],
                  }
                : r,
            ),
          )
        },

        onComplete: () => {
          setRuns(prev =>
            prev.map(r =>
              r.id === id ? { ...r, status: 'complete' } : r
            )
          )
        
        }
      }
    )
    return id
  }, [])

  const selectRun = useCallback((id: string | null) => {
    setActiveRunId(id)
  }, [])

  // cleanup on unmount
  useEffect(() => {
    const map = cancelMap.current
    return () => {
      map.forEach((cancel) => cancel())
      map.clear()
    }
  }, [])

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null

  return { runs, activeRun, activeRunId, startRun, selectRun }
}

// re-export for convenience
export { makeBatch }
