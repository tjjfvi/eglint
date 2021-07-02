import { Filter } from "./Filter"

export const propertyFilter = <T>(key: keyof T): Filter<T, T> => ({
  filter: (self, selection) => {
    const selfValue = self[key] // Only run getters once
    return selection.applyPredicate(other => other[key] === selfValue)
  },
})
