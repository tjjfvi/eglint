
import fs from "fs/promises"
import { join as joinPath } from "path"
import ts from "typescript"
import { cacheFn, Node, SourceFileNode } from "../../src"
import chalk from "chalk"
import { createRichDiff } from "./diff"
import { TestResult } from "./types"
import { Reference } from "../../src/Reference"
import { runFn } from "./runFn"

const testPath = (relativePath = "") =>
  joinPath(process.cwd(), "tests/crossproduct", relativePath)

const file = (relativePath: string) =>
  fs.readFile(testPath(relativePath), "utf8")

export default async (update: boolean, filterRaw: string[]) => {
  const filter = filterRaw.map(s => (
    s
      .replace(/^tests\/crossproduct\//, "")
      .replace("/ref/", "/")
      .replace("/sub/", "/")
      .replace("/out/", "/")
      .replace(/\.ts$/, "")
  ))

  const testSets = await fs.readdir(testPath())

  return (await Promise.all(testSets.map(testSet =>
    runFn<typeof runTestSet>(__filename, "runTestSet", testSet, filter, update),
  ))).flat()

}

function stripTsExtension(s: string){
  return s.replace(/\.ts$/, "")
}

export async function runTestSet(testSet: string, filter: string[], update: boolean): Promise<TestResult[]>{
  const parseFile = cacheFn<string, Promise<Node>>(async (path: string) => {
    const text = await file(path)
    const sourceFile = ts.createSourceFile("ref", text, ts.ScriptTarget.ES2020, true)
    const node = new SourceFileNode(sourceFile)
    return node
  }, new Map())

  const refDir = joinPath(testSet, "ref")
  const subDir = joinPath(testSet, "sub")
  const outDir = joinPath(testSet, "out")

  const refNames = await fs.readdir(testPath(refDir))
  const subNames = await fs.readdir(testPath(subDir))

  const getRefPath = (f: string) => joinPath(refDir, f)
  const getSubPath = (f: string) => joinPath(subDir, f)

  const subFileResults = (await Promise.all(subNames.map(x => checkSubFile(x))))
    .filter(<T>(x: T | null): x is T => x !== null)

  if(subFileResults.some(x => x.status === "failed"))
    return [
      ...subFileResults,
      ...Array.from(
        { length: refNames.length * (subNames.length + 1) },
        (): TestResult => ({ status: "skipped" }),
      ),
    ]

  const results = []
  for(const refName of refNames) {
    results.push(runTest(refName, refName))
    for(const subName of subNames)
      if(subName !== refName)
        results.push(runTest(refName, subName))
  }

  return [...subFileResults, ...(await Promise.all(results)).flat()]

  async function checkSubFile(subName: string): Promise<TestResult | null>{
    const subNameBase = stripTsExtension(subName)
    if(subNameBase !== "all" && !refNames.includes(subName))
      return null
    if(filter.length && !(filter.includes(testSet) || filter.includes(`${testSet}/${subNameBase}`)))
      return { status: "skipped" }
    const contents = subNameBase === "all"
      ? (await Promise.all(refNames.map(x => file(getRefPath(x))))).join("\n")
      : await file(getRefPath(subName))
    const existing = await file(getSubPath(subName))
    if(contents === existing) return { status: "passed" }
    console.log((update ? chalk.blueBright : chalk.redBright)(
      `Subject ${getSubPath(subName)} changed:`,
    ))
    console.log(createRichDiff(existing, contents))
    if(update)
      await fs.writeFile(testPath(getSubPath(subName)), contents)

    return { status: update ? "updated" : "failed" }
  }

  async function runTest(refName: string, subName: string): Promise<TestResult>{
    const refPath = getRefPath(refName)
    const subPath = (subNames.includes(subName) ? getSubPath : getRefPath)(subName)
    const subNameBase = stripTsExtension(subName)
    const refNameBase = stripTsExtension(refName)
    const refOutDir = joinPath(outDir, refNameBase)

    if(update)
      await fs.mkdir(testPath(refOutDir), { recursive: true })

    const outPath = refName === subName
      ? refPath
      : joinPath(refOutDir, `${subNameBase}.ts`)
    const id = refName === subName ? `${testSet}/${refNameBase}` : `${testSet}/${refNameBase}/${subNameBase}`

    if(filter.length && !(filter.includes(id) || filter.includes(testSet)))
      return { status: "skipped" }

    let state = ""
    try {
      state = `parsing ${chalk.bold(refPath)}`
      const refNode = await parseFile(refPath)

      state = `parsing ${chalk.bold(subPath)}`
      const subNode = await parseFile(subPath)

      state = `adapting ${chalk.bold(subPath)} to ${chalk.bold(refPath)}`
      const outNode = subNode.adaptTo(new Reference(refNode))

      state = `stringifying ${chalk.bold(outPath)}`
      const outText = outNode.toString()

      state = `reading ${chalk.bold(outPath)}`
      const expectedText = await file(outPath).catch(() => null)

      if(outText === expectedText)
        return { status: "passed" }

      const overrideUpdate = outPath === refPath
      const updateOutput = update && !overrideUpdate

      if(expectedText !== null) {
        console.log((updateOutput ? chalk : chalk.redBright)(`Output ${chalk.bold(outPath)} changed:`))
        state = `diffing ${chalk.bold(outPath)}`
        console.log(createRichDiff(expectedText, outText))
        if(!updateOutput)
          return { status: "failed" }
      }
      else {
        console.log((updateOutput ? chalk : chalk.redBright)(
          `${updateOutput ? "Created" : "Missing"} output file ${chalk.bold(outPath)}`,
        ))
        console.log(createRichDiff("", outText))
        if(!updateOutput)
          return { status: "missing" }
      }

      state = `Writing ${chalk.bold(outPath)}`
      await fs.writeFile(testPath(outPath), outText)
      return { status: "updated" }
    }
    catch (e) {
      console.log(chalk.redBright(`Error when ${state}:`))
      console.log(e)
      console.log()

      return { status: "errored" }
    }
  }
}
