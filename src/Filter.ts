import { Selection } from "./Selection"

// Function bivariance hack
export type FilterFn<S, T> = { fn<Sel extends Selection<T>>(self: S, values: Sel, requireWeak: boolean): Sel }["fn"]
export interface Filter<S, T> {
  /** Defaults to Infinity */
  priority?: number,
  /** Defaults to false */
  required?: "strong" | "weak" | false,
  filter: FilterFn<S, T> | Filter<S, T>,
  // Disallow arrays
  slice?: never,
}
