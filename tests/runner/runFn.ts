/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Piscina from "piscina"

let piscina: Piscina

export async function runFn<T extends(...args: any[]) => Promise<any>>(
  fileName: string,
  exportName: string,
  ...args: Parameters<T>
): Promise<ReturnType<T> extends Promise<infer U> ? U : never>{
  piscina ??= new Piscina({
    filename: __filename,
    idleTimeout: 500,
  })
  return piscina.run([fileName, exportName, ...args])
}

export default (async function([fileName, exportName, ...args]: any){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return await require(fileName)[exportName](...args)
} as unknown /* private */)

