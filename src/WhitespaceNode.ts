
import { Node } from "./Node"

export class WhitespaceNode extends Node {

  static override priority = -1

  override adaptTo(selectedReferenceNodes: readonly Node[]): Node{
    return this.filterCompareClass(selectedReferenceNodes)[0] ?? this.cloneDeep()
  }

}
