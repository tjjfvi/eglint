import { Filter, FilterFn } from "./Filter"
import { FilterGroup } from "./FilterGroup"
import { Node } from "./Node"
import { propertyFilter } from "./propertyFilter"

function getSibling(node: Node, offset: number): Node | undefined{
  return node.parent?.children[node.index + offset]
}

const siblingExistenceMatches = (offset: 1 | -1) =>
  propertyFilter<Node>(x => !!getSibling(x, offset))

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
      return sibling.filter(selection.map(x => [getSibling(x, offset)!])).apply()
    }
    finally {
      compareSiblingsLock.delete(self)
    }
  }

export const relativePositionFilter: Filter<Node, Node> = new FilterGroup({
  mode: "and",
  required: true,
  filters: [
    { required: true, filter: siblingExistenceMatches(-1) },
    { required: true, filter: siblingExistenceMatches(+1) },
    new FilterGroup({
      mode: "or",
      required: true,
      filters: [
        new FilterGroup({
          mode: "and",
          filters: [
            { required: true, filter: compareSiblings(-1) },
            { filter: compareSiblings(+1) },
          ],
        }),
        { filter: compareSiblings(+1) },
      ],
    }),
  ],
})
