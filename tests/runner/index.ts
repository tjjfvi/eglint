
import chalk from "chalk"
import runCrossproductTests from "./crossproduct"
import yargs from "yargs"

;(async () => {
  const options = await yargs(process.argv.slice(2))
    .option("update", { type: "boolean", default: false })
    .alias("u", "update")
    .help("h")
    .alias("h", "help")
    .argv

  const results = await runCrossproductTests(options.update, options._.map(x => x.toString()))

  if(results.every(x => x)) {
    console.log(chalk.green(`${chalk.bold(results.length)} tests passed`))
    process.exit(0)
  }
  else {
    console.log(chalk.redBright(`${chalk.bold(results.filter(x => !x).length)} tests failed`))
    process.exit(1)
  }
})()
