
import chalk from "chalk"
import runCrossproductTests from "./crossproduct"

;(async () => {
  const results = await runCrossproductTests()

  if(results.every(x => x)) {
    console.log(chalk.green(`${chalk.bold(results.length)} tests passed`))
    process.exit(0)
  }
  else {
    console.log(chalk.redBright(`${chalk.bold(results.filter(x => !x).length)} tests failed`))
    process.exit(1)
  }
})()
