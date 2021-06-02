
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class SpaceNode extends Node {

  constructor(public count: number){
    super()
  }

  override toString(){
    return " ".repeat(this.count)
  }

  $sameCount = 1
  $differentCount = .5

  override _similarityTo(node: Node): number{
    if(node instanceof SpaceNode)
      return this.count === node.count ? this.$sameCount : this.$differentCount
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof SpaceNode)
      return node
    return super._adaptTo(reference, node)
  }

}
