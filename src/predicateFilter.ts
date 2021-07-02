import { Filter } from "./Filter"
import { Selection } from "./Selection"

export const predicateFilter = <S, T>(predicate: (self: S, other: T) => boolean): Filter<S, T> => ({
  filter: <Sel extends Selection<T>>(self: S, selection: Sel) =>
    selection.applyPredicate(other => predicate(self, other)),
})
