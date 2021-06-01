
import { Node } from "./Node"

export class IdentifierNode extends Node {

  constructor(public text: string){
    super()
  }

  toString(){
    return this.text
  }

  $sameText = 1
  $differentText = .9

  _similarityTo(node: Node): number{
    if(node instanceof IdentifierNode)
      return node.text === this.text ? this.$sameText : this.$differentText
    return super._similarityTo(node)
  }

  _reconcileTo(node: Node): Node{
    if(node instanceof IdentifierNode)
      return this
    return super._reconcileTo(node)
  }

}
