
import { Node } from "./Node"

export class SingletonNode extends Node {

  constructor(child: Node){
    super([child])
  }

}
