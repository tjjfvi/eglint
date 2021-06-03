import { Node } from "./Node"
import { PositionalNode } from "./PositionalNode"
import { WhitespaceNode } from "./WhitespaceNode"

export class WhitespacePositionalNode extends PositionalNode {

  static override priority = -1

  constructor(node: WhitespaceNode){
    super(node)
  }

  override adaptTo(selectedReferenceNodes: readonly Node[]): Node{
    return this.filter(this.filterCompareClass(selectedReferenceNodes))[0] ?? this.cloneDeep()
  }

}
