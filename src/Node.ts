
import { ContextProvider } from "./Context"

export abstract class Node {

  toString(context: ContextProvider): string{
    let acc = ""
    for(const child of this.getChildren())
      acc += child.toString(context)
    return acc
  }

  getChildren(): Iterable<Node>{
    return []
  }

  #similarityMemo = new WeakMap<Node, number>()
  similarityTo(node: Node): number{
    const existing = this.#similarityMemo.get(node)
    if(existing !== undefined) return existing
    const existingReverse = node.#similarityMemo.get(node)
    if(existingReverse !== undefined) return existingReverse
    let similarity = this._similarityTo(node)
    if(isNaN(similarity)) similarity = node._similarityTo(this)
    this.#similarityMemo.set(node, similarity)
    return similarity
  }

  protected _similarityTo(node: Node): number{
    node
    return NaN
  }

  #adaptMemo = new WeakMap<Node, Node>()
  adaptTo(referenceNode: Node): Node{
    const existing = this.#adaptMemo.get(referenceNode)
    if(existing !== undefined) return existing
    const reconciled = this._adaptTo(referenceNode)
    this.#adaptMemo.set(referenceNode, reconciled)
    return reconciled
  }

  protected _adaptTo(referenceNode: Node): Node{
    referenceNode
    return referenceNode._applyTo(this)
  }

  protected _applyTo(sourceNode: Node): Node{
    sourceNode
    return this
  }

}
