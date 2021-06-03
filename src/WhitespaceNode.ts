
import { Node } from "./Node"

export class WhitespaceNode extends Node {

  static override priority = -1

  override _adaptTo(reference: this){
    return reference
  }

}
