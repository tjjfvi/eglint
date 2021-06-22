import { FilterGroup } from "./FilterGroup"
import { Node } from "./Node"

export abstract class RelativePositionalNode extends Node {

  positionalFilter = this.filterGroup.addFilter(new FilterGroup({
    mode: "and",
    required: "weak",
    priority: 1,
    filters: [
      { required: "weak", filter: siblingExistenceMatches(-1) },
      { required: "weak", filter: siblingExistenceMatches(+1) },
      { filter: compareSiblings(-1) },
      { filter: compareSiblings(+1) },
    ],
  }))

  override get requireContext(){
    return true
  }

}

function getSibling(node: Node, offset: number): Node | undefined{
  return node.parent?.children[node.index + offset]
}

const siblingExistenceMatches = (offset: 1 | -1) =>
  <T extends Node>(value: Node, nodes: readonly T[]): readonly T[] => {
    const sibling = getSibling(value, offset)
    return nodes.filter(x => !!getSibling(x, offset) === !!sibling)
  }

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const compareSiblings = (offset: 1 | -1) =>
  <T extends Node>(value: Node, nodes: readonly T[], requireWeak: boolean): readonly T[] => {
    const sibling = getSibling(value, offset)
    if(!sibling) return nodes
    nodes = nodes.filter(x => getSibling(x, offset) instanceof sibling.compareClass)
    if(sibling instanceof RelativePositionalNode)
      return sibling.children[0]
        .filter(nodes.map(x => getSibling(x, offset)!.children[0]), requireWeak)
        .map(x => getSibling(x.parent!, -offset) as T)
    else
      return sibling
        .filter(nodes.map(x => getSibling(x, offset)!), requireWeak)
        .map(x => getSibling(x, -offset) as T)
  }
