
import { TextNode } from "./TextNode"

export class KeywordNode extends TextNode {

  override compareClass = KeywordNode
  override $sameText = 1
  override $differentText = -1

}
