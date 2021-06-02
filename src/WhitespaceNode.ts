
import { Node } from "./Node"
import { GroupNode } from "./GroupNode"
import { NodeCollection } from "./NodeCollection"

export class WhitespaceNode extends GroupNode {

  $minSimilarity = .7

  override _similarityTo(node: Node): number{
    if(node instanceof WhitespaceNode)
      return Math.max(super._similarityTo(node), this.$minSimilarity)
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof WhitespaceNode)
      return node
    return super._adaptTo(reference, node)
  }

}
