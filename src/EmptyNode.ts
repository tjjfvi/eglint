import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class EmptyNode extends Node {

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof EmptyNode)
      return this
    return super._adaptTo(reference, node)
  }

}
