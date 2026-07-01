'use client'

import { useState } from 'react'
import type { Batch } from '@/lib/types'
import { MapPin, Map, Cloud } from 'lucide-react'
import { InfoCard } from '@/components/info-card'



export function BatchCard({ batch }: { batch: Batch }) {
  
  const [selectedMaskIdx, setSelectedMaskIdx] = useState<number | null>(null)
  const displayedImage =
    selectedMaskIdx === null
      ? batch.image
      : batch.masks[selectedMaskIdx]?.image
  const noAnalyticsMessage: string = 'No Analytics to display \n Run analysis by clicking on the left panel to see results'


  return (
    <div className="flex flex-1 w-full min-w-0 md:h-full flex-col md:flex-row lg:justify-between">
      
      {/*A spacer to center the image and compensate for the analysis panel */}
      {/*<div className='hidden md:flex md:w-[25vw]'></div>*/}
      <div className='hidden md:block w-0'/>

      <div className='pb-3 md:pb-0'>
        <div className="aspect-square items-center justify-center w-full md:h-full rounded-xl  shadow-sm md:shadow-2xl">
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {/*Image*/}
            <img
              src={displayedImage || '/placeholder.svg'}
              alt="Observation"
              className="h-full w-full object-contain"
            />
            {/*Coverage Icon*/}
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground backdrop-blur-sm">
              <Cloud className="size-3 text-primary" />
              {((1-batch.coverage)*100).toFixed(0)} %
            </div>
          </div>
        </div>
      </div>


 

      {/* Analytics */}
      <div className = "flex flex-col w-full min-h-0 md:w-[40vw] shrink-0 rounded-xl border bg-card p-4 shadow-lg">

        <div>
          <h2 className="text-base font-semibold text-foreground">
            {batch.label}
          </h2>
          <p className="text-xs text-muted-foreground">
            Observation Date:{' '}
            <span className="font-medium text-foreground">
              {batch.date}
            </span>{' '}

          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Received{' '}
          {new Date(batch.receivedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>

        <div className="flex flex-row gap-2.5 p-3">
          
          <div className="inline-flex self-start shrink-0 items-center rounded-md gap-1 text-[0.7rem] text-muted-foreground tabular-nums border px-2 py-0.25 shadow-sm">
            <MapPin className="size-3" />
            {batch.lat.toFixed(3)}, {batch.lng.toFixed(3)}
          </div>
          <div className="inline-flex self-start shrink-0 items-center rounded-md gap-1 text-[0.7rem] text-muted-foreground tabular-nums border px-2 py-0.25 shadow-sm">
            <Map className="size-3" />
            {batch.area} sqkm
          </div>
        </div>

      

        {/*Section for mask buttons */}
        {batch.masks.length > 0 && (
          <div className="flex flex-row, pb-3">
            <span className = "flex items-center border-r border-border pl-10 pr-0 pr-3 text-[11px] italic leading-[13px]">
              LAYERS
            </span>
            <div className="flex flex-wrap gap-2 px-2">
              <button
                type="button"
                onClick={() => setSelectedMaskIdx(null)}
                className={
                  selectedMaskIdx === null
                    ? 'rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground'
                    : 'rounded-md border px-3 py-1 text-xs'
                }
              >
                No Mask
              </button>

              {batch.masks.map((mask, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedMaskIdx(idx)}
                  className={
                    selectedMaskIdx === idx
                      ? 'rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground'
                      : 'rounded-md border px-3 py-1 text-xs'
                  }
                >
                  {mask.tag ?? `Mask ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className='flex flex-col flex-1 gap-4 min-h-0 px-3 pt-4 overflow-y-auto'>

          {batch.metadata[0] == null ?(
            <div className='flex justify-center pt-30'>
              <p className='italic text-sm text-muted-foreground whitespace-pre-line text-center'>
                {noAnalyticsMessage}
              </p>
            </div>
          ):(<div/>)}

          {batch.metadata.map((info, i) => (
            <InfoCard key={i} info={info} />
          ))}
        </div>






      </div>
    </div>
  )
}
