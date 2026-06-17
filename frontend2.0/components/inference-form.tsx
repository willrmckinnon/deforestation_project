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

{/*
          <Field label="Target region / AOI" icon={<MapPin className="size-4" />}>
            <input
              className={inputCls}
              placeholder="e.g. -3.46, -62.21 · 1200 km²"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </Field>


          <Field label="Model" icon={<Cpu className="size-4" />}>
            <select
              className={cn(inputCls, 'appearance-none')}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
*/}

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
    </div>
  )
}
