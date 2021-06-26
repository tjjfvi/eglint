import { InterchangeableNode } from "./InterchangeableNode"

export class SpaceNode extends InterchangeableNode {

  constructor(public count: number){
    super()
  }

  override toString(){
    return " ".repeat(this.count)
  }

  override get hasText(){
    return !!this.count
  }

}
