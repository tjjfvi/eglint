
import util from "util"

export function inspect(source: unknown){
  return util.inspect(source, { depth: null, colors: true })
}
