
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"
import { TextNode } from "./TextNode"

export class IdentifierNode extends TextNode {

  override compareClass = IdentifierNode
  override $sameText = 1
  override $differentText = .9

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof IdentifierNode)
      return this
    return super._adaptTo(reference, node)
  }

}
