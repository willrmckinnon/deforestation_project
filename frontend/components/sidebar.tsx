'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/lib/button'
import type { Run } from '@/lib/types'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Leaf,
  Plus,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

type Props = {
  open: boolean
  onToggle: () => void
  runs: Run[]
  activeRunId: string | null
  onSelectRun: (id: string | null) => void
  onNewRun: () => void
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

export function Sidebar({
  open,
  onToggle,
  runs,
  activeRunId,
  onSelectRun,
  onNewRun,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-60 h-full w-72 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        >
        {/* Header */}
        <div
          className={cn(
            'flex h-18 items-center border-b border-sidebar-border px-2',
            open ? 'justify-between' : 'justify-center',
          )}
        >
          
          <Button
            variant="ghost"
            onClick={onToggle}
            aria-label={open ? 'Collapse panel' : 'Expand panel'}
            className="text-sidebar-foreground pl-4 pt-2"
          >
            
            {open ? (
              <PanelLeftClose className="size-5 hover:text-foreground transition-colors" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>

          {open && (
            <div className="flex items-center gap-2 pr-3 pt-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Leaf className="size-4" />
              </div>
              <span className="text-sm font-semibold text-sidebar-foreground">
                Verdant
              </span>
            </div>
          )}

        </div>

        {/* New run */}
        <div className={cn('p-2', !open && 'flex justify-center')}>
          <Button
            variant="outline"
            size={open ? 'sm' : 'icon-sm'}
            onClick={onNewRun}
            aria-label="New investigation"
            className={cn(
              'border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent',
              open && 'w-full justify-start',
            )}
          >
            <Plus className="size-4" />
            {open && <span>New investigation</span>}
          </Button>
        </div>

        {open && (
          <div className="px-3 pt-2 pb-1">
            <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
              Inference Runs
            </span>
          </div>
        )}

        {/* Run list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {runs.length === 0 && open && (
            <p className="px-2 py-4 text-xs leading-relaxed text-muted-foreground">
              No runs yet. Configure parameters and execute to start your first
              investigation.
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {runs.map((run) => {
              const active = run.id === activeRunId
              return (
                <li key={run.id}>
                  <button
                    type="button"
                    onClick={() => onSelectRun(run.id)}
                    title={run.params.name}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
                      !open && 'justify-center',
                    )}
                  >
                    <span className="shrink-0">
                      {run.status === 'complete' ? (
                        <CheckCircle2 className="size-4 text-primary" />                              
                      ) : (
                        <Loader2 className="size-4 animate-spin text-primary" />                      
                      )}
                    </span>
                    {open && (
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {run.params.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                          <span className="truncate">{run.expectedBatches} Observations</span>
                          <span aria-hidden>·</span>
                          <span className="shrink-0">
                            {timeAgo(run.createdAt)}
                          </span> 
                        </span>
                      </span>
                    )}
                    {open && (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground tabular-nums">
                        {run.batches.length}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {open && (
          <div className="border-t border-sidebar-border p-3">
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              Verdant Segmentation Console
              <br />
              <span className="text-muted-foreground/70">v1.2 · Verdant Project Sample App</span>
              <br />
              <span className="text-muted-foreground/70">App Author Will McKinnon</span>
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
