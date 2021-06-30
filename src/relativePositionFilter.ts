import { Filter, FilterGroup } from "./FilterGroup"
import { Node } from "./Node"

function getSibling(node: Node, offset: number): Node | undefined{
  return node.parent?.children[node.index + offset]
}

const siblingExistenceMatches = (offset: 1 | -1) =>
  <T extends Node>(value: Node, nodes: readonly T[]): readonly T[] => {
    const sibling = getSibling(value, offset)
    return nodes.filter(x => !!getSibling(x, offset) === !!sibling)
  }

const compareSiblingsLock = new Set<Node>()
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const compareSiblings = (offset: 1 | -1) =>
  <T extends Node>(value: Node, nodes: readonly T[]): readonly T[] => {
    if(compareSiblingsLock.has(value))
      return nodes
    compareSiblingsLock.add(value)
    const sibling = getSibling(value, offset)
    if(!sibling) return nodes
    nodes = nodes.filter(x => getSibling(x, offset) instanceof sibling.compareClass)
    const result = sibling
      .select(nodes.map(x => getSibling(x, offset)!), [])
      .map(x => getSibling(x, -offset) as T)
    compareSiblingsLock.delete(value)
    return result
  }

export const relativePositionFilter: Filter<Node> = new FilterGroup({
  mode: "and",
  required: "weak",
  filters: [
    { required: "weak", filter: siblingExistenceMatches(-1) },
    { required: "weak", filter: siblingExistenceMatches(+1) },
    new FilterGroup({
      mode: "or",
      required: "strong",
      filters: [
        new FilterGroup({
          mode: "and",
          filters: [
            { required: "strong", filter: compareSiblings(-1) },
            { filter: compareSiblings(+1) },
          ],
        }),
        { filter: compareSiblings(+1) },
      ],
    }),
  ],
})
