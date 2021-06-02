
import { ContextProvider } from "./Context"
import { NodeCollection } from "./NodeCollection"

export abstract class Node {

  metadata?: unknown

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
    if(isNaN(similarity)) similarity = -1
    this.#similarityMemo.set(node, similarity)
    return similarity
  }

  protected _similarityTo(node: Node): number{
    node
    return NaN
  }

  static readonly adaptThreshold = 0

  adaptTo(reference: NodeCollection, startNode: Node): Node | null{
    return this._adaptTo(reference, startNode) ?? this.adaptToMultiple(reference, reference)
  }

  adaptToMultiple(reference: NodeCollection, nodes: NodeCollection): Node | null{
    let best = null
    let bestWeight = 0
    for(const node of nodes.findSimilarNodes(this)) {
      const reconciled = this._adaptTo(reference, node)
      if(!reconciled) continue
      const reconciledWeight = reconciled.similarityTo(node)
      if(!bestWeight || reconciledWeight > bestWeight) {
        best = reconciled
        bestWeight = reconciledWeight
      }
    }
    return best
    // for(const node of nodes.findSimilarNodes(this)) {
    //   const similarity = this.similarityTo(node)
    //   if(similarity <= Node.adaptThreshold) break
    //   const adapted = this._adaptTo(reference, node)
    //   if(adapted) return adapted
    // }
    // return null
  }

  protected _adaptTo(reference: NodeCollection, node: Node): Node | null{
    node
    reference
    return null
  }

}
