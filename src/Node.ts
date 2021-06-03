
import { ContextProvider } from "./Context"
import { Criterion } from "./Criterion"

export interface NodeConstructorArgs {
  text?: string | ((context: ContextProvider) => string),
  children?: readonly Node[],
  criteria?: readonly Criterion[],
}

export class Node {

  // may be overriden by constructor
  toString(context: ContextProvider): string{
    let acc = ""
    for(const child of this.children)
      acc += child.toString(context)
    return acc
  }

  criteria: readonly Criterion[]
  children: readonly Node[]

  constructor({ text, children, criteria }: NodeConstructorArgs = {}){
    this.children = children ?? []
    this.criteria = criteria ?? []
    for(const criterion of this.criteria)
      criterion.apply(this)
    if(text !== undefined)
      if(typeof text === "string")
        this.toString = () => text
      else
        this.toString = text
  }

  getAllNodes(array: Node[] = []): readonly Node[]{
    array.push(this)
    for(const child of this.children)
      child.getAllNodes(array)
    return array
  }

  adaptTo(referenceNodes: readonly Node[]){
    let nodes = referenceNodes
    let adapter = defaultAdapter
    for(const criterion of this.criteria) {
      const narrowed = criterion.select(this, nodes)
      if(narrowed.length === 0)
        continue // Skip this criterion
      nodes = narrowed
      adapter = criterion.adapter ?? adapter
      if(narrowed.length === 1)
        break // No need to narrow further
    }
    const [selectedNode] = nodes
    const adapted = adapter(this, selectedNode, referenceNodes)
    return adapted
  }

}

export type Adapter = typeof defaultAdapter
function defaultAdapter(source: Node, selectedReferenceNode: Node, referenceNodes: readonly Node[]): Node{
  selectedReferenceNode
  return new Node({
    text: source.toString,
    children: source.children.map(child => child.adaptTo(referenceNodes)),
    criteria: source.criteria,
  })
}
