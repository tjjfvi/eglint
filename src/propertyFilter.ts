import { Filter } from "./Filter"
import { Node } from "./Node"

export const propertyFilter = <T extends Node>(key: keyof T & string | ((value: T) => unknown)): Filter<T, T> => {
  const getProperty = typeof key === "string" ? (x: T) => x[key] : key
  return {
    filter: (self, selection) => {
      const selfValue = getProperty(self)
      return selection.applyPredicate(other => getProperty(other) === selfValue)
    },
  }
}
