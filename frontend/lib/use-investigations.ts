'use client'


import { getDemoLocation } from "@/lib/DemoLocations"
import { useCallback, useEffect, useRef, useState } from 'react'
import type { InferenceParams, Run, Info, Batch } from './types'
import { makeBatch } from './inference-engine'
import { DemoPlayer } from './DemoPlayer'


export function useInvestigations() {

    const [runs, setRuns] = useState<Run[]>([])
    const [activeRunId, setActiveRunId] = useState<string | null>(null)
    const cancelMap = useRef<Map<string, () => void>>(new Map())

    const player = useRef(new DemoPlayer())


    const processBatch = useCallback(
        (id: string, msg: any) => {

            const batch = makeBatch(msg)

            setRuns(prev =>
                prev.map(r =>
                    r.id === id
                        ? {
                            ...r,
                            batches: [
                                ...r.batches,
                                batch
                            ]
                        }
                        : r
                )
            )
        },
        []
    )


    const startRun = useCallback((params: InferenceParams) => {


        const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const expectedBatches = parseFloat(params['num_obs'])
        const run_location = getDemoLocation(params.name)

        const run: Run = {
            id,
            params,
            createdAt: Date.now(),
            status: 'streaming',
            batches: [],
            expectedBatches,
            reports: [],
            location: run_location,
        }

        setRuns(prev => [run, ...prev])
        setActiveRunId(id)

        player.current.play(
            run_location,
            "collection",
            {
                onBatch: (msg) => {
                    console.log("DEMO BATCH:", msg)
                    processBatch(id, msg)
                },

                onEmptyBatch: (msg) => {
                    const new_id =
                        typeof crypto !== "undefined" && crypto.randomUUID
                            ? crypto.randomUUID()
                            : Math.random().toString(36).substring(2) + Date.now().toString(36)

                    const eBatch: Batch = {
                        id: new_id,
                        index: 0,
                        label: '',
                        image: '',
                        date: msg,
                        receivedAt: 0,
                        area: '',
                        lat: 0,
                        lng: 0,
                        coverage: 0,
                        observation: '',
                        masks: [],
                        metadata: [],
                        status: 'complete',
                        emptyBatch: true
                    }
                    setRuns((prev) =>
                        prev.map((r) =>
                            r.id === id
                                ? {
                                    ...r,
                                    batches: [...r.batches, eBatch],
                                }
                                : r,
                        ),
                    )
                },


                onComplete: () => {
                    setRuns(prev =>
                        prev.map(r =>
                            r.id === id
                                ? {
                                    ...r,
                                    status: 'complete'
                                }
                                : r
                        )
                    )
                }
            }
        )

        return id

    },
        [processBatch]
    )



    const inferenceModel = useCallback((run: Run, model: string) => {


        setRuns(prev =>
            prev.map(r =>
                r.id === run.id
                    ? {
                        ...r,
                        status: 'analyzing',
                        batches: r.batches.map(batch => ({
                            ...batch,
                            status: 'loading'
                        }))
                    }
                    : r
            )
        )



        player.current.play(run.location, "investigation", {

            onModelReturn: (results) => {


                setRuns(prev =>




                    prev.map(r => {
                        if (r.id !== run.id)
                            return r
                        return {
                            ...r,
                            batches: r.batches.map(batch => {

                                

                                const result =
                                    results.find(
                                        (res: any) => res.batchId === batch.id
                                    )


                                if (!result)
                                    return batch


                                const labels =
                                    result.metadata?.labels ?? []


                                const newMetadata: Info[] =
                                    labels.map((label: any) => ({
                                        tag: label.class,
                                        subheading: String(label.sub),
                                        bits: Object.entries(label)
                                            .filter(([key]) => key !== "class" && key !== "sub")
                                            .map(([key, value]) => ({
                                                label: key,
                                                data: value
                                            }))
                                    }))


                                return {
                                    ...batch,
                                    status: 'complete',
                                    metadata: [
                                        ...batch.metadata,
                                        ...newMetadata
                                    ],
                                    masks: [
                                        ...batch.masks,
                                        {
                                            image: result.image,
                                            metadata: result.metadata,
                                            modelName: result.model_name,
                                            tag: result.model_tag
                                        }
                                    ]
                                }

                            })
                        }

                    })
                )

            },


            onChangeReport: (results) => {

                setRuns(prev =>
                    prev.map(r =>
                        r.id === run.id
                            ? {
                                ...r,
                                reports: [
                                    ...r.reports,
                                    {
                                        title: `Report ${r.reports.length + 1}`,
                                        type: results.type,
                                        data: results
                                    }
                                ]
                            }
                            : r
                    )
                )

            },


            onComplete: () => {

                setRuns(prev =>
                    prev.map(r =>
                        r.id === run.id
                            ? {
                                ...r,
                                status: 'complete'
                            }
                            : r
                    )
                )

            }

        })


    }, [])


    const selectRun = useCallback((id: string | null) => {
        setActiveRunId(id)
    }, [])


    const activeRun =
        runs.find((r) => r.id === activeRunId) ?? null


    return {
        runs,
        activeRun,
        activeRunId,
        startRun,
        selectRun,
        inferenceModel
    }




}