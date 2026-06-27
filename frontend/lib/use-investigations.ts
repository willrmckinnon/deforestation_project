'use client'
 
import { useCallback, useEffect, useRef, useState } from 'react'
import type { InferenceParams, Run, Info } from './types'
import { makeBatch } from './inference-engine'
import {InferenceSocket} from './websocket'

export function useInvestigations() {
  const [runs, setRuns] = useState<Run[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const cancelMap = useRef<Map<string, () => void>>(new Map())
  const socketMap = useRef<Map<string, InferenceSocket>>(new Map())
 
  const startRun = useCallback((params: InferenceParams) => {
    const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const expectedBatches = parseFloat(params['num_obs']) //4 + Math.floor(Math.random() * 3)
    const run: Run = {
      id,
      params,
      createdAt: Date.now(),
      status: 'streaming',
      batches: [],
      expectedBatches,
      reports: []
    }
    setRuns((prev) => [run, ...prev])
    setActiveRunId(id)

    const socket = new InferenceSocket({ 
        onOpen: () => {socket.execute(params)},

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

        onModelReturn: (results) => {
          setRuns(prev =>
            prev.map(r => {
              if (r.id !== id) return r
              return {
                ...r,
                batches: r.batches.map(batch => {
                  const result = results.find((res: { batchId: string }) => res.batchId === batch.id)

                  const labels = result?.metadata?.labels ?? []
                  const newMetadata: Info[] = labels.map((label: Record<string, any>) => ({
                    tag: label.class,
                    subheading: String(label.sub),
                    bits: Object.entries(label)
                      .filter(([key]) => key !== 'class' && key !== 'sub')
                      .map(([key, value]) => ({
                        label: key,
                        data: value
                      }))
                  }))

                  if (!result) return batch
                  return {
                    ...batch,
                    status: 'complete',
                    metadata: [...batch.metadata, ...newMetadata],
                    masks: [
                      ...batch.masks,
                      {
                        image: result.image,
                        metadata: result.metadata,
                        modelName: result.model_name,
                        tag: result.model_tag
                      },
                    ],
                  }
                }),
              }
            })
          )
        },


        onChangeReport: (results) => {
          setRuns(prev =>
            prev.map(r => {
              if (r.id !== id) return r
              return {
                ...r,
                reports: [
                  ...r.reports,
                  {
                    title: `Report ${r.reports.length+1}`,
                    type: results.type,
                    data: results,
                  },
                ]
              }
            })
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
    socketMap.current.set(id, socket)
    return id
  }, [])

  const selectRun = useCallback((id: string | null) => {
    setActiveRunId(id)
  }, [])


 


  
  // Method for running inferences
  const inferenceModel = useCallback(( run: Run, model: string) => {
    setRuns(prev =>
      prev.map(r =>
        r.id === run.id
          ? {
              ...r,
              status: 'analyzing',
              batches: r.batches.map(batch => ({
                ...batch,
                status: 'loading',
              })),
            }
          : r
      )
    )
    const socket = socketMap.current.get(run.id)
    if (!socket) {
      console.error("No socket found for run", run.id)
      return
    }
 
    // Code for sending the imformation to the backend
    const inferencePayload = run.batches.map(batch => ({
      batchId: batch.id,
      observation: batch.observation,
    }))
    socket.executeModel({
      modelName: model, 
      observations: inferencePayload,
      lat: run.batches[0].lat,
      lng: run.batches[0].lng,
      area: run.batches[0].area,})
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

  return { runs, activeRun, activeRunId, startRun, selectRun, inferenceModel }
}

// re-export for convenience
export { makeBatch }
