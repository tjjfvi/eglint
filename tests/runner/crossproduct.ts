
import fs from "fs/promises"
import { join as joinPath } from "path"
import ts from "typescript"
import { cacheFn, Node, SourceFileNode } from "../../src"
import chalk from "chalk"
import { createRichDiff } from "./diff"

const testPath = (relativePath = "") =>
  joinPath(__dirname, "../crossproduct", relativePath)

const file = (relativePath: string) =>
  fs.readFile(testPath(relativePath), "utf8")

export type TestStatus = TestResult["status"]
export type TestResult =
  & { id: string }
  & (
    | { status: "passed" | "updated" | "skipped" | "errored" }
    | { status: "failed" | "missing", diff: string }
  )

export default async (update: boolean, filterRaw: string[]) => {
  const filter = filterRaw.map(s => s.replace(/^tests\/crossproduct\//, "").replace("/out/", "/"))

  const testSets = await fs.readdir(testPath())

  const parseFile = cacheFn<string, Promise<Node>>(async (path: string) => {
    const text = await file(path)
    const sourceFile = ts.createSourceFile("ref", text, ts.ScriptTarget.ES2020, true)
    const node = new SourceFileNode(sourceFile)
    return node
  }, new Map())

  const results: Promise<TestResult[]>[] = []

  for(const testSet of testSets)
    results.push(runTestSet(testSet))

  return (await Promise.all(results)).flat()

  async function runTestSet(testSet: string){
    const results = []

    const refDir = joinPath(testSet, "ref")
    const subDir = joinPath(testSet, "sub")
    const outDir = joinPath(testSet, "out")

    const refNames = await fs.readdir(testPath(refDir))
    const subNames = await fs.readdir(testPath(subDir))

    const getRefPath = (f: string) => joinPath(refDir, f)
    const getSubPath = (f: string) => joinPath(subDir, f)

    const duplicateFilenames = refNames.filter(f => subNames.includes(f))

    if(duplicateFilenames.length)
      throw new Error(`duplicate file names: ${duplicateFilenames.join(", ")}`)

    for(const refName of refNames) {
      results.push(runTest(refName, refName))
      for(const subName of subNames)
        results.push(runTest(refName, subName))
      // for(const subRefName of refNames)
      //   results.push(runTest(refName, subRefName))
    }

    return (await Promise.all(results)).flat()

    async function runTest(refName: string, subName: string): Promise<TestResult>{
      const refPath = getRefPath(refName)
      const subPath = (refNames.includes(subName) ? getRefPath : getSubPath)(subName)
      const subNameBase = stripTsExtension(subName)
      const refNameBase = stripTsExtension(refName)
      const refOutDir = joinPath(outDir, refNameBase)

      if(update)
        await fs.mkdir(testPath(refOutDir), { recursive: true })

      const outPath = refName === subName
        ? refPath
        : joinPath(refOutDir, `${subNameBase}.ts`)
      const id = `${testSet}/${refNameBase}/${subNameBase}`

      if(filter.length && !(filter.includes(id) || filter.includes(testSet)))
        return { id, status: "skipped" }

      let state = ""
      try {
        state = `parsing ${chalk.bold(refPath)}`
        const refNode = await parseFile(refPath)

        state = `parsing ${chalk.bold(subPath)}`
        const subNode = await parseFile(subPath)

        state = `adapting ${chalk.bold(subPath)} to ${chalk.bold(refPath)}`
        const outNode = subNode.adaptTo([], refNode.getAllNodes())

        state = `stringifying ${chalk.bold(outPath)}`
        const outText = outNode.toString()

        state = `reading ${chalk.bold(outPath)}`
        const expectedText = await file(outPath).catch(() => null)

        if(outText === expectedText)
          return { id, status: "passed" }

        const overrideUpdate = outPath === refPath
        const updateOutput = update && !overrideUpdate

        if(expectedText !== null) {
          console.log((updateOutput ? chalk : chalk.redBright)(`Output changed in ${chalk.bold(outPath)}:`))
          state = `diffing ${chalk.bold(outPath)}`
          const diff = createRichDiff(expectedText, outText)
          console.log(diff)
          if(!updateOutput)
            return { id, status: "failed", diff }
        }
        else {
          console.log((updateOutput ? chalk : chalk.redBright)(
            `${updateOutput ? "Created" : "Missing"} output file ${chalk.bold(outPath)}`,
          ))
          const diff = createRichDiff("", outText)
          console.log(diff)
          if(!updateOutput)
            return { id, status: "missing", diff }
        }

        state = `Writing ${chalk.bold(outPath)}`
        await fs.writeFile(testPath(outPath), outText)
        return { id, status: "updated" }
      }
      catch (e) {
        console.log(chalk.redBright(`Error when ${state}:`))
        console.log(e)
        console.log()

        return { id, status: "errored" }
      }
    }
  }
}

function stripTsExtension(s: string){
  return s.replace(/\.ts$/, "")
}
