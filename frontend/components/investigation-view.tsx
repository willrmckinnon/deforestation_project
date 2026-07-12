'use client'

import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Run } from '@/lib/types'
import { BatchCard } from './batch-card'
import { Field } from './inference-form'
import { MODELS } from '@/lib/inference-engine'
import { Button } from '@/components/ui/button'
import { ReportTile, ReportCard } from '@/components/ui/report-card'
import { DesktopAnalysisPanel, MobileAnalysisPanel } from '@/components/ui/analysis-panel'
import {
  Loader2,
  CheckCircle2,
  Layers,
  Gauge,
  Leaf,
  DatabaseZap,
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
  const valid = (model != MODELS[0]) && (run.status == 'complete')
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
      <header className="flex flex-row justify-between items-center border-b border-border bg-card pl-15 md:pl-20 py-3 shadow-sm">
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

        <Link
          href="https://will-mckinnon.com"
          className="flex items-center gap-2 md:pl-45 pr-3 md:pr-10 hover:opacity-90 hover:text-shadow-md"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="size-4" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-sidebar-foreground ">
              Will McKinnon
            </h2>
            <p className="!text-[8px] uppercase tracking-[0.25em] !text-stone">
              Verdant
            </p>
          </div>
        </Link>




      </header>

      <div className="flex flex-1 min-h-0 flex-row">

        <div className="flex flex-1 min-h-0 min-w-0 flex-col">
          {/* Observation tabs */}
          <div
            ref={tabsRef}
            className="w-full overflow-x-auto"
          >
            <div className="flex w-max min-w-full justify-center gap-1.5 px-4 pt-2">
              {run.batches.map((batch, idx) => (
                batch.emptyBatch? (
                  <div
                    key={batch.id}
                    className='flex flex-col shrink-0 items-center gap-2 rounded-lg  px-3 py-1.5 text-sm transition-colors text-muted-foreground'
                  >
                    <div className="flex flex-col h-5 md:h-15 w-10 md:w-30 overflow-hidden bg-card border border-muted justify-center items-center rounded-lg">
                      <DatabaseZap className='size-5'/>
                      <div className='hidden md:flex md:text-xs'>No Data Available</div>
                    </div>
                    <div className='flex flex-row items-center'>
                      <span className="font-medium ">
                        {batch.date}
                      </span>
                    </div>
                  </div>
                  

                ) : (
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
                )
                

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
              <div className='flex items-center'>
                {run.status === 'analyzing' ? (
                  <div className='flex px-10 md:pb-5 items-center'>
                    <Loader2 className="size-10 animate-spin" />
                  </div>
                ) : (<div className='hidden w-0'></div>)}
              </div>

              {/* Tab for loading */}
              {run.status === 'streaming' && (
                <div className = 'pt-1'>
                  <span className="flex shrink-0 items-center h-15 gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Awaiting next observation…
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* END Observation tab content */}





          <div className='flex flex-1 min-h-0 flex-row'>

            {/* Analysis Panel */}
            <div className='hidden md:flex'>
              <DesktopAnalysisPanel run={run} onExecute={onExecute}/>  
            </div> 
            <div className='flex md:hidden'>
              <MobileAnalysisPanel run={run} onExecute={onExecute}/>  
            </div>  
            {/* END Analysis Panel */}


            {/* Observation content */}
            <div className="flex flex-1 pr-[5vw] md:pr-[3vw] pl-[5vw] md:pl-0 min-w-0 md:min-h-0 overflow-y-auto py-4">
              {activeReport ?(
                <div className="flex flex-1 min-w-0 min-h-0">
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
                <div className="flex flex-1 min-w-0 md:min-h-0">
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
