
import "./NodeView.styl"
import React, { useState } from "react"
import { Node } from "../src"

export const NodeView = ({ node }: { node: Node }) => {
  const [open, setOpen] = useState(false)
  return <div className="NodeView">
    <div className="line">
      <div
        className={"arrow " + (node.children.length ? open ? "open" : "closed" : "leaf")}
        onClick={() => setOpen(!open)}
      />
      <span className="className">{node.constructor.name}</span>
      <span className="id">{"#" + node.id}</span>
      {node.hasText && <span className="text">{` ${JSON.stringify(node.toString())}`}</span>}
    </div>
    {open && <div className="children">
      {node.children.map((x, i) => <NodeView node={x} key={i}/>)}
    </div>}
  </div>
}
