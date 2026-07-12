export type DemoLocation =
  | "ghana"
  | "peru"
  | "us";

export type DemoRunType =
  | "collection"
  | "investigation";


const DEMO_BUCKET = "https://willrmckinnon-public.s3.us-east-1.amazonaws.com/verdant/sample_responses"

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export class DemoPlayer {

  async play(
    location: string,
    runType: DemoRunType,
    handlers:{
      onBatch?: (data:any)=>void
      onModelReturn?: (data:any)=>void
      onChangeReport?: (data:any)=>void
      onEmptyBatch?: (data:any)=>void
      onComplete?: ()=>void
    }
  ){

    const url =`${DEMO_BUCKET}/${location}/${runType}.json`
    console.log(url)


    const response = await fetch(url)
 
    if(!response.ok){
      throw new Error(`Unable to load ${url}`)
    }


    const messages = await response.json()


    for(const msg of messages){

      switch(msg.type){

        case "batch":
          handlers.onBatch?.(msg.data)
          break

        case "model_return":
          handlers.onModelReturn?.(msg.data)
          break

        case "change_report":
          handlers.onChangeReport?.(msg.data)
          break

        case "emptyBatch":
          handlers.onEmptyBatch?.(msg.data)
          break

      }


      await sleep(1000)
    }


    handlers.onComplete?.()
  }
}