
import { ContextProvider } from "./Context"

export abstract class Node {

  abstract toString(context: ContextProvider): string

  #similarityMemo = new WeakMap<Node, number>()
  similarityTo(to: Node): number{
    const existing = this.#similarityMemo.get(to)
    if(existing !== undefined) return existing
    const similarity = this._similarityTo(to)
    this.#similarityMemo.set(to, similarity)
    return similarity
  }

  protected _similarityTo(to: Node): number{
    return to._similarityFrom(this)
  }

  protected _similarityFrom(from: Node): number{
    from
    return 0
  }

  #adaptMemo = new WeakMap<Node, Node>()
  adaptTo(reference: Node): Node{
    const existing = this.#adaptMemo.get(reference)
    if(existing !== undefined) return existing
    const reconciled = this._adaptTo(reference)
    this.#adaptMemo.set(reference, reconciled)
    return reconciled
  }

  protected _adaptTo(reference: Node): Node{
    reference
    return reference._applyTo(this)
  }

  protected _applyTo(source: Node): Node{
    return source
  }

}
