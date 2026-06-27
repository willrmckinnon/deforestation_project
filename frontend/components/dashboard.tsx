'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { PanelLeftOpen } from 'lucide-react'
import { InferenceForm } from './inference-form'
import { InvestigationView } from './investigation-view'
import { useInvestigations } from '@/lib/use-investigations'
import type { InferenceParams } from '@/lib/types'
 
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { runs, activeRun, activeRunId, startRun, selectRun, inferenceModel } = useInvestigations()

  function handleStartRun(params: InferenceParams) {
    startRun(params)
  }

  function handleNewRun() {
    selectRun(null)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-30 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeftOpen className="size-5" />
        </button>
      )}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        runs={runs}
        activeRunId={activeRunId}
        onSelectRun={selectRun}
        onNewRun={handleNewRun}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {activeRun ? (
          <InvestigationView run={activeRun} onExecute={inferenceModel} />
        ) : (
          <InferenceForm onExecute={handleStartRun} />
        )}
      </main>
    </div>
  )
}
