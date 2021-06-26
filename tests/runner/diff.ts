
import { diffLines } from "diff"
import chalk from "chalk"

const lineStart = /^(?=[^])/gm

export function createRichDiff(expected: string, actual: string){
  if(actual && !actual.endsWith("\n"))
    actual += "\n"
  if(expected && !expected.endsWith("\n"))
    expected += "\n"

  let output = ""

  for(const diffPart of diffLines(expected, actual))
    if(diffPart.added)
      output += chalk.green(diffPart.value.replace(lineStart, "+ "))
    else if(diffPart.removed)
      output += chalk.red(diffPart.value.replace(lineStart, "- "))
    else
      output += diffPart.value.replace(lineStart, chalk.dim("· "))

  return output
}
