import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseTemplateString(this: SourceFileNode, tsNode: ts.Node){
  // See https://ts-ast-viewer.com/#code/AYQwRgxgJA3gJgUwGYF8AeBPAXrJB7PFMEAJ2CA
  const head = tsNode.getChildAt(0)
  const spans = this.getChildren(tsNode.getChildAt(1))
  const children = []
  const headText = this.getText(head)
  children.push(new TemplateStringQuote("`"))
  children.push(new TemplateStringText(headText.slice(1, -2)))
  let lastPos = head.end
  for(const span of spans) {
    const spanChildren = this.getChildren(span)
    children.push(
      new TemplateStringInterpolation(this.finishTrivia([
        new TemplateStringInterpolationOpen("${"),
        this.parseTrivia(lastPos, this.getStart(spanChildren[0])),
        this.parseTsNode(spanChildren[0]),
        this.parseTrivia(spanChildren[0].end, this.getStart(spanChildren[1])),
        new TemplateStringInterpolationOpen("}"),
      ])),
      new TemplateStringText(
        this.getText(spanChildren[1]).slice(1, spanChildren[1].kind === ts.SyntaxKind.TemplateMiddle ? -2 : -1),
      ),
    )
    lastPos = spanChildren[1].end
  }
  children.push(new TemplateStringQuote("`"))
  return new TemplateStringNode(children as never)
}

export class TemplateStringNode extends TsNodeNode {}
export class TemplateStringQuote extends TsNodeNode {}
export class TemplateStringText extends TsNodeNode {}
export class TemplateStringInterpolation extends TsNodeNode {}
export class TemplateStringInterpolationOpen extends TsNodeNode {}
export class TemplateStringInterpolationClose extends TsNodeNode {}
