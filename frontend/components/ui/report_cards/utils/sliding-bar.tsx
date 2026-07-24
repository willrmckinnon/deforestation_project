'use client'

import { useMemo } from 'react'
import { Slider } from '@/components/ui/report_cards/utils/slider'
import type { Batch } from '@/lib/types'
import { cn } from '@/lib/utils'

type NdviDateRangeSliderProps = {
  batches: Batch[]
  baseBatchId: string
  comparisonBatchId: string
  onBaseBatchChange: (batchId: string) => void
  onComparisonBatchChange: (batchId: string) => void
}

export function NdviDateRangeSlider({
  batches,
  baseBatchId,
  comparisonBatchId,
  onBaseBatchChange,
  onComparisonBatchChange,
}: NdviDateRangeSliderProps) {
  const sortedBatches = useMemo(
    () =>
      batches
        .filter(batch => !batch.emptyBatch && batch.date)
        .sort(
          (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime(),
        ),
    [batches],
  )

  const baseIndex = Math.max(
    0,
    sortedBatches.findIndex(batch => batch.id === baseBatchId),
  )

  const comparisonIndex = Math.max(
    baseIndex,
    sortedBatches.findIndex(
      batch => batch.id === comparisonBatchId,
    ),
  )

  function handleDateRangeChange(
    value: number | readonly number[],
    ) {
    if (!Array.isArray(value)) return

    const [newBaseIndex, newComparisonIndex] = value

    const newBaseBatch = sortedBatches[newBaseIndex]
    const newComparisonBatch = sortedBatches[newComparisonIndex]

    if (newBaseBatch) {
        onBaseBatchChange(newBaseBatch.id)
    }

    if (newComparisonBatch) {
        onComparisonBatchChange(newComparisonBatch.id)
    }
    }

  if (sortedBatches.length < 2) {
    return (
      <div className="text-sm text-muted-foreground">
        At least two observations are required.
      </div>
    )
  }

  return (
    <div className="h-25 lg:h-96 gap-4"> 


      {/* Desktop Slider */}    
      <div className='hidden lg:flex h-full'>
        {/* Date labels */}
        <div className="flex h-full flex-col justify-between py-2">
          {sortedBatches
            .slice()
            .reverse()
            .map((batch, reversedIndex) => {
              const originalIndex =
                sortedBatches.length - 1 - reversedIndex

              const isBase = originalIndex === baseIndex
              const isComparison =
                originalIndex === comparisonIndex

              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => {
                    if (originalIndex <= comparisonIndex) {
                      onBaseBatchChange(batch.id)
                    } else {
                      onComparisonBatchChange(batch.id)
                    }
                  }}
                  className={cn(
                    'rounded-md px-2 py-1 text-left text-xs transition-colors',
                    isBase &&
                      'bg-primary/10 font-medium text-primary',
                    isComparison &&
                      'bg-accent font-medium text-accent-foreground',
                    !isBase &&
                      !isComparison &&
                      'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {formatDate(batch.date)}

                  {isBase && (
                    <span className="ml-2 text-[0.65rem]">
                      End
                    </span>
                  )}

                  {isComparison && (
                    <span className="ml-2 text-[0.65rem]">
                      Start
                    </span>
                  )}
                </button>
              )
            })}
        </div>

        {/* Vertical two-thumb slider */}
        <div className="flex h-full items-center py-3">
          <Slider
            orientation="vertical"
            min={0}
            max={sortedBatches.length - 1}
            step={1}
            minStepsBetweenValues={1}
            value={[baseIndex, comparisonIndex]}
            onValueChange={handleDateRangeChange}
            className="h-full"
            aria-label="NDVI comparison date range"
          />
        </div>

    </div>




    {/* Mobile Slider */}
    <div className="flex flex-col gap-2 lg:hidden">
      
        {/* Timeline labels */}
        <div className="flex justify-between px-1 mt-5">
          {sortedBatches.map((batch, index) => {
            const isBase = index === baseIndex
            const isComparison = index === comparisonIndex

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => {
                  if (
                    Math.abs(index - baseIndex) <
                    Math.abs(index - comparisonIndex)
                  ) {
                    onBaseBatchChange(batch.id)
                  } else {
                    onComparisonBatchChange(batch.id)
                  }
                }}
                className={cn(
                  "flex w-10 flex-col items-center gap-1 text-[10px] transition-colors",
                  !isBase &&
                    !isComparison &&
                    "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Date */}
                <span
                  className={cn(
                    "-rotate-45 origin-top whitespace-nowrap pb-4",
                    isBase &&
                      "font-semibold text-primary",
                    isComparison &&
                      "font-semibold text-accent-foreground"
                  )}
                >
                  {formatDate(batch.date)}
                </span>

                {/* Tick mark */}
                <div
                  className={cn(
                    "h-2 w-px bg-border mr-4",
                    (isBase || isComparison) &&
                      "bg-primary"
                  )}
                />
              </button>
            )
          })}
        </div>
        {/* Slider */}
        <Slider
          min={0}
          max={sortedBatches.length - 1}
          step={1}
          minStepsBetweenValues={1}
          value={[baseIndex, comparisonIndex]}
          onValueChange={handleDateRangeChange}
          className="w-full pl-3 pr-6"
          aria-label="NDVI comparison date range"
        />
      </div>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}