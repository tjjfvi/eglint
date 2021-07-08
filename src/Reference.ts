import { Node } from "./Node"
import { ReadonlySelection } from "./Selection"

export class Reference {

  constructor(public rootNode: Node){}

  allNodes = this.rootNode.getAllNodes()
  fullSelection = new ReadonlySelection(this.allNodes)

}

