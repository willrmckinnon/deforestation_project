import type { Batch, SegmentClass } from './types'

const CLASS_PALETTE: { label: string; color: string }[] = [
  { label: 'Dense Forest', color: 'oklch(0.5 0.1 150)' },
  { label: 'Cropland', color: 'oklch(0.72 0.11 110)' },
  { label: 'Grassland', color: 'oklch(0.78 0.1 130)' },
  { label: 'Water', color: 'oklch(0.62 0.08 220)' },
  { label: 'Wetland', color: 'oklch(0.58 0.07 180)' },
  { label: 'Bare Soil', color: 'oklch(0.65 0.08 70)' },
  { label: 'Urban', color: 'oklch(0.55 0.02 60)' },
]

export function makeBatch(msg: any): Batch {
  return {
    id: crypto.randomUUID(),
    index: msg.index,
    label: msg.batch_id,
    date: msg.date,
    receivedAt: Date.now(),
    observation: msg.obs,
    image: msg.image,
    area: msg.area,
    lat: msg.lat,
    lng: msg.lng,
    coverage: msg.obs['coverage'],
    masks: [],
    status: 'complete'
  }
}




export const AREA_SIZES = ['25 sqkm', '50 sqkm', '75 sqkm', '100 sqkm']
export const NUM_OBSERVATIONS = ['2','3','4','5','6','7','8']
export const MODELS = ['None', 'Custom Forest Detection Model']
