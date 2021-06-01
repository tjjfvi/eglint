
import { TextNode } from "./TextNode"

export class KeywordNode extends TextNode {

  compareClass = KeywordNode
  $sameText = 1
  $differentText = 0

}
