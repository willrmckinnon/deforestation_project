'use client'

import type { SegmentationTile } from '@/lib/types'
import { MapPin, Gauge } from 'lucide-react'

export function TileCard({ tile }: { tile: SegmentationTile }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md md:flex">
      <div className="relative aspect-square overflow-hidden bg-muted md:w-90 lg:w-120 lg:min-h-[24rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tile.image || '/placeholder.svg'}
          alt={`Satellite tile at ${tile.lat}, ${tile.lng}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous"
        />
        {/* segmentation overlay */}


        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground backdrop-blur-sm">
          <Gauge className="size-3 text-primary" />
          {tile.area}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground tabular-nums">
          <MapPin className="size-3" />
          {tile.lat.toFixed(3)}, {tile.lng.toFixed(3)}
        </div>


      </div>
    </div>
  )
}
