'use client'

// Standard imports
import { useState } from 'react'
import type { Report, Batch, ReportProps } from '@/lib/types'
import { CalendarArrowDown, CalendarArrowUp, type LucideIcon } from 'lucide-react';

// Import each report type
import { GeneralModelIcon, GeneralModelTitle, GeneralModelReport } from '@/components/ui/report_cards/general-model-report'
import { NDVIIcon, NDVITitle, NDVIReport } from '@/components/ui/report_cards/ndvi-report'


function setIcon (reportType: string): LucideIcon | null {
    switch(reportType) {
        case 'Custom Forest Detection Model': return GeneralModelIcon;
        case 'NDVI Calculation': return NDVIIcon;
        default: return null;
    }
}

function setTitle (reportType: string): string {
    switch(reportType) {
        case 'Custom Forest Detection Model': return GeneralModelTitle;
        case 'NDVI Calculation': return NDVITitle;
        default: return "Unknown Report";            
    }
}

function setReport ({ report, batches }: ReportProps) {
    switch(report.type) {
        case 'Custom Forest Detection Model': return <GeneralModelReport report={report} />
        case 'NDVI Calculation': return <NDVIReport batches={batches} masks={report.data.comparison_masks}/>
        default:
            return (
                <div className="flex flex-1 w-full lg:h-full flex-col md:flex-row lg:justify-between">
                    <div className='flex items-center justify-center bg-card m-40 lg:mx-70 w-full shadow-xl rounded-2xl'>
                        <span>Error rendering report</span>
                    </div>
                </div>
            )           
    }
}










export function ReportTile (reportType: string){
    const Icon = setIcon(reportType)
    const title = setTitle(reportType)

    return (
    <div className="flex flex-col h-5 md:h-15 w-10 md:w-30 justify-center items-center bg-card rounded-lg">
        {Icon && <Icon className="h-7 w-7" />}
        <span className='hidden md:block italic text-xs text-primary pt-1.5'>{title}</span>
    </div>
    );
}


export function ReportCard({ report, batches }: ReportProps) {
    const [datesOpen, setDatesOpen] = useState(false)
    return (
        <div className="flex flex-1 w-full md:mx-[5vw] lg:h-full flex-col md:flex-row lg:justify-between">
            <div className='flex flex-1 flex-col w-full h-full px-4 py-3 md:px-8 md:py-4 bg-card rounded-xl border shadow-xl'>
                
                {/* Header */}
                <div className='relative'>
                    <div className='flex flex-1 flex-col pb-2'>
                        <div className='flex items-center'>
                            <h2 className="text-base font-semibold text-foreground"> {report.title}</h2>
                            <h2 className='hidden md:flex px-3'>|</h2>
                            <h2 className='hidden md:flex italic'>{report.type}</h2>
                        </div>
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

                {/* Report */}
                {setReport({report, batches})}
            </div>
        </div>


    )
}




