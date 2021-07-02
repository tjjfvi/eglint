import { Node } from "./Node"
import { Selection } from "./Selection"

export class Reference {

  allNodes = this.rootNode.getAllNodes()

  constructor(public rootNode: Node){}

  fullSelection(){
    return new Selection(new Set(this.allNodes))
  }

}

