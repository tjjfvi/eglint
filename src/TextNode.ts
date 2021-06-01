
import { Node } from "./Node"

export class TextNode extends Node {

  constructor(public text: string){
    super()
  }

  override toString(){
    return this.text
  }

  compareClass = TextNode
  $sameText = 1
  $differentText = 0

  override _similarityTo(node: Node): number{
    if(node instanceof this.compareClass)
      return this.text === node.text ? this.$sameText : this.$differentText
    return super._similarityTo(node)
  }

}
