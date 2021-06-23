
import chalk from "chalk"
import type { default as _runCrossProductTests, TestStatus } from "./crossproduct"
import yargs from "yargs"
import watchDir from "node-watch"
import path from "path"

const { join, relative } = path.posix

const baseRequireCache = new Set(Object.keys(require.cache))

;(async () => {
  const options = await yargs(process.argv.slice(2))
    .option("update", { type: "boolean", default: false })
    .option("watch", { type: "boolean", default: false })
    .alias("u", "update")
    .alias("w", "watch")
    .help("h")
    .alias("h", "help")
    .argv

  if(options.watch) watch()
  else run()

  async function run(){
    for(const key in require.cache)
      if(!baseRequireCache.has(key))
        delete require.cache[key]
    let runCrossProductTests
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      runCrossProductTests = require("./crossproduct").default as typeof _runCrossProductTests
    }
    catch (e) {
      console.error(e)
      return null
    }
    const results = await runCrossProductTests(options.update, options._.map(x => x.toString()))

    const colors: Record<TestStatus, chalk.ChalkFunction> = {
      passed: chalk.green,
      updated: chalk.blueBright,
      failed: chalk.redBright,
      missing: chalk.yellow,
      skipped: chalk.dim,
      errored: chalk.redBright,
    }

    const counts = Object.keys(colors).map(s => results.filter(x => x.status === s).length)
    const padLength = Math.max(...counts).toString().length

    for(const [i, [status, color]] of Object.entries(colors).entries()) {
      const count = counts[i]
      if(count)
        console.log(color(`${chalk.bold(count.toString().padStart(padLength))} tests ${status}`))
    }

    if(!options.watch)
      process.exit(results.every(x => x.status === "passed") ? 0 : 1)

    return results
  }

  function watch(){
    let running = false
    let rerunWhenDone = false
    cb()
    const dir = join(__dirname, "../..")
    watchDir(dir, {
      recursive: true,
      filter: path => {
        const relativePath = relative(dir, path)
        return !relativePath.includes("/.") && !relativePath.includes("/out/")
      },
    }, cb)

    async function cb(){
      if(running)
        return rerunWhenDone = true
      running = true
      do {
        rerunWhenDone = false
        process.stdout.write("\u001b[3J\u001b[1J")
        console.clear()
        await run()
      } while(rerunWhenDone)
      running = false
    }
  }
})()
