
import * as diff from "diff"
import chalk from "chalk"

const lineStart = /^(?=[^])/gm

export function printDiff(expected: string, actual: string){
  if(!expected.endsWith("\n"))
    expected += "\n"
  if(!actual.endsWith("\n"))
    actual += "\n"

  let oldLine = ""
  let newLine = ""
  let anyNeutral = false

  let delAcc = ""
  let addAcc = ""

  let output = ""

  for(const diffPart of diff.diffWords(expected, actual, { ignoreWhitespace: false }))
    for(const content of diffPart.value.split(/(\n)/)) { // "abc\ndef".split(/(\n)/) = ["abc", "\n", "def"]
      if(!content) continue

      const boldContent = content === "\n" || !anyNeutral ? content : chalk.bold(content)

      if(diffPart.added)
        newLine += boldContent
      else if(diffPart.removed)
        oldLine += boldContent
      else {
        if(content !== "\n" && !anyNeutral) {
          anyNeutral = true
          oldLine = chalk.bold(oldLine)
          newLine = chalk.bold(newLine)
        }
        newLine += content
        oldLine += content
      }

      if(oldLine && !oldLine.endsWith("\n") || newLine && !newLine.endsWith("\n"))
        continue

      if(oldLine === newLine) {
        output += delAcc
        output += addAcc
        output += newLine.replace(lineStart, chalk.dim("· "))
        oldLine = ""
        newLine = ""
        delAcc = ""
        addAcc = ""
      }
      else {
        if(oldLine) {
          delAcc += chalk.red(oldLine.replace(lineStart, "- "))
          oldLine = ""
        }
        if(newLine) {
          addAcc += chalk.green(newLine.replace(lineStart, "+ "))
          newLine = ""
        }
      }

      anyNeutral = false
    }

  output += delAcc
  output += addAcc

  process.stdout.write(output)
}
