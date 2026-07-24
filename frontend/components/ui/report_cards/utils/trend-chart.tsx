'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Batch } from '@/lib/types'

type NdviTrendChartProps = {
  batches: Batch[]
  baseBatchId: string
  comparisonBatchId: string
}

export function NdviTrendChart({
  batches,
  baseBatchId,
  comparisonBatchId,
}: NdviTrendChartProps) {
  const chartData = useMemo(() => {
    const baseBatch = batches.find(
      batch => batch.id === baseBatchId,
    )

    const comparisonBatch = batches.find(
      batch => batch.id === comparisonBatchId,
    )

    if (!baseBatch || !comparisonBatch) {
      return []
    }

    const startDate = new Date(`${baseBatch.date}T00:00:00`)
    const endDate = new Date(`${comparisonBatch.date}T00:00:00`)

    return batches
      .filter(batch => {
        if (
          batch.emptyBatch ||
          !batch.date ||
          batch.meanNdvi === undefined
        ) {
          return false
        }

        const batchDate = new Date(`${batch.date}T00:00:00`)

        return batchDate >= startDate && batchDate <= endDate
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime(),
      )
      .map(batch => ({
        id: batch.id,
        date: batch.date,
        dateLabel: formatShortDate(batch.date),
        meanNdvi: batch.meanNdvi,
      }))
  }, [batches, baseBatchId, comparisonBatchId])

  if (chartData.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        At least two NDVI observations are required to display a trend.
      </div>
    )
  }

  const firstPoint = chartData[0]
  const lastPoint = chartData[chartData.length - 1]

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-sm font-medium">
          Mean NDVI over selected period
        </h3>

        <p className="text-xs text-muted-foreground">
          {formatDate(firstPoint.date)} →{' '}
          {formatDate(lastPoint.date)}
        </p>
      </div>

      <div className="h-55 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 2,
              right: 10,
              bottom: 0,
              left: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              height={20}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={['dataMin - 0.05', 'dataMax + 0.05']}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={value => Number(value).toFixed(2)}
            />

            <Tooltip
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.date
                  ? formatDate(payload[0].payload.date)
                  : ''
              }
              formatter={value => [
                Number(value).toFixed(3),
                'Mean NDVI',
              ]}
            />

            <Line
              type="linear"
              dataKey="meanNdvi"
              name="Mean NDVI"
              stroke="currentColor"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: 'currentColor',
              }}
              activeDot={{
                r: 6,
              }}
              isAnimationActive
            />

            <ReferenceDot
              x={firstPoint.dateLabel}
              y={firstPoint.meanNdvi}
              r={6}
            />

            <ReferenceDot
              x={lastPoint.dateLabel}
              y={lastPoint.meanNdvi}
              r={6}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}