
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class TextNode extends Node {

  constructor(public text: string){
    super()
  }

  override toString(){
    return this.text
  }

  compareClass = TextNode
  $sameText = 1
  $differentText = -1

  override _similarityTo(node: Node): number{
    if(node instanceof this.compareClass)
      return this.text === node.text ? this.$sameText : this.$differentText
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof TextNode && this.text === node.text)
      return this
    return super._adaptTo(reference, node)
  }

}
