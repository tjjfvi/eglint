import { Node } from "./Node"
import { Reference } from "./Reference"
import { Selection } from "./Selection"
import { SingletonNode } from "./SingletonNode"

export abstract class ForkNode extends SingletonNode {

  alternatives: readonly Node[]
  allOptions: readonly Node[]

  constructor(current: Node, ...alternatives: readonly Node[]){
    super(current)
    this.alternatives = alternatives
    this.allOptions = [this.children[0], ...this.alternatives]
  }

  override get filterByChildren(){
    return false
  }

  private chooseOption<Sel extends Selection<this>>(selection: Sel){
    for(const option of this.allOptions) {
      const filteredChildren = selection.map(x => x.children).applyNode(option)
      if(filteredChildren.size) {
        filteredChildren.apply()
        return {
          selection,
          filteredChildren,
          option,
        }
      }
    }
    return {
      selection: selection.clear(),
      filteredChildren: new Selection(),
      option: this.children[0],
    }
  }

  override filter<Sel extends Selection<Node>>(selection: Sel): Sel & Selection<this>{
    return this.chooseOption(super.filter(selection)).selection
  }

  override adaptTo(reference: Reference, selection: Selection<Node>): Node{
    let filteredSelection = super.filter(selection)
    if(!filteredSelection.size && !this.requireContext)
      filteredSelection = super.filter(reference.fullSelection())
    const { option, filteredChildren } = this.chooseOption(filteredSelection)
    const clone = this.clone()
    clone.children = [option.adaptTo(reference, filteredChildren)]
    clone.alternatives = this.allOptions.filter(x => x !== option)
    return clone
  }

}
