
import typescript from "@rollup/plugin-typescript"
import serve from "rollup-plugin-serve"
import nodeResolve from "@rollup/plugin-node-resolve"
import nodePolyfills from "rollup-plugin-node-polyfills"
import commonjs from "@rollup/plugin-commonjs"
import replace from "@rollup/plugin-replace"
import livereload from "rollup-plugin-livereload"
import styles from "rollup-plugin-styles"

export default {
  input: "3up/index.tsx",
  external: ["perf_hooks", "inspector"],
  output: {
    dir: "3up/dist",
    format: "iife",
    sourcemap: true,
    globals: {
      perf_hooks: "undefined",
      inspector: "undefined",
    },
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
      preventAssignment: true,
    }),
    typescript({
      tsconfig: "3up.tsconfig.json",
    }),
    commonjs({
      include: /node_modules/,
    }),
    nodePolyfills(),
    nodeResolve(),
    serve({
      contentBase: ["3up/dist", "3up"],
      port: process.env.PORT || 3838, // parseInt("3up", 31)
    }),
    livereload({ watch: "3up/dist" }),
    styles(),
  ],
}
