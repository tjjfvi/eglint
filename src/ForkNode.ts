
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class ForkNode<T extends Node = Node> extends Node {

  constructor(public current: T, public alternatives: T[]){
    super()
  }

  override getChildren(){
    return [this.current]
  }

  override _similarityTo(to: Node){
    return this.current.similarityTo(to)
  }

  override _adaptTo(reference: NodeCollection, node: Node){
    let best = this.current.adaptTo(reference, node)
    let bestWeight = best?.similarityTo(node)
    for(const node of this.alternatives) {
      const reconciled = node.adaptTo(reference, node)
      if(!reconciled) continue
      const reconciledWeight = reconciled.similarityTo(node)
      if(!bestWeight || reconciledWeight > bestWeight) {
        best = reconciled
        bestWeight = reconciledWeight
      }
    }
    return best
  }

}
