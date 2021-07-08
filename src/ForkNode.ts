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
    for(const option of this.allOptions)
      if(selection.maybeApply(sel => sel.applyMapped(x => x.children, sel => sel.applyNode(option))))
        return option
    return this.children[0]
  }

  override filter<Sel extends Selection<Node>>(selection: Sel): Sel & Selection<this>{
    this.chooseOption(super.filter(selection))
    return selection as Sel & Selection<this>
  }

  override adaptTo(reference: Reference, selection = reference.fullSelection.clone()): Node{
    let filteredSelection = super.filter(selection)
    if(!filteredSelection.size && !this.requireContext)
      filteredSelection = super.filter(reference.fullSelection.clone())
    const option = this.chooseOption(filteredSelection)
    const clone = this.clone()
    clone.children = [option.adaptTo(reference, filteredSelection.map(x => x.children))]
    clone.alternatives = this.allOptions.filter(x => x !== option)
    return clone
  }

}
