'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { InferenceForm } from './inference-form'
import { InvestigationView } from './investigation-view'
import { useInvestigations } from '@/lib/use-investigations'
import type { InferenceParams } from '@/lib/types'

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { runs, activeRun, activeRunId, startRun, selectRun } =
    useInvestigations()

  function handleExecute(params: InferenceParams) {
    startRun(params)
  }

  function handleNewRun() {
    selectRun(null)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
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
          <InvestigationView run={activeRun} />
        ) : (
          <InferenceForm onExecute={handleExecute} />
        )}
      </main>
    </div>
  )
}
