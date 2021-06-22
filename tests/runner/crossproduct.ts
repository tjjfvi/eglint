
import fs from "fs/promises"
import { join as joinPath } from "path"
import ts from "typescript"
import { cacheFn, Node, parseTsSourceFile } from "../../src"
import chalk from "chalk"
import { printDiff } from "./diff"

const testPath = (relativePath = "") =>
  joinPath(__dirname, "../crossproduct", relativePath)

const file = (relativePath: string) =>
  fs.readFile(testPath(relativePath), "utf8")

export default async (update: boolean, filterRaw: string[]) => {
  const filter = filterRaw.map(s => s.replace(/^tests\/crossproduct\//, "").replace("/out/", "/"))

  const testSetDirs = await fs.readdir(testPath())

  const parseFile = cacheFn<string, Promise<Node>>(async (path: string) => {
    const text = await file(path)
    const tsNode = ts.createSourceFile("reference", text, ts.ScriptTarget.ES2020, true)
    const node = parseTsSourceFile(tsNode)
    return node
  }, new Map())

  const results = await Promise.all(testSetDirs.map(async testSet => {
    const referenceDir = joinPath(testSet, "ref")
    const subjectDir = joinPath(testSet, "sub")
    const outputDir = joinPath(testSet, "out")
    const referenceFiles = await fs.readdir(testPath(referenceDir))
    const subjectFiles = await fs.readdir(testPath(subjectDir))
    const referencePath = (f: string) => joinPath(referenceDir, f)
    const subjectPath = (f: string) => joinPath(subjectDir, f)
    const outputPath = (f: string) => joinPath(outputDir, f)

    if(update)
      await fs.mkdir(testPath(outputDir), { recursive: true })

    const duplicateFilenames = referenceFiles.filter(f => subjectFiles.includes(f))

    if(duplicateFilenames.length)
      throw new Error(`duplicate file names: ${duplicateFilenames.join(", ")}`)

    const inFilter = (x: string) =>
      false
        || !filter.length
        || filter.includes(`${testSet}/${x}`)
        || filter.includes(`${testSet}/`)
        || filter.includes(`${testSet}`)

    const results = referenceFiles.flatMap(ref => [
      ...referenceFiles.flatMap(subref => inFilter(`${subref}-${ref}`) ? [
        (subref === ref)
          ? runPairing(referencePath(ref), referencePath(ref), referencePath(ref))
          : runPairing(referencePath(ref), referencePath(subref), outputPath(`${subref}-${ref}`)),
      ] : []),
      ...subjectFiles.flatMap(sub => inFilter(`${sub}-${ref}`) ? [
        runPairing(referencePath(ref), subjectPath(sub), outputPath(`${sub}-${ref}`)),
      ] : []),
    ])

    return await Promise.all(results)
  }))

  async function runPairing(ref: string, sub: string, out: string){
    let state = ""
    try {
      state = `parsing ${chalk.bold(ref)}`
      const referenceNode = await parseFile(ref)

      state = `parsing ${chalk.bold(sub)}`
      const sourceNode = await parseFile(sub)

      state = `adapting ${chalk.bold(sub)} to ${chalk.bold(ref)}`
      const outputNode = sourceNode.adaptTo([], referenceNode.getAllNodes())

      state = `stringifying ${chalk.bold(out)}`
      const outputText = outputNode.toString()

      state = `reading ${chalk.bold(out)}`
      const expectedText = await file(out).catch(() => null)

      if(outputText === expectedText)
        return true

      const overrideUpdate = out === ref
      const updateOutput = update && !overrideUpdate

      if(updateOutput) {
        state = `Writing ${chalk.bold(out)}`
        await fs.writeFile(testPath(out), outputText)
      }

      if(expectedText !== null) {
        console.log((updateOutput ? chalk : chalk.redBright)(`Output changed in ${chalk.bold(out)}:`))
        state = `diffing ${chalk.bold(out)}`
        printDiff(expectedText, outputText)
        console.log()
      }

      if(expectedText === null)
        console.log((updateOutput ? chalk : chalk.redBright)(
          `${updateOutput ? "Created" : "Missing"} output file ${chalk.bold(out)}\n`,
        ))

      return updateOutput
    }
    catch (e) {
      console.log(chalk.redBright(`Error when ${state}:`))
      console.log(e)
      console.log()

      return false
    }
  }

  return results.flat()
}
