
import fs from "fs/promises"
import { join as joinPath } from "path"
import ts from "typescript"
import { cacheFn, Node, parseTsSourceFile } from "../../src"
import chalk from "chalk"
import { printDiff } from "./diff"

const path = (relativePath: string) =>
  joinPath(__dirname, "../crossproduct", relativePath)

const file = (relativePath: string) =>
  fs.readFile(path(relativePath), "utf8")

export default async (update: boolean, filter: string[]) => {
  const referenceFiles = await fs.readdir(path("references/"))
  const sourceFiles = await fs.readdir(path("sources/"))

  const inFilter = (x: string) => !filter.length || filter.includes(x)

  const parseFile = cacheFn<string, Promise<Node>>(async (path: string) => {
    const text = await file(path)
    const tsNode = ts.createSourceFile("reference", text, ts.ScriptTarget.ES2020, true)
    const node = parseTsSourceFile(tsNode)
    return node
  }, new Map())

  const results = await Promise.all(referenceFiles.flatMap(ref => [
    ...referenceFiles.flatMap(src => inFilter(`${src}-${ref}`) ? [
      runPairing(`references/${ref}`, `references/${src}`, `outputs/${src}-${ref}`),
    ] : []),
    ...sourceFiles.flatMap(src => inFilter(`${src}-${ref}`) ? [
      runPairing(`references/${ref}`, `sources/${src}`, `outputs/${src}-${ref}`),
    ] : []),
  ]))

  async function runPairing(ref: string, src: string, out: string){
    let state = ""
    try {
      state = `parsing ${chalk.bold(ref)}`
      const referenceNode = await parseFile(ref)

      state = `parsing ${chalk.bold(src)}`
      const sourceNode = await parseFile(src)

      state = `adapting ${chalk.bold(src)} to ${chalk.bold(ref)}`
      const outputNode = sourceNode.adaptTo([], referenceNode.getAllNodes())

      state = `stringifying ${chalk.bold(out)}`
      const outputText = outputNode.toString()

      state = `reading ${chalk.bold(out)}`
      const expectedText = await file(out).catch(() => null)

      if(outputText === expectedText)
        return true

      if(update) {
        state = `Writing ${chalk.bold(out)}`
        await fs.writeFile(path(out), outputText)
      }

      if(expectedText !== null) {
        console.log((update ? chalk : chalk.redBright)(`Output changed in ${chalk.bold(out)}:`))
        state = `diffing ${chalk.bold(out)}`
        printDiff(expectedText, outputText)
        console.log()
      }

      if(expectedText === null)
        console.log((update ? chalk : chalk.redBright)(
          `${update ? "Created" : "Missing"} output file ${chalk.bold(out)}\n`,
        ))

      return update
    }
    catch (e) {
      console.log(chalk.redBright(`Error when ${state}:`))
      console.log(e)
      console.log()

      return false
    }
  }

  return results
}

