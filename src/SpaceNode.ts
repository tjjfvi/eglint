import { WhitespaceNode } from "./WhitespaceNode"

export class SpaceNode extends WhitespaceNode {

  constructor(public count: number){
    super()
  }

  override toString(){
    return " ".repeat(this.count)
  }

}
