
import chalk from "chalk"
import { promises as fs } from "fs"
import { join as joinPath } from "path"
import ts from "typescript"
import { SourceFileNode } from "../../src"
import { createRichDiff } from "./diff"
import { TestResult } from "./types"

const sourcePath = (relativePath: string) =>
  joinPath(__dirname, "../..", relativePath)

export default (filterRaw: string[]) => {
  const filter = filterRaw.map(s => s.replace(/\/$/, ""))

  return processPath("src")

  async function processPath(path: string): Promise<TestResult[]>{
    const [text, files] = await Promise.all([
      fs.readFile(sourcePath(path), "utf8").catch(() => null),
      fs.readdir(sourcePath(path)).catch(() => null),
    ])
    if(text) return [await processFile(path, text)]
    if(files) return (await Promise.all(files.map(file => processPath(joinPath(path, file))))).flat()
    throw new Error(`Invalid path ${path}`)
  }

  async function processFile(path: string, sourceText: string): Promise<TestResult>{
    if(filter.length && (!filter.includes(path) && !filter.includes("src")))
      return { status: "skipped" }
    let state = ""
    try {
      state = `parsing ${chalk.bold(path)}`
      const sourceNode = new SourceFileNode(ts.createSourceFile("ref", sourceText, ts.ScriptTarget.ES2020, true))
      state = `adapting ${chalk.bold(path)} to ${chalk.bold(path)}`
      const outputNode = sourceNode.adaptTo([], sourceNode.getAllNodes())
      state = `stringifying ${chalk.bold(path)}`
      const outputText = outputNode.toString()
      if(outputText === sourceText) {
        state = "done"
        return { status: "passed" }
      }
      console.log(chalk.redBright(`Source file ${chalk.bold(path)} changed:`))
      state = `diffing ${chalk.bold(path)}`
      console.log(createRichDiff(sourceText, outputText))
      state = "done"
      return { status: "failed" }
    }
    catch (e) {
      console.log(chalk.redBright(`Error when ${state}:`))
      console.log(e)
      console.log()

      return { status: "errored" }
    }
  }
}
