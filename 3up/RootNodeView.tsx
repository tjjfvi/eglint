
import "./RootNodeView.styl"
import { Node } from "../src"
import Editor from "@monaco-editor/react"
import { useRef, useState } from "react"
import React from "react"
import { Icon } from "@mdi/react"
import { mdiSwapHorizontal } from "@mdi/js"
import { NodeView } from "./NodeView"
import { editor } from "monaco-editor"
import { ErrorView } from "./ErrorView"

export interface RootNodeViewProps {
  text: string | Error,
  node: Node | Error,
  onChange?: (text: string) => void,
}

export const RootNodeView = ({ text, node, onChange }: RootNodeViewProps) => {
  const [isAstView, setIsAstView] = useState(false)
  const editor = useRef<editor.IStandaloneCodeEditor>()
  if(typeof text === "string" && editor.current?.getValue() !== text)
    editor.current?.setValue(text)
  return <div className="RootNodeView">
    {isAstView
      ? node instanceof Error
        ? <ErrorView error={node}/>
        : <NodeView node={node}/>
      : text instanceof Error
        ? <ErrorView error={text}/>
        : <Editor
          defaultLanguage="typescript"
          defaultValue={text}
          onChange={x => onChange?.(x ?? "")}
          theme="eglint"
          options={{
            automaticLayout: true,
            minimap: {
              enabled: false,
            },
            readOnly: !onChange,
          }}
          onMount={x => editor.current = x}
        />
    }
    <div className="swap" onClick={() => setIsAstView(!isAstView)}>
      <Icon path={mdiSwapHorizontal}/>
    </div>
  </div>
}
