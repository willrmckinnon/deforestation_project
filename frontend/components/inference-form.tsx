'use client'
import Link from "next/link";
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AREA_SIZES, NUM_OBSERVATIONS } from '@/lib/inference-engine'
import type { InferenceParams, Preset } from '@/lib/types'
import { Play, Satellite, MapPin, Cpu, Grid3x3, Leaf, ChevronDown } from 'lucide-react'
import { PRESETS } from "@/lib/DemoLocations"


// Import icons for presets
import GhanaIcon from "@/public/ghana.svg"

type Props = {onExecute: (params: InferenceParams) => void}
 
export function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}
 
const inputCls =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

export function InferenceForm({ onExecute }: Props) {
  const [name, setName] = useState('')
  const [area, setArea] = useState(AREA_SIZES[0])
  const [num_obs, setNumObs] = useState(NUM_OBSERVATIONS[0])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const valid = name.trim().length > 0 && latitude.trim().length > 0 && longitude.trim().length > 0



  function applyPreset(preset: Preset) {
    setName(preset.name)
    setLatitude(preset.latitude)
    setLongitude(preset.longitude)
    setArea(preset.area)
    setNumObs(preset.num_obs)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    onExecute({
      name: name,
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      area,
      num_obs,
    })
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center px-6 py-10">

      <div className="absolute top-0 right-0 pt-4">
        <Link
          href="https://will-mckinnon.com"
          className="flex items-center gap-2 md:pl-45 pr-3 md:pr-10 hover:opacity-90 hover:text-shadow-md"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="size-4" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-sidebar-foreground ">
              Will McKinnon
            </h2>
            <p className="!text-[8px] uppercase tracking-[0.25em] !text-stone">
              Verdant
            </p>
          </div>
        </Link>

      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[75vh] w-[85vw] md:h-[80vh] md:w-[50vw] 2xl:h-[70vh] 2xl:w-[40vw] flex flex-col">
        <div className="mb-4 md:mb-8 flex flex-col items-start gap-3">
          <div className="flex size-8 md:size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Satellite className="size-5 md:size-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance text-foreground">
              Initiate a New Investigation
            </h1>
            <p className="mt-1 text-xs md:text-sm leading-relaxed text-muted-foreground">
              Configure your investigation parameters and then select "Execute Inference" - 
              The model will think through your request and populate the results.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:p-6 shadow-sm overflow-auto"
        >
          <div className="mb-2 md:mb-3 flex flex-col items-center gap-3">
            <span className="text-xs md:text-sm font-medium text-muted-foreground text-center italic">
              Please note that in the demo version of this application, locations have been preselected 
              to minimize idle EC2 capacity. Select a location from the list below or reach out to setup
              a live demo instance.
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="default"
                  onClick={() => applyPreset(preset)}
                  className="h-15 w-50"
                >
                  <img
                    src={preset.iconUrl}
                    alt="X"
                    className="m-2"
                    width={18}
                    height={18}
                  />
                  <p className="text-wrap text-start pl-1">{preset.label}</p>
                </Button>
              ))}
            </div>
          </div>

          <Field label="Investigation name" icon={<Grid3x3 className="size-4" />}>
            <input
              className={inputCls}

              placeholder="e.g. Amazon Basin — Deforestation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>



          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <Field label="Target Region / AOI" icon={<MapPin className="size-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}

                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />

                <input
                  className={inputCls}

                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </Field>

            <Field label="Area of Coverage" icon={<Cpu className="size-4" />}>
              <select
                className={cn(inputCls, 'appearance-none')}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                {AREA_SIZES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Number of Observations" icon={<Satellite className="size-4" />}>
              <select
                className={cn(inputCls, 'appearance-none')}
                value={num_obs}
                onChange={(e) => setNumObs(e.target.value)}
              >
                {NUM_OBSERVATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!valid}
            className="mt-1 h-11 w-full text-sm"
          >
            <Play className="size-4" />
            Execute Inference
          </Button>
          <br className="md:hidden"/>
          <br className="md:hidden"/>
        </form>

        {/* Mobile scroll hint */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end md:hidden">
          <div className="absolute bottom-0 h-20 w-full rounded-2xl bg-gradient-to-b from-transparent via-card/80 to-card" />
          <div className="absolute bottom-0 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Select a location and scroll down to execute
            </span>
            <ChevronDown className="size-4 animate-bounce text-muted-foreground" />
          </div>
        </div>        
      </div>

    </div>
  )
}
