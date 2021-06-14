import { Node } from "./Node"
import { SingletonNode } from "./SingletonNode"

export class ForkNode extends SingletonNode {

  allOptions: readonly Node[] = [this.children[0], ...this.alternatives]

  constructor(current: Node, public alternatives: readonly Node[]){
    super(current)
  }

  private chooseOption(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    let filteredNodes = this.filterCompareClass(selectedReferenceNodes)
    if(!filteredNodes.length) filteredNodes = this.filterCompareClass(allReferenceNodes)
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
    return new ForkNode(option.adaptTo(selectedChildren, allReferenceNodes), this.allOptions.filter(x => x !== option))
  }

}
