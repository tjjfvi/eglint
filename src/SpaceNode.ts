
import { Node } from "./Node"

export class SpaceNode extends Node {

  constructor(public count: number){
    super()
  }

  toString(){
    return " ".repeat(this.count)
  }

  $sameCount = 1
  $differentCount = .5

  _similarityTo(node: Node): number{
    if(node instanceof SpaceNode)
      return this.count === node.count ? this.$sameCount : this.$differentCount
    return super._similarityTo(node)
  }

  _reconcileTo(node: Node): Node{
    if(node instanceof SpaceNode)
      return node
    return super._reconcileTo(node)
  }

}
