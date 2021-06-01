
import { Node } from "./Node"

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

  override _adaptTo(to: Node){
    let best = this.current.adaptTo(to)
    let bestWeight = best.similarityTo(to)
    for(const node of this.alternatives) {
      let reconciled = node.adaptTo(to)
      let reconciledWeight = reconciled.similarityTo(to)
      if(reconciledWeight > bestWeight) {
        best = reconciled
        bestWeight = reconciledWeight
      }
    }
    return best
  }

  override _applyTo(from: Node){
    return from.adaptTo(this.current)
  }

}
