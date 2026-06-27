'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Run } from '@/lib/types'
import { BatchCard } from './batch-card'
import { Field } from './inference-form'
import { MODELS } from '@/lib/inference-engine'
import { Button } from '@/components/ui/button'
import { ReportTile, ReportCard } from '@/components/ui/report-card'
import {
  Loader2,
  CheckCircle2,
  Layers,
  Gauge,
  Leaf,
  MapPinned,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Play,
} from 'lucide-react'

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.7rem] text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </span>
    </div>
  )
}



{/* formatting for input*/}
const inputCls =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

type Props = {
  run: Run 
  onExecute: (params: Run, model: string) => void
}

export function InvestigationView({ run, onExecute }: Props) {
  const [activeBatchIdx, setActiveBatchIdx] = useState<number | null>(0)
  const [activeReportTitle, setActiveReportTitle] = useState<string | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(run.batches.length)
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false)
  const [model, setModel] = useState(MODELS[0])
  const valid = model != MODELS[0]
  const activeBatch =   activeBatchIdx !== null ? run.batches[activeBatchIdx] : null
  const activeReport = run.reports.find(report => report.title === activeReportTitle)
  const [analysisCount, setAnalysisCount] = useState(0)
  const yearsCovered = useMemo(() => {
    const times = run.batches
      .map(b => new Date(b.date).getTime())
      .filter(t => !isNaN(t))

    if (times.length < 2) return null

    const min = Math.min(...times)
    const max = Math.max(...times)

    const msPerYear = 1000 * 60 * 60 * 24 * 365.25

    return (max - min) / msPerYear
  }, [run.batches])


  // When a new batch arrives, auto-focus it the first time
  useEffect(() => {
    if (run.batches.length > prevCount.current) {
      setActiveBatchIdx(run.batches.length - 1)
      // scroll tab into view
      requestAnimationFrame(() => {
        tabsRef.current?.scrollTo({
          left: tabsRef.current.scrollWidth,
          behavior: 'smooth',
        })
      })
    }
    prevCount.current = run.batches.length
  }, [run.batches.length])

  // Reset when switching runs
  useEffect(() => {
    setActiveBatchIdx(Math.max(0, run.batches.length - 1))
    prevCount.current = run.batches.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id])

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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex flex-row justify-between items-center border-b border-border bg-card pl-20 py-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                {run.params.name}
              </h1>
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium',
                  run.status === 'complete'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {run.status === 'streaming' ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Loading Observations
                  </>
                ) : run.status === 'analyzing' ?(
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3" />
                    Complete
                  </>
                )}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {run.params.area}
            </p>
          </div>

        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-2">
          <Stat
            icon={<Layers className="size-4" />}
            label="Batches received"
            value={`${run.batches.length} / ${run.params.num_obs}`}
          />
          {/*
          <Stat
            icon={<MapPinned className="size-4" />}
            label="Tiles received"
            value={`${totalObservations}`}
          />
          */}
          <Stat
            icon={<Gauge className="size-4" />}
            label="Time span"
            value={yearsCovered ? `${yearsCovered.toFixed(2)} years` : '—'}
          />
        </div>


        <div className="flex items-center gap-2 md:pl-45 pr-10">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="size-4" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            Verdant
          </span>
        </div>


      </header>

      <div className="flex flex-1 min-h-0 flex-row">

        <div className="flex flex-1 min-h-0 flex-col">
          {/* Observation tabs */}
          <div
            ref={tabsRef}
            className="flex items-center justify-center gap-1.5 overflow-x-auto  px-4 pt-2"
          >
            {run.batches.map((batch, idx) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => {
                  setActiveBatchIdx(idx)
                  setActiveReportTitle(null)
                }}
                className={cn(
                  'flex flex-col shrink-0 items-center gap-2 rounded-lg  px-3 py-1.5 text-sm transition-colors',
                  idx === activeBatchIdx
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : ' text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >

                <div className="h-5 md:h-15 w-10 md:w-30 overflow-hidden rounded-lg">
                  <img
                    src={batch.image || '/placeholder.svg'}
                    alt="Observation"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className='flex flex-row items-center'>
                  <span className="font-medium ">
                    {batch.date}
                  </span>
                  {batch.status === 'loading' ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (<div className='hidden'></div>)}

                </div>

              </button>
            ))}





            {run.reports.map((report) =>(
              <button
                key={report.title}
                type="button"
                onClick={() => {
                  setActiveReportTitle(report.title)
                  setActiveBatchIdx(null)
                }}
                className={cn(
                  'flex flex-col shrink-0 items-center gap-2 rounded-lg  px-3 py-1.5 text-sm transition-colors',
                  report.title === activeReportTitle
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : ' text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <div className="h-5 md:h-15 w-10 md:w-30 overflow-hidden rounded-lg">
                  {ReportTile(report.type)}
                </div>
                <div className='flex flex-row items-center'>
                  <span className="font-medium ">
                    {report.title}
                  </span>
                </div>
              </button>
            ))}


            {/* Tab for loading analyses */}
            <div className='px-10'>
              {run.status === 'analyzing' ? (
                <Loader2 className="size-10 animate-spin" />
              ) : (<div className='hidden'></div>)}
            </div>


            {run.status === 'streaming' && (
              <span className="flex shrink-0 items-center h-15 gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Awaiting next observation…
              </span>
            )}
          </div>
          {/* END Observation content */}





          <div className='flex flex-1 min-h-0 flex-row'>  
                 
            {/* Analysis Panel */}
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
                  absolute left-[3vw] top-0
                  h-[calc(100%-30px)] w-90 md:w-[25vw]
                  rounded-xl border bg-card p-4
                  transition-transform duration-300 ease-in-out
                  z-50 shadow-lg
                  ${analysisPanelOpen ? "translate-x-0" : "-translate-x-[28vw]"}
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
            {/* END Analysis Panel */}


            {/* Observation content */}
            
            <div className="flex flex-1 min-h-0 py-4">
              {activeReport ?(
                <div className="flex flex-1 min-h-0">
                  <ReportCard report={activeReport} />
                </div>                
              ) : !activeBatch ? (
                <div className="flex flex-1 justify-center items-center min-h-0 pb-40">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Initializing inference — waiting for the first batch from the
                    backend…
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 min-h-0">
                  <BatchCard batch={activeBatch} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
