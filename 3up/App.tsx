
import React, { useState, useRef } from "react"
import { Reference, SourceFileNode } from "../src"
import ts from "typescript"

import Editor from "@monaco-editor/react"
import { editor } from "monaco-editor"

export const App = () => {
  const [referenceText, setReferenceText] = useState('// reference\n\nconsole.log("Hello, world!")\n')
  const [subjectText, setSubjectText] = useState('// subject\n\nconsole.log("Hello, world!")\n')
  let outputText: string
  try {
    const referenceNode = new SourceFileNode(ts.createSourceFile("ref", referenceText, ts.ScriptTarget.ES2020, true))
    const subjectNode = new SourceFileNode(ts.createSourceFile("ref", subjectText, ts.ScriptTarget.ES2020, true))
    const outputNode = subjectNode.adaptTo(new Reference(referenceNode))
    outputText = outputNode.toString().replace(/^\/\/ subject\n/, "// output\n")
  }
  catch (e) {
    outputText = e.toString()
  }
  const editor = useRef<editor.IStandaloneCodeEditor>()
  editor.current?.setValue(outputText)
  console.log("hi")
  return <>
    <Editor
      defaultLanguage="typescript"
      defaultValue={referenceText}
      onChange={x => setReferenceText(x ?? "")}
      theme="vs-dark"
    />
    <Editor
      defaultLanguage="typescript"
      defaultValue={subjectText}
      onChange={x => setSubjectText(x ?? "")}
      theme="vs-dark"
    />
    <Editor
      defaultLanguage="typescript"
      defaultValue={outputText}
      theme="vs-dark"
      options={{
        readOnly: true,
      }}
      onMount={x => editor.current = x}
    />
  </>
}
