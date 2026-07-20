'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Leaf, MapPin, BrainCircuit, Lightbulb } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

const GlobalHelpIO = process.env.NEXT_PUBLIC_GlobalHelpButtonIO == "true"

export function WelcomeModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        !GlobalHelpIO && 'hidden',
    )}>
        <button onClick={onClose} className='fixed inset-0 z-40 bg-muted/1 backdrop-blur-sm'/>
      <div className="relative z-50 h-[75vh] mb-20 md:h-[60vh] md:mb-0 mx-6 md:mx-0 w-full max-w-5xl rounded-3xl border border-border bg-background p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col h-full space-y-6">
          
            <div className='flex items-center'>
                <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <Leaf className="size-4" />
                </div>            
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight pl-3">
                Welcome to Verdant
                </h2>
            </div>
            <div className="h-full overflow-auto">
                <p className="mt-2 text-muted-foreground pb-6 text-sm md:text-base">
                This app is built to demonstrate the use of custom AI & Scientific Modelling 
                tools to detect landmass change over time.
                </p>
            

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                    <div className='flex justify-between items-center mb-2'>
                        <h3 className=" font-medium">1. Select a Region</h3>
                        <div className='flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg'>
                            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Select from a list of preset locations around the world. The 
                        full demo of verdant allows users to select anywhere around the 
                        world they would like to analyze. Please contact me using the contact
                        information on my {' '}
                        <a href="https://will-mckinnon.com">
                            <u>home page</u>
                        </a>                        
                        {' '}if you would like access to a full demo.
                    </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                    <div className='flex justify-between items-center mb-2'>
                        <h3 className=" font-medium">2. Run an Investigation</h3>
                        <div className='flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg'>
                            <BrainCircuit className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Select the analysis icon to specify the type of model you would
                        like to run and then select run. The models will process on the 
                        backend and send the results back to you as batches are completed.
                    </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                    <div className='flex justify-between items-center mb-2'>
                        <h3 className=" font-medium">3. Analyze the Results</h3>
                        <div className='flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg'>
                            <Lightbulb className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        In addition to results for individual scenes, you will be able to view
                        composite results for an entire analysis. This is specifically helpful 
                        with change detection as the analysis results will share what changes have
                        occured between each observation.
                    </p>
                    </div>
                </div>

                <div className="text-chart-2 text-center italic p-4 text-sm md:px-20">
                    This sample application demonstrates the Verdant geospatial AI
                    workflow using pre-generated observations and analysis outputs. 
                    Please contact me at my {' '}
                    <a href="https://will-mckinnon.com">
                        <u>home page</u>
                    </a>                        
                    {' '}if you would like access to a full demo.
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}