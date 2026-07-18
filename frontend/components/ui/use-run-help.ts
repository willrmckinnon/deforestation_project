'use client'

import { useEffect, useState } from 'react'

export type HelpStepId =
  | 'select-observation'
  | 'analysis-help'
  | 'analysis-setup'

export function useRunHelp(runId?: string) {
  const [dismissedSteps, setDismissedSteps] = useState<
    Set<HelpStepId>
  >(() => new Set())

  /*
   * When the run changes, allow the help bubbles to appear again.
   * Remove this effect if you only want each bubble shown once per
   * browser session.
   */
  useEffect(() => {
    setDismissedSteps(new Set())
  }, [runId])

  function dismissHelp(stepId: HelpStepId) {
    setDismissedSteps((current) => {
      const next = new Set(current)
      next.add(stepId)
      return next
    })
  }

  function isHelpDismissed(stepId: HelpStepId) {
    return dismissedSteps.has(stepId)
  }

  return {
    dismissHelp,
    isHelpDismissed,
  }
}