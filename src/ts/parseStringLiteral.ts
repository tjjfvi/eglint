import ts from "typescript"
import { FilterGroup } from "../FilterGroup"
import { Node } from "../Node"
import { predicateFilter } from "../predicateFilter"
import { propertyFilter } from "../propertyFilter"
import { Reference } from "../Reference"
import { Selection } from "../Selection"
import { SourceFileNode } from "./SourceFileNode"

export function parseStringLiteral(this: SourceFileNode, tsNode: ts.Node){
  return new StringLiteralNode(this.getText(tsNode))
}

enum StringLiteralEscapes {
  Single = 1 << 0,
  Double = 1 << 1,
  Backtick = 1 << 2,
}

export class StringLiteralNode extends Node {

  quote = this.text[0]
  innerText = this.text.slice(1, -1)
  escapes = 0
    | (this.innerText.includes("'") ? StringLiteralEscapes.Single : 0)
    | (this.innerText.includes('"') ? StringLiteralEscapes.Double : 0)
    | (this.innerText.includes("`") ? StringLiteralEscapes.Backtick : 0)

  constructor(text: string){
    super(text)
  }

  stringLiteralFilter = this.filterGroup.addFilter(new FilterGroup({
    mode: "and",
    priority: 10,
    required: "strong",
    filters: [
      new FilterGroup({
        mode: "or",
        required: "weak",
        filters: [
          {
            required: "weak",
            filter: propertyFilter("escapes"),
          },
          predicateFilter<this, this>((self, other) => (self.escapes & other.escapes) === self.escapes),
        ],
      }),
      propertyFilter("quote"),
    ],
  }))

  override _adaptTo(reference: Reference, selection: Selection<this>){
    const selectedNode = selection.first()
    if(!selectedNode || selectedNode.quote === this.quote) return this
    const newQuote = selectedNode.quote
    const escapedInnerText = this.innerText
      // If the length is even (like `\"`), it's already escaped
      .replace(new RegExp("\\\\*" + newQuote, "g"), x => x.length % 2 ? "\\" + x : x)
      // Unescape old quotes; we don't need to check for length, because they must be escaped
      .replace(new RegExp("\\\\" + this.quote, "g"), this.quote)
    return new StringLiteralNode(newQuote + escapedInnerText + newQuote)
  }

}
