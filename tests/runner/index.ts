
import chalk from "chalk"
import runAll from "./runAll"
import yargs from "yargs"
import type { TestStatus } from "./types"

;(async () => {
  const options = await yargs(process.argv.slice(2))
    .option("update", { type: "boolean", default: false })
    .alias("u", "update")
    .help("h")
    .alias("h", "help")
    .argv

  const results = await runAll(options.update, options._.map(x => x.toString()))

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
})()
