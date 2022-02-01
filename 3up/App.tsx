
import React, { useState } from "react"
import { Reference, SourceFileNode, Node } from "../src"
import ts from "typescript"
import { loader } from "@monaco-editor/react"
import { RootNodeView } from "./RootNodeView"

export const App = () => {
  Node["idN"] = 0
  const [referenceText, setReferenceText] = useState(defaultReferenceText)
  const [subjectText, setSubjectText] = useState(defaultSubjectText)
  const referenceNode = tryParse(referenceText)
  const subjectNode = tryParse(subjectText)
  const outputNode = tryValue(() =>
    referenceNode instanceof Error
      ? referenceNode
      : subjectNode instanceof Error
        ? subjectNode
        : subjectNode.adaptTo(new Reference(referenceNode)),
  )
  const outputText = tryValue(() =>
    outputNode instanceof Error
      ? outputNode
      : outputNode.toString().replace(/^\/\/ subject\n/, "// output\n"),
  )
  return <>
    <RootNodeView text={referenceText} onChange={setReferenceText} node={referenceNode}/>
    <RootNodeView text={subjectText} onChange={setSubjectText} node={subjectNode}/>
    <RootNodeView text={outputText} node={outputNode}/>
  </>
}

loader.init().then(monaco => monaco.editor.defineTheme("eglint", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#151820",
  },
}))

function tryParse(text: string): Node | Error{
  return tryValue(() => new SourceFileNode(ts.createSourceFile("", text, ts.ScriptTarget.ES2020, true)))
}

function tryValue<T, >(fn: () => T): T | Error{
  let result
  try {
    result = fn()
  }
  catch (e) {
    result = e as Error
  }
  return result
}

const defaultReferenceText = `
// reference

// This file is an example of a user-created definition of how
// code should be formatted. It is specified via examples of
// correctly-formatted code.

// You can edit the reference and subject files here.
// The eglint output updates live as you edit.

// You can view the CST (AST++) by clicking on the swap icons below.

// Note: some types of syntax may not be supported yet

const mixedArrayExample = [1, 2, "abc", '"', 5n + 6n, []]

const multilineArrayExample = [
  1,
  2,
  3,
  4,
]

const objectExample = {
  a: 1,
  b: 2,
  c: { d: "e", f: "g" },
  ...{ x },
}

const arrowFunctionExample = () => {
  return 123456789
}

;(1 + 2) * 3 // Example of ASI hazard requiring semicolon
`.trimStart()

const defaultSubjectText = `
// subject

// The subject file is an example of unformatted, user-created code.
// The resulting output file (shown in the third pane) is the
// eglint output: the subject formatted to the reference.

// You can edit the reference and subject files here.
// The eglint output updates live as you edit.

// You can view the CST (AST++) by clicking on the swap icons below.

// Note: some types of syntax may not be supported yet

let
foo
  = {
      a: 1,
...{x:{x:{x:5,}}},   b:"c"}

const bar =

[
  "abc"
  , 1+
  2,
      [[[ [  ] ]]
      ] ] ;


(async ()=> { await foo
}
)()
`.trimStart()
