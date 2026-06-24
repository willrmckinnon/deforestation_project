'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Run } from '@/lib/types'
import { BatchCard } from './batch-card'
import { Field } from './inference-form'
import { MODELS } from '@/lib/inference-engine'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle2,
  Layers,
  Gauge,
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
  const [activeBatchIdx, setActiveBatchIdx] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(run.batches.length)
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false)
  const [model, setModel] = useState(MODELS[0])
  const valid = model != MODELS[0]
  const activeBatch = run.batches[activeBatchIdx]
  const totalObservations = run.batches.length
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
    onExecute(
      run, 
      model
  )
  }




  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/40 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
                    Streaming
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

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            icon={<Layers className="size-4" />}
            label="Batches received"
            value={`${run.batches.length} / ${run.params.num_obs}`}
          />
          <Stat
            icon={<MapPinned className="size-4" />}
            label="Tiles received"
            value={`${totalObservations}`}
          />
          <Stat
            icon={<Gauge className="size-4" />}
            label="Time span"
            value={yearsCovered ? `${yearsCovered.toFixed(2)} years` : '—'}
          />
        </div>
      </header>

      <div className="flex flex-row h-full">
     
        {/* Analysis Panel */}
        <div className= {cn('overflow-hidden border-r transition-all duration-300', analysisPanelOpen ? 'w-72' : 'w-10')} >
          <div className = "flex flex-row">
            <div className = "flex flex-col">
              <button onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)}>
                {analysisPanelOpen ? <ChevronLeft /> : <ChevronRight />}
              </button>
              <div className = "w-10 shrink-0 flex items-center justify-center">
                <span className="mt-10 -rotate-90 whitespace-nowrap text-xs font-medium tracking-[0.2em] text-muted-foreground">
                  ANALYSIS
                </span>
              </div>
            </div>

            {analysisPanelOpen && (
              <div className="mt-4 px-3 flex flex-col gap-4">
                <span className = "text-[11px] italic text-center text-justify leading-[13px] block">
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
            )}
          </div>
  
        </div>



        <div className="flex-1 h-full flex-col">
          {/* Observation tabs */}
          <div
            ref={tabsRef}
            className="flex items-center gap-1.5 overflow-x-auto border-b border-border bg-background px-4 py-2"
          >
            {run.batches.map((batch, idx) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => setActiveBatchIdx(idx)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  idx === activeBatchIdx
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="font-medium">{batch.date}</span>

                {batch.status === 'loading' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <span className="rounded bg-background/60 px-1.5 text-[0.7rem] tabular-nums">
                    {batch.index}
                  </span>
                )}

              </button>
            ))}

            {run.status === 'streaming' && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Awaiting next observation…
              </span>
            )}
          </div>

          {/* Observation content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!activeBatch ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Initializing inference — waiting for the first batch from the
                  backend…
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-none">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {activeBatch.label}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Observation Date:{' '}
                      <span className="font-medium text-foreground">
                        {activeBatch.date}
                      </span>{' '}

                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Received{' '}
                    {new Date(activeBatch.receivedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <BatchCard batch={activeBatch} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
