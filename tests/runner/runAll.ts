
import runCrossproductTests from "./crossproduct"
import runRoundtripSelfTests from "./roundtrip-self"

export default async (update: boolean, filter: string[]) => (await Promise.all([
  runCrossproductTests(update, filter),
  runRoundtripSelfTests(filter),
])).flat()
