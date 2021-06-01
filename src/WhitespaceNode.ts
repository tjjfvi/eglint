
import { Node } from "./Node"
import { GroupNode } from "./GroupNode"

export class WhitespaceNode extends GroupNode {

  override _adaptTo(node: Node): Node{
    if(node instanceof WhitespaceNode)
      return node
    return super._adaptTo(node)
  }

}
