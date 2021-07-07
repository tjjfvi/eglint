import { Node } from "./Node"
import { Selection } from "./Selection"

// Function bivariance hack
export type FilterFn<S extends Node, T extends Node> = {
  fn<Sel extends Selection<T>>(self: S, values: Sel): Sel,
}["fn"]
export interface Filter<S extends Node, T extends Node> {
  /** Defaults to Infinity */
  priority?: number,
  /** Defaults to false */
  required?: boolean,
  filter: FilterFn<S, T> | Filter<S, T>,
  // Disallow arrays
  slice?: never,
}
