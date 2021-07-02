import { Filter, FilterFn } from "./Filter"
import { FilterGroup } from "./FilterGroup"
import { Node } from "./Node"

function getSibling(node: Node, offset: number): Node | undefined{
  return node.parent?.children[node.index + offset]
}

const siblingExistenceMatches = (offset: 1 | -1): FilterFn<Node, Node> =>
  (self, selection) => {
    const sibling = getSibling(self, offset)
    return selection.applyPredicate(x => !!getSibling(x, offset) === !!sibling)
  }

const compareSiblingsLock = new Set<Node>()
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const compareSiblings = (offset: 1 | -1): FilterFn<Node, Node> =>
  (self, selection) => {
    if(compareSiblingsLock.has(self))
      return selection
    try {
      compareSiblingsLock.add(self)
      const sibling = getSibling(self, offset)
      if(!sibling) return selection
      return sibling.filter(selection.map(x => [getSibling(x, offset)!]), true).apply()
    }
    finally {
      compareSiblingsLock.delete(self)
    }
  }

export const relativePositionFilter: Filter<Node, Node> = new FilterGroup({
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
