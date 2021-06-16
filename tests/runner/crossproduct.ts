
import fs from "fs/promises"
import { join as joinPath } from "path"
import ts from "typescript"
import { parseTsSourceFile } from "../../src"
import chalk from "chalk"
import { printDiff } from "./diff"

const path = (relativePath: string) =>
  joinPath(__dirname, "../crossproduct", relativePath)

const args = { update: process.argv[2] === "--update" }

const file = (relativePath: string) =>
  fs.readFile(path(relativePath), "utf8")

export default async () => {
  const referenceFiles = await fs.readdir(path("references/"))
  const sourceFiles = await fs.readdir(path("sources/"))

  const results = await Promise.all(referenceFiles.flatMap(ref => [
    ...referenceFiles.map(src =>
      runPairing(`references/${ref}`, `references/${src}`, `outputs/${ref}-${src}`),
    ),
    ...sourceFiles.map(src =>
      runPairing(`references/${ref}`, `sources/${src}`, `outputs/${ref}-${src}`),
    ),
  ]))

  return results
}

async function runPairing(ref: string, src: string, out: string){
  let state = ""
  try {
    state = `reading ${chalk.bold(ref)} and ${chalk.bold(src)}`
    const [referenceText, sourceText] = await Promise.all([file(ref), file(src)])

    state = `parsing ${chalk.bold(ref)}`
    const referenceTsNode = ts.createSourceFile("reference", referenceText, ts.ScriptTarget.ES2020, true)
    const referenceNode = parseTsSourceFile(referenceTsNode)

    state = `parsing ${chalk.bold(src)}`
    const sourceTsNode = ts.createSourceFile("reference", sourceText, ts.ScriptTarget.ES2020, true)
    const sourceNode = parseTsSourceFile(sourceTsNode)

    state = `adapting ${chalk.bold(src)} to ${chalk.bold(ref)}`
    const outputNode = sourceNode.adaptTo([], referenceNode.getAllNodes())

    state = `stringifying ${chalk.bold(out)}`
    const outputText = outputNode.toString()

    state = `reading ${chalk.bold(out)}`
    const expectedText = await file(out).catch(() => null)

    if(outputText === expectedText)
      return true

    if(args.update) {
      state = `Writing ${chalk.bold(out)}`
      await fs.writeFile(path(out), outputText)
    }

    if(expectedText !== null) {
      console.log((args.update ? chalk : chalk.redBright)(`Output changed in ${chalk.bold(out)}:`))
      state = `diffing ${chalk.bold(out)}`
      printDiff(expectedText, outputText)
      console.log()
    }

    if(expectedText === null)
      console.log((args.update ? chalk : chalk.redBright)(
        `${args.update ? "Created" : "Missing"} output file ${chalk.bold(out)}\n`,
      ))

    return args.update
  }
  catch (e) {
    console.log(chalk.redBright(`Error when ${state}:`))
    console.log(e)
    console.log()

    return false
  }
}
