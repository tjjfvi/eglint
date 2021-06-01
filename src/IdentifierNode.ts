
import { TextNode } from "./TextNode"

export class IdentifierNode extends TextNode {

  compareClass = IdentifierNode
  $sameText = 1
  $differentText = .9

}
