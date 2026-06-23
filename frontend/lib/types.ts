import { float } from "@/v_1_node_modules/@emnapi/runtime/dist/emnapi.cjs.min"

export type SegmentClass = {
  id: string
  label: string
  color: string
  coverage: number // 0-100 percentage
}

export type Mask = {
  tag: string
  modelName: string
  image: string
  metadata: JSON
}
 
export type Batch = {
  id: string
  index: number
  label: string
  image: string
  date: string
  receivedAt: number
  area: string
  lat: number
  lng: number
  coverage: float
  observation: any
  masks: Mask[]
}

export type RunStatus = 'streaming' | 'complete'

export type InferenceParams = {
  name: string
  latitude: string
  longitude: string
  area: string
  num_obs: string
}

export type Run = {
  id: string
  params: InferenceParams
  createdAt: number
  status: RunStatus
  batches: Batch[]
  expectedBatches: number
}

export type ModelInferenceParams = {
  modelName: string
  lat: number
  lng: number
  area: string
  observations: {
    batchId: string
    observation: any
  }[]
}


