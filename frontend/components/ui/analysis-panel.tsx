'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Run } from '@/lib/types'
import { Field } from '../inference-form'
import { MODELS } from '@/lib/inference-engine'
import { Button } from '@/components/ui/button'
import {
  MapPinned,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Play,
} from 'lucide-react'





const inputCls =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'


type Props = {
  run: Run 
  onExecute: (params: Run, model: string) => void
}


export function MobileAnalysisPanel({ run, onExecute }: Props) {
    const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false)
    const [model, setModel] = useState(MODELS[0])
    const valid = (model != MODELS[0]) && (run.status == 'complete')
    const [analysisCount, setAnalysisCount] = useState(0)


    // Handle inferencing
    function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    console.log('Model Inference Started')
    setAnalysisCount((prev => prev + 1))
    onExecute(
        run, 
        model
    )
    }

    return(
        <div className='relative flex min-h-0'>
            <button
            type="button"
            onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)}
            className="fixed bottom-4 left-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full
                bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95
            "
            >
            <BrainCircuit className="h-6 w-6" />
            </button>



            <div className='flex justify-center'>
                <div 
                className={`fixed left-1/2 top-63/100 -translate-x-1/2 -translate-y-1/2 
                    w-[85vw] h-[calc(100%-30vh)] rounded-xl border bg-card p-4 transition-all duration-300 ease-in-out z-90 shadow-lg
                    ${analysisPanelOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
                `}
                >

                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                        Run Analysis
                        </h2>
                        <p className="text-xs text-muted-foreground italic">
                        Analyses Run:{' '}
                        <span className="font-medium text-muted-foreground italic">
                            {analysisCount}
                        </span>{' '}
                        </p>
                    </div>



                    <div className="flex flex-row gap-2.5 p-3">
                        
                        <div className="inline-flex self-start shrink-0 items-center rounded-md gap-1 text-[0.7rem] text-muted-foreground tabular-nums border px-2 py-0.25 shadow-sm">
                        <MapPinned className="size-3" />

                        </div>

                    </div>

                    <div className='px-4'>
                        <span className = "text-[11px] italic px-2 pb-2 text-center text-justify leading-[13px] block">
                        Select a model from the dropdown and run to see analysis on each observation:
                        </span>

                        <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <Field label="Run a Model" icon={<BrainCircuit className="size-4" />}>
                            <select
                            className={cn(inputCls, 'appearance-none')}
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            >
                            {MODELS.map((r) => (
                                <option key={r} value={r}>
                                {r}
                                </option>
                            ))}
                            </select>
                        </Field>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!valid}
                            className="mt-1 h-11 w-full text-sm"
                        >
                            <Play className="size-4" />
                            Run Analysis
                        </Button>
                        </form>
                    </div>          
                </div>


            </div>


        </div>
    )
}














export function DesktopAnalysisPanel({ run, onExecute }: Props) {
    const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false)
    const [model, setModel] = useState(MODELS[0])
    const valid = (model != MODELS[0]) && (run.status == 'complete')
    const [analysisCount, setAnalysisCount] = useState(0)


    // Handle inferencing
    function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    console.log('Model Inference Started')
    setAnalysisCount((prev => prev + 1))
    onExecute(
        run, 
        model
    )
    }

    return (


        <div className='relative flex min-h-0'>
            <button 
            onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)} 
            className='flex flex-col w-5 md:w-[3vw] items-center justify-center hover:bg-muted'
            >

            {analysisPanelOpen ? <ChevronLeft /> : <ChevronRight />}
            <div className="mt-4 px-3 flex flex-col gap-4 ">
                <span className="mt-7 mb-50 -rotate-90 whitespace-nowrap text-xs font-medium tracking-[0.2em] text-muted-foreground">
                ANALYSIS
                </span>            
            </div>
            </button>

            

            

            <div 
            className={`
                absolute left-[10vw] md:left-[3vw] top-0
                h-[calc(100%-30px)] w-[85vw] md:w-90 md:w-[25vw]
                rounded-xl border bg-card p-4
                transition-transform duration-300 ease-in-out
                z-50 shadow-lg
                ${analysisPanelOpen ? "translate-x-0" : "-translate-x-[100vw]"}
            `}
            >

            <div>
                <h2 className="text-base font-semibold text-foreground">
                Run Analysis
                </h2>
                <p className="text-xs text-muted-foreground italic">
                Analyses Run:{' '}
                <span className="font-medium text-muted-foreground italic">
                    {analysisCount}
                </span>{' '}
                </p>
            </div>



            <div className="flex flex-row gap-2.5 p-3">
                
                <div className="inline-flex self-start shrink-0 items-center rounded-md gap-1 text-[0.7rem] text-muted-foreground tabular-nums border px-2 py-0.25 shadow-sm">
                <MapPinned className="size-3" />

                </div>

            </div>

            <div className='px-4'>
                <span className = "text-[11px] italic px-2 pb-2 text-center text-justify leading-[13px] block">
                Select a model from the dropdown and run to see analysis on each observation:
                </span>

                <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Field label="Run a Model" icon={<BrainCircuit className="size-4" />}>
                    <select
                    className={cn(inputCls, 'appearance-none')}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    >
                    {MODELS.map((r) => (
                        <option key={r} value={r}>
                        {r}
                        </option>
                    ))}
                    </select>
                </Field>
                <Button
                    type="submit"
                    size="lg"
                    disabled={!valid}
                    className="mt-1 h-11 w-full text-sm"
                >
                    <Play className="size-4" />
                    Run Analysis
                </Button>
                </form>
            </div>          
            </div>
        </div>




    )

    
}