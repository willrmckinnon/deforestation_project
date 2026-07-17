'use client'

import type { Report } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ChangeGrid } from '@/components/ui/change-log'
import { useState } from 'react'

import { 
    Trees, 
    FileText, 
    CalendarArrowDown,
    CalendarArrowUp,
    type LucideIcon } from 'lucide-react';

function getReportIcon(reportType: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    customforestdetectionmodel: Trees,
  };
  return iconMap[reportType.toLowerCase().replace(/\s/g, "")] ?? FileText;
}

function getReportTitle(reportType: string): string {
  const titleMap: Record<string, string> = {
    customforestdetectionmodel: "Change Report",
  };
  return titleMap[reportType.toLowerCase().replace(/\s/g, "")] ?? "Unknown Report";
}

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


export function ReportTile (reportType: string){
    const Icon = getReportIcon(reportType);
    const title = getReportTitle(reportType);

    return (
    <div className="flex flex-col h-5 md:h-15 w-10 md:w-30 justify-center items-center bg-card rounded-lg">
        <Icon className="h-7 w-7" />
        <span className='hidden md:block italic text-xs text-primary pt-1.5'>{title}</span>
    </div>
    );
}


export function ReportCard({ report }: { report: Report }) {
  const [datesOpen, setDatesOpen] = useState(false)
  return (
        <div className="flex flex-1 w-full lg:h-full flex-col md:mx-[4vw] md:flex-row lg:justify-between">
            <div className='flex flex-1 flex-col w-full h-full px-4 py-3 md:px-8 md:py-4 bg-card rounded-xl border shadow-xl'>
                
                {/* Header */}
                <div className='relative'>
                    <div className='flex flex-1 flex-col pb-2'>
                        <h2 className="text-base font-semibold text-foreground">
                            {report.title}
                        </h2>
                        <span className="text-[10px] md:text-xs italic font-medium text-muted-foreground">
                            {report.data.dateRanges}
                        </span>
                    </div>
                    <button 
                    className="absolute right-0 top-0 w-35 z-[80] items-center rounded-md gap-1 text-xs text-muted-foreground tabular-nums border px-2 py-0.25 shadow-sm"
                    onClick={() => setDatesOpen(!datesOpen)} 
                    >
                        <div className='flex flex-col items-center'>
                            <div className='inline-flex items-center pt-0.5 italic'>        
                                {datesOpen ? (<CalendarArrowDown className="size-3" />) : (<CalendarArrowUp className="size-3" />)}
                                <span className='px-1'>Report Dates</span>
                            </div>

                            {datesOpen ? (
                                report.data.dateList.map((date: string,i:number) => (
                                    <span className='text-[8px] md:text-xs' key={i}>{date}</span>
                                ))) : (<div/>)}
                        </div>


                    </button>
                </div>

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
        </div>
    )
}




