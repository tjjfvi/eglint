
import { TextNode } from "./TextNode"

export class IdentifierNode extends TextNode {

  override compareClass = IdentifierNode
  override $sameText = 1
  override $differentText = .9

}
