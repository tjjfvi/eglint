
import { Node } from "./Node"

export class WhitespaceNode extends Node {

  override _adaptTo(reference: this){
    return reference
  }

}
