export type SegmentClass = {
  id: string
  label: string
  color: string
  coverage: number // 0-100 percentage
}

export type SegmentationTile = {
  id: string
  image: string
  area: string
  lat: number
  lng: number
}
 
export type Batch = {
  id: string
  index: number
  label: string
  date: string
  receivedAt: number
  tiles: SegmentationTile[]
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
