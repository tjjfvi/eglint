import { Filter } from "./Filter"
import { Node } from "./Node"
import { Selection } from "./Selection"

export const predicateFilter =
  <S extends Node, T extends Node>(predicate: (self: S, other: T) => boolean): Filter<S, T> => ({
    filter: <Sel extends Selection<T>>(self: S, selection: Sel) =>
      selection.applyPredicate(other => predicate(self, other)),
  })
