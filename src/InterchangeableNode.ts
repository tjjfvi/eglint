
import { Node } from "./Node"

export class InterchangeableNode extends Node {

  override priority = -1

  override _adaptTo(node: Node | null): Node{
    return node ?? this
  }

  override requireContext = true

}
