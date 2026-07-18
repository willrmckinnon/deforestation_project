'use client'

import type { ReactNode } from 'react'
import { X, MessageCircleQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

type HelpBubblePosition =
  | 'with-desktop-analysis'
  | 'with-mobile-analysis'
  | 'with-masks'
  | 'bottom-right'
  | 'bottom-left'
  | 'with-analysis-execute'

interface HelpBubbleProps {
  title: string
  children: ReactNode
  onClose: () => void
  position?: HelpBubblePosition
  className?: string
}

const positionClasses: Record<HelpBubblePosition, string> = {
  'with-desktop-analysis': 'left-[4vw] top-[50vh]',
  'with-mobile-analysis': 'left-[5vw] bottom-[10vh]',
  'with-masks': 'right-[5vw] -top-[18vh] md:right-[31vw] md:-top-[5vh] 2xl:right-[29vw] 2xl:-top-[4vh]',
  'bottom-right': 'right-[5vw] bottom-[5vh]',
  'bottom-left': 'left-[5vw] bottom-[5vh]',
  'with-analysis-execute': 'left-[5vw] bottom-[13vh]',
}

const GlobalHelpIO = process.env.NEXT_PUBLIC_GlobalHelpButtonIO == "true"

export function HelpBubble({
  title,
  children,
  onClose,
  position = 'bottom-right',
  className,
}: HelpBubbleProps) {
  return (
    /*
     * The fixed wrapper places the bubble above the entire interface.
     * pointer-events-none allows users to keep interacting with the app.
     */
    <div className={cn("pointer-events-none",
        position === 'with-masks' && "relative",
        position === 'with-analysis-execute' && "relative min-w-[23vw]",
        !['with-masks', 'with-analysis-execute'].includes(position) && "fixed",
        "inset-0 z-[100]",
        !GlobalHelpIO && 'hidden',
    )}>
      <div
        role="dialog"
        aria-label={title}
        className={cn(
          'pointer-events-auto absolute w-[calc(100%-2rem)] max-w-sm',
          'rounded-xl border border-primary/30 bg-background p-4',
          'text-foreground shadow-2xl',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-2',
          'duration-200',
          positionClasses[position],
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close help message"
          className={cn(
            'absolute right-2 top-2 rounded-md p-1.5',
            'text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring'
          )}
        >
          <X className="size-4" />
        </button>

        <div className="pr-7">
          <div className='flex items-center gap-2'>
            <MessageCircleQuestion/>
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={cn(
            'absolute',
            'border-b border-r border-primary/30 bg-background',
            position === 'with-desktop-analysis' && 'top-4 -left-2 size-4 rotate-135',
            position === 'with-mobile-analysis' && '-bottom-2 left-4 size-4 rotate-45',
            position === 'with-masks' && '-bottom-2 right-10 size-4 rotate-45 md:-right-2 md:bottom-12 md:size-4 md:rotate-315',
            position === 'with-analysis-execute' && '-top-2 left-30 size-4 rotate-225',
            ['bottom-right', 'bottom-left'].includes(position) && 'hidden'
          )}
        />
      </div>
    </div>
  )
}