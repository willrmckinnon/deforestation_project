'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronsLeftRight, ChartSpline } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Batch } from '@/lib/types'
import {NdviTrendChart} from '@/components/ui/report_cards/utils/trend-chart'
import { NdviDateRangeSlider } from '@/components/ui/report_cards/utils/sliding-bar'


export const NDVIIcon = ChartSpline;
export const NDVITitle = "NDVI Report"

type ChangeAreaProperties = {
  segment_id: number
  pixel_count: number
  mean_ndvi_change: number
  mean_abs_ndvi_change: number
  minimum_ndvi_change: number
  maximum_ndvi_change: number
  loss_fraction: number
  gain_fraction: number
  predominant_change: string
  area_sqm: number
  area_sqkm: number
}

type ChangeAreaGeoJson = {
  type: 'FeatureCollection'
  features: Array<{
    id: string
    type: 'Feature'
    properties: ChangeAreaProperties
    geometry: {
      type: 'Polygon' | 'MultiPolygon'
      coordinates: unknown
    }
  }>
}

export type NdviComparisonMask = {
  image: string
  baseDate?: string
  comparisonDate?: string
  change_area_image?: string
  change_area_gdf?: ChangeAreaGeoJson
}

type NdviComparisonToolProps = {
  batches: Batch[]
  masks: NdviComparisonMask[]
}
 
export function NDVIReport({
  batches,
  masks,
}: NdviComparisonToolProps) {
  /*
   * Remove empty batches, batches without dates, and batches without images.
   * Then sort chronologically from oldest to newest.
   */
   
  
  const sortedBatches = useMemo(
    () =>
      batches
        .filter(
          batch =>
            !batch.emptyBatch &&
            Boolean(batch.date) &&
            Boolean(batch.image),
        )
        .sort(
          (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime(),
        ),
    [batches],
  )

  /*
   * The most recent batch cannot be selected as the base because there
   * would be no later observation to compare against.
   */
  const baseBatchOptions = useMemo(
    () => sortedBatches.slice(0, -1),
    [sortedBatches],
  )

  const [baseBatchId, setBaseBatchId] = useState(sortedBatches[0]?.id ?? '')
  const [comparisonBatchId, setComparisonBatchId] = useState( sortedBatches[sortedBatches.length - 1]?.id ?? '') 
  const [baseImagePercent, setBaseImagePercent] = useState(50)

  /*
   * Initialize the selected base batch when batches first become available.
   */
  useEffect(() => {
    const baseStillExists = baseBatchOptions.some(batch => batch.id === baseBatchId)
    if (!baseStillExists) {setBaseBatchId(baseBatchOptions[0]?.id ?? '')}
  }, [baseBatchId, baseBatchOptions])

  const baseBatchIndex = useMemo(
    () =>
      sortedBatches.findIndex(
        batch => batch.id === baseBatchId,
      ),
    [baseBatchId, sortedBatches],
  )

  /*
   * Only batches occurring after the selected base batch are valid
   * comparison options.
   */
  const comparisonBatchOptions = useMemo(() => {
    if (baseBatchIndex === -1) {return []}
    return sortedBatches.slice(baseBatchIndex + 1)
  }, [baseBatchIndex, sortedBatches])

  /*
   * Default the comparison to the most recent available batch.
   * Also reset it when the user changes the base batch.
   */
  useEffect(() => {
    const comparisonStillValid = comparisonBatchOptions.some(batch => batch.id === comparisonBatchId)

    if (!comparisonStillValid) {
      setComparisonBatchId(
        comparisonBatchOptions[
          comparisonBatchOptions.length - 1
        ]?.id ?? '',
      )
    }
  }, [comparisonBatchId, comparisonBatchOptions])

  const baseBatch = sortedBatches.find(batch => batch.id === baseBatchId)
  const comparisonBatch = sortedBatches.find(batch => batch.id === comparisonBatchId)

  /*
   * Match the selected date pair to its corresponding backend-generated
   * NDVI change mask.
   */
  const comparisonMask = masks.find(
    mask =>
      mask.baseDate === baseBatch?.date &&
      mask.comparisonDate === comparisonBatch?.date,
  )



  const gdf = comparisonMask?.change_area_gdf
    ? comparisonMask.change_area_gdf
    : null






  if (sortedBatches.length < 2) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        At least two valid observations are required for NDVI comparison.
      </div>
    )
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 overflow-auto lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
      {/* Date selection column */}
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-1 flex-col items-center rounded-2xl bg-chart-3/30 p-3">
          <h2 className="text-base font-semibold">
            Select Date
          </h2>

          <span className="text-xs italic">
            {formatDate(baseBatch?.date)} →{' '}
            {formatDate(comparisonBatch?.date)}
          </span>

          <div className="mt-4 w-full rounded-xl bg-chart-3/20 p-2">
            <NdviDateRangeSlider
              batches={batches}
              baseBatchId={baseBatchId}
              comparisonBatchId={comparisonBatchId}
              onBaseBatchChange={setBaseBatchId}
              onComparisonBatchChange={setComparisonBatchId}
            />
          </div>
        </div>

        {/* Matches the center legend height */}
        <div className="mt-3 hidden min-h-5 lg:block" />
      </div>

      {/* Main comparison image column */}
      <div className="flex min-h-0 flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-card">
          {baseBatch ? (
            <img
              src={baseBatch.image}
              alt={`Observation from ${formatDate(baseBatch.date)}`}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : null}

          {comparisonMask ? (
            <img
              src={comparisonMask.image}
              alt={`NDVI change from ${formatDate(
                baseBatch?.date,
              )} to ${formatDate(comparisonBatch?.date)}`}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{
                clipPath: `inset(0 ${baseImagePercent}% 0 0)`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 p-4 text-center text-sm text-muted-foreground backdrop-blur-sm">
              No NDVI comparison mask is available for this date pair.
            </div>
          )}

          {/* Sliding divider */}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-md"
            style={{
              left: `${100 - baseImagePercent}%`,
            }}
          >
            <div className="absolute bottom-0 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border bg-background shadow">
              <ChevronsLeftRight className="size-4" />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={baseImagePercent}
            onChange={event =>
              setBaseImagePercent(
                100 - Number(event.target.value),
              )
            }
            aria-label="Reveal NDVI change mask"
            className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>

        {/* Footer below the shared baseline */}
        <div className="mt-3 flex min-h-5 flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-red-500" />
            NDVI Decrease
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-green-500" />
            NDVI Increase
          </div>
        </div>
      </div>

      {/* Analytics column */}
      <div className="flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <NdviTrendChart
            batches={batches}
            baseBatchId={baseBatchId}
            comparisonBatchId={comparisonBatchId}
          />

          <div className="flex min-h-0 flex-1 flex-col mt-5">
            <h2 className="my-2 text-sm font-medium">
              Region with the highest level of NDVI loss
            </h2>

            <div className="relative flex min-h-0 flex-1 items-start gap-4">
              {comparisonMask ? (
                <img
                  src={comparisonMask.change_area_image}
                  alt="Region with the greatest NDVI loss"
                  className="h-full max-w-1/2 rounded-xl object-contain object-left"
                />
              ) : (
                <div className="flex h-full min-h-32 flex-1 items-center justify-center rounded-xl bg-background/60 p-4 text-center text-sm text-muted-foreground backdrop-blur-sm">
                  No area to focus on provided
                </div>
              )}

              <div className='flex flex-col'>

                <div className="flex flex-col text-xs justify-between pl-8 py-4">
                    <span className="italic text-gray-500">Mean Change in NDVI</span>
                    <span className="pt-2 text-primary font-bold">{gdf?.features[0].properties.mean_ndvi_change.toFixed(3)}</span>
                </div>
                <div className="flex flex-col text-xs justify-between pl-8 py-4">
                    <span className="italic text-gray-500">Area of Change</span>
                    <span className="pt-2 text-primary font-bold">{JSON.stringify(gdf?.features[0].properties.area_sqkm)} sqkm</span>
                </div>
              
              </div>
            </div>
          </div>
        </div>

        {/* Matches the center legend height */}
        <div className="mt-3 hidden min-h-5 lg:block" />
      </div>
    </div>
  )
}

type BatchDateSelectorProps = {
  title: string
  batches: Batch[]
  selectedBatchId: string
  onSelect: (batchId: string) => void
}

function BatchDateSelector({
  title,
  batches,
  selectedBatchId,
  onSelect,
}: BatchDateSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>

      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {batches.map(batch => {
          const selected = batch.id === selectedBatchId

          return (
            <button
              key={batch.id}
              type="button"
              onClick={() => onSelect(batch.id)}
              className={cn(
                'shrink-0 rounded-md border px-[2px] py-[2px] text-xs transition-colors',
                'hover:bg-muted',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background',
              )}
            >
              {formatDate(batch.date)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(date?: string) {
  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}