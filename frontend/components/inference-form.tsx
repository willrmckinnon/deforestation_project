'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AREA_SIZES, NUM_OBSERVATIONS } from '@/lib/inference-engine'
import type { InferenceParams } from '@/lib/types'
import { Play, Satellite, MapPin, Cpu, Grid3x3 } from 'lucide-react'

type Props = {
  onExecute: (params: InferenceParams) => void
}
 
function Field({
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
  const [region, setRegion] = useState('')
  const [area, setArea] = useState(AREA_SIZES[0])
  const [num_obs, setNumObs] = useState(NUM_OBSERVATIONS[0])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const valid = name.trim().length > 0 && latitude.trim().length > 0 && longitude.trim().length > 0

  type Preset = {
    label: string
    name: string
    latitude: string
    longitude: string
    area: string
    num_obs: string
  }

  const PRESETS: Preset[] = [
    {
      label: 'Amazon Basin',
      name: 'Amazon Basin',
      latitude: '-12.6806',
      longitude: '-69.3657',
      area: AREA_SIZES[1],
      num_obs: NUM_OBSERVATIONS[1],
    },
    {
      label: 'South Papua',
      name: 'South Papua',
      latitude: '-8.206518',
      longitude: '140.321443',
      area: AREA_SIZES[2],
      num_obs: NUM_OBSERVATIONS[2],
    },
    {
      label: 'Congo',
      name: 'Congo',
      latitude: '1.6063',
      longitude: '25.7408',
      area: AREA_SIZES[1],
      num_obs: NUM_OBSERVATIONS[2],
    },
  ]

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
      name: name.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      area,
      num_obs,
    })
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Satellite className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            Initiate a New Investigation
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Configure your investigation parameters and then select "Execute Inference" - 
            The model will think through your request and populate the results.
          </p>
        </div>
      </div>
      
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
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
      </form>
      <div className="mb-8 flex flex-col items-start gap-3"></div>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap italic">
          Select from presets:
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

    </div>
  )
}
