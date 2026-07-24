'use client'

import type { Report } from '@/lib/types'
import { Button } from '@/lib/button'
import { ChangeGrid } from '@/components/ui/report_cards/utils/change-log'
import { useState } from 'react'

import { 
    Trees, 
    CalendarArrowDown,
    CalendarArrowUp,
    type LucideIcon } from 'lucide-react';



function downloadGeoJson(
  geojson: object,
  filename: string
) {
  const blob = new Blob(
    [JSON.stringify(geojson, null, 2)],
    { type: 'application/geo+json' }
  )

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

export const GeneralModelIcon = Trees;
export const GeneralModelTitle = "General Model Report"



export function GeneralModelReport({ report }: { report: Report }) {
  const [datesOpen, setDatesOpen] = useState(false)
  return (
        <div>

            {/* Change Report Section */}
            <div className='py-10 md:p-10'>
                <ChangeGrid changeLog={report.data.changeLog} />
            </div>
            <div className='flex justify-center'>
                <Button
                variant="outline"
                size="sm"
                onClick={() =>
                    downloadGeoJson(
                    report.data.geojson,
                    `${report.title}.geojson`
                    )
                }
                >
                Export to GeoJSON
                </Button>
            </div>


        </div>
    )
}




