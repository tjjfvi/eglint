
import React, { useState } from "react"
import { Reference, SourceFileNode, Node } from "../src"
import ts from "typescript"
import { loader } from "@monaco-editor/react"
import { RootNodeView } from "./RootNodeView"

export const App = () => {
  Node["idN"] = 0
  const [referenceText, setReferenceText] = useState('// reference\n\nconsole.log("Hello, world!")\n')
  const [subjectText, setSubjectText] = useState('// subject\n\nconsole.log("Hello, world!")\n')
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
