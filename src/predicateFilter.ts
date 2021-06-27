import { Filter } from "./FilterGroup"

export const predicateFilter = <T>(predicate: (self: T, other: T) => boolean): Filter<T> => ({
  filter(self, others){
    return others.filter(other => predicate(self, other))
  },
})
