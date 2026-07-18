import type { InferenceParams, Preset } from '@/lib/types'
import { AREA_SIZES, NUM_OBSERVATIONS } from '@/lib/inference-engine'


export const PRESETS: Preset[] = [
    {
      label: 'Data Centers in the US',
      name: 'Data Centers in the US',
      latitude: '41.529',
      longitude: '-75.524',
      area: AREA_SIZES[1],
      num_obs: NUM_OBSERVATIONS[3],
      iconUrl: "/usa.svg",
      country: "us"
    },
    {
      label: 'Deforestation in the Amazon Basin',
      name: 'Deforestation in the Amazon Basin',
      latitude: '-13.049',
      longitude: '-70.534',
      area: AREA_SIZES[2],
      num_obs: NUM_OBSERVATIONS[4],
      iconUrl: "/peru.svg",
      country: "peru"
    },
    {
      label: 'Illegal Gold Mining in Ghana',
      name: 'Illegal Gold Mining in Ghana',
      latitude: '5.793662',
      longitude: '-2.481317',
      area: AREA_SIZES[2],
      num_obs: NUM_OBSERVATIONS[5],
      iconUrl: "/ghana.svg",
      country: "ghana"
    },
  ]


const PRESET_KEY = {
    'Data Centers in the US': "us",
    'Deforestation in the Amazon Basin': 'peru',
    'Illegal Gold Mining in Ghana': 'ghana'
}  



export function getDemoLocation(title:string) {
    const location = PRESET_KEY[title as keyof typeof PRESET_KEY]

    if (!location) {
        throw new Error(
            `Unknown demo location: ${title}`
        )
    }

    return location
}