import { Node } from "./Node"
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

  private chooseOption(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    const filteredNodes = super.select(selectedReferenceNodes, allReferenceNodes)
    const filteredChildren = filteredNodes.map(x => x.children[0])
    const optionsSelections = this.allOptions.map(option => {
      const selectedChildren = option.select(filteredChildren, [])
      const selectedNodes = [...new Set(selectedChildren.map(x => x.parent as this))]
      return {
        selectedChildren,
        selectedNodes,
        option,
        weight: selectedNodes.length || Infinity, // Lowest weight is best
      }
    })
    return optionsSelections.reduce(
      (a, b) => b.weight < a.weight ? b : a,
      { selectedChildren: [], selectedNodes: [], option: this.children[0], weight: Infinity },
    )
  }

  override select(
    selectedReferenceNodes: readonly Node[],
    allReferenceNodes: readonly Node[],
  ): readonly this[]{
    return this.chooseOption(selectedReferenceNodes, allReferenceNodes).selectedNodes
  }

  override adaptTo(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]): Node{
    const { option, selectedChildren } = this.chooseOption(selectedReferenceNodes, allReferenceNodes)
    const clone = this.clone()
    clone.children = [option.adaptTo(selectedChildren, allReferenceNodes)]
    clone.alternatives = this.allOptions.filter(x => x !== option)
    return clone
  }

}
