
import chalk from "chalk"
import runCrossproductTests from "./crossproduct"
import yargs from "yargs"
import watchDir from "node-watch"
import path from "path"

const { join, relative } = path.posix

;(async () => {
  const options = await yargs(process.argv.slice(2))
    .option("update", { type: "boolean", default: false })
    .option("watch", { type: "boolean", default: false })
    .alias("u", "update")
    .alias("w", "watch")
    .help("h")
    .alias("h", "help")
    .argv

  if(options.watch)
    watch()
  else
    process.exit(await run())

  async function run(){
    const results = await runCrossproductTests(options.update, options._.map(x => x.toString()))

    if(results.every(x => x)) {
      console.log(chalk.green(`${chalk.bold(results.length)} tests passed`))
      return 0
    }
    else {
      console.log(chalk.redBright(`${chalk.bold(results.filter(x => !x).length)} tests failed`))
      return 1
    }
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
