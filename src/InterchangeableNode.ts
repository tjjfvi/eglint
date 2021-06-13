
import { Node } from "./Node"

export class InterchangeableNode extends Node {

  override priority = -1

  override adaptTo(selectedReferenceNodes: readonly Node[]): Node{
    return this.filterCompareClass(selectedReferenceNodes)[0] ?? this
  }

}
