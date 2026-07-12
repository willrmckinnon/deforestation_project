
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

export type Report = {
  title: string
  type: string
  data: any
}

export type Bit = {
  label: string
  data: any
}

export type Info = {
  tag: string
  subheading: string
  bits: Bit[]
}

export type RunStatus = 'streaming' | 'complete' | 'analyzing'
export type BatchStatus = 'loading' | 'complete'


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
  coverage: number
  observation: any
  masks: Mask[]
  metadata: Info[]
  status: BatchStatus
  emptyBatch: Boolean
}


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
  reports: Report[]
  location: string
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




export type Preset = {
  label: string
  name: string
  latitude: string
  longitude: string
  area: string
  num_obs: string
  iconUrl: string
  country: string
}


