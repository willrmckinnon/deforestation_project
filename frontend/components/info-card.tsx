'use client'

import { useState } from 'react'
import type { Batch, Info } from '@/lib/types'
import { ChevronUp, ChevronDown} from 'lucide-react'


type Props = {info: Info}

export function InfoCard({ info }: Props) {
const [open, setOpen] = useState(false)
return (
    <div className="flex flex-col py-2 px-1">
        {/* Header */}
        <div className="flex flex-row items-center justify-between" onClick={() => setOpen(v => !v)}>
            <div className='flex items-center'>
                <span className="text-sm font-bold">{info.tag}   </span>
                <span className="text-xs">— {info.subheading}</span>
            </div>
            <div className="pr-2">{open ? <ChevronDown/> : <ChevronUp/>}</div>
        </div>

        {/* Body */}
        {open && (
            <div className="flex flex-col px-4">
            {info.bits.map((bit, i) => (
                <div className="flex flex-col text-xs justify-between py-4" key={i}>
                    <span className="italic text-gray-500">{bit.label}</span>
                    <span className="pt-2 text-primary font-bold">{String(bit.data)}</span>
                </div>
            ))}
            </div>
        )}
    </div>
)
}