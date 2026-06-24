'use client'

import { useState } from 'react'
import type { Batch } from '@/lib/types'
import { MapPin, Map, Cloud } from 'lucide-react'


export function BatchCard({ batch }: { batch: Batch }) {
  
  const [selectedMaskIdx, setSelectedMaskIdx] = useState<number | null>(null)
  const displayedImage =
    selectedMaskIdx === null
      ? batch.image
      : batch.masks[selectedMaskIdx]?.image



  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md md:flex">
      <div className="relative aspect-square overflow-hidden bg-muted md:w-90 lg:w-120 lg:min-h-[24rem]">
        <img
          src={displayedImage || '/placeholder.svg'}
          alt={`Satellite tile at ${batch.lat}, ${batch.lng}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous"
        />
 

        {/* Analytics */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground backdrop-blur-sm">
          <Cloud className="size-3 text-primary" />
          {((1-batch.coverage)*100).toFixed(0)} %
        </div>
      </div>

      <div className = 'flex flex-col'>
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
          <div className="flex flex-row">
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
      </div>



    </div>
  )
}
