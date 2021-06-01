
import { TextNode } from "./TextNode"

export class PunctuationNode extends TextNode {

  override compareClass = PunctuationNode
  override $sameText = 1
  override $differentText = 0

}
