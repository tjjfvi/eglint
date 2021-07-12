
import typescript from "@rollup/plugin-typescript"
import serve from "rollup-plugin-serve"
import nodeResolve from "@rollup/plugin-node-resolve"
import nodePolyfills from "rollup-plugin-node-polyfills"
import commonjs from "@rollup/plugin-commonjs"
import replace from "@rollup/plugin-replace"
import livereload from "rollup-plugin-livereload"
import styles from "rollup-plugin-styles"
import { terser } from "rollup-plugin-terser"

const dev = process.env.NODE_ENV === "development"

export default {
  input: "3up/index.tsx",
  external: ["perf_hooks", "inspector"],
  output: {
    dir: "3up/dist",
    format: "iife",
    sourcemap: dev,
    globals: {
      perf_hooks: "undefined",
      inspector: "undefined",
    },
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
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
    ...dev ? [
      serve({
        contentBase: ["3up"],
        port: process.env.PORT || 3838, // parseInt("3up", 31)
      }),
      livereload({ watch: "3up/dist" }),
    ] : [],
    styles(),
    ...!dev ? [
      terser(),
    ] : [],
  ],
}
