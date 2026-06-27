import type { Batch } from './types'

export function makeBatch(msg: any): Batch {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)

  return {
    id: id,
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
    metadata: [],
    status: 'complete'
  }
}

export const AREA_SIZES = ['25 sqkm', '50 sqkm', '75 sqkm', '100 sqkm']
export const NUM_OBSERVATIONS = ['2','3','4','5','6','7','8']
export const MODELS = [
  'None', 
  'Custom Forest Detection Model'
]
