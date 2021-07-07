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
    const optionsSelections = this.allOptions.map(option => {
      const filteredSelection = selection.fork()
      const filteredChildren = option.filter(filteredSelection.map(x => x.children)).apply()
      return {
        filteredSelection,
        filteredChildren,
        option,
        weight: filteredSelection.size || Infinity, // Lowest weight is best
      }
    })
    return optionsSelections.reduce(
      (a, b) => b.weight < a.weight ? b : a,
      {
        filteredSelection: selection.fork().clear(),
        filteredChildren: new Selection(),
        option: this.children[0],
        weight: Infinity,
      },
    )
  }

  override filter<Sel extends Selection<Node>>(selection: Sel): Sel & Selection<this>{
    return this.chooseOption(selection.applyClass(this.constructor)).filteredSelection.apply()
  }

  override select(reference: Reference, selection: Selection<Node>): Selection<this>{
    return this.chooseOption(super.select(reference, selection)).filteredSelection
  }

  override adaptTo(reference: Reference, selection: Selection<Node>): Node{
    const { option, filteredChildren } = this.chooseOption(super.select(reference, selection))
    const clone = this.clone()
    clone.children = [option.adaptTo(reference, filteredChildren)]
    clone.alternatives = this.allOptions.filter(x => x !== option)
    return clone
  }

}
