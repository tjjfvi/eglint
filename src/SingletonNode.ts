
import { Node } from "./Node"

export abstract class SingletonNode extends Node {

  constructor(child: Node){
    super([child])
  }

}
