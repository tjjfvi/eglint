
import ts from "typescript"
import { readFileSync } from "fs"

class Line {

  readonly source: Source
  readonly length: number
  readonly contents: string
  readonly indentLevel: number

  constructor(readonly range: Range, readonly delimiter: Range){
    this.source = this.range.source
    this.length = this.range.length
    this.contents = this.range.contents
    this.indentLevel = this.contents.match(/^\s*/)?.[0].length ?? 0
  }

}

class Source {

  readonly lines: readonly Line[]

  constructor(readonly contents: string){
    this.lines = this._initGetLines()
  }

  private _initGetLines(){
    let pos = 0
    const lines = []
    for(const lineText of this.contents.split("\n")) {
      const start = pos
      const delimiterText = (
        pos + lineText.length === this.contents.length
          ? "" // Bare EOF
          : (lineText.endsWith("\r") ? "\r" : "") + "\n"
      )
      const end = pos += lineText.length + "\n".length - delimiterText.length
      pos = end + delimiterText.length
      const range = new Range(this, start, end)
      const delimiter = new Range(this, end, end + delimiterText.length)
      const line = new Line(range, delimiter)
      lines.push(line)
    }
    return lines
  }

  getLineAtPos(pos: number){
    for(const line of this.lines)
      if(line.range.end >= pos)
        return line
    throw new Error(`Invalid pos ${pos}`)
  }

}

class Range {

  readonly length: number
  readonly contents: string

  constructor(readonly source: Source, readonly start: number, readonly end: number){
    this.length = end - start
    this.contents = source.contents.slice(start, end)
  }

}

class AstTrivia {

  readonly source: Source
  constructor(readonly range: Range, readonly kind: AstTriviaKind){
    this.source = range.source
  }

}

class AstNode {

  readonly source: Source
  constructor(readonly range: Range, readonly children: readonly Ast[]){
    this.source = range.source
  }

}

type AstTriviaKind =
  | "newline"
  | "indent"
  | "outdent"
  | "delimiter"
  | "other"

type Ast =
  | AstTrivia
  | AstNode

function tsSourceFileToAst(sourceFile: ts.SourceFile){
  const source = new Source(sourceFile.getFullText())
  return tsAstToAst(source, sourceFile, sourceFile, true)
}

function tsAstToAst(source: Source, sourceFile: ts.SourceFile, node: ts.Node, full = false): Ast{
  const triviaCustomScanner = (source: Source, pos: number, _contents: string, children: Ast[]) => {
    const end = ts.getTrailingCommentRanges(source.contents, pos)?.[0]?.end
    if(!end)
      return undefined
    children.push(new AstTrivia(new Range(source, pos, end), "other"))
    return end
  }
  const delimiters = new Set([",", ";", "=", ":", " "])
  const range = new Range(source, full ? node.getFullStart() : node.getStart(sourceFile), node.end)
  const children = []
  let pos = range.start
  node.forEachChild(tsChild => {
    const child = tsAstToAst(source, sourceFile, tsChild)
    if(child.range.start !== pos)
      children.push(triviaToAst(new Range(source, pos, child.range.start), delimiters, triviaCustomScanner))
    children.push(child)
    pos = child.range.end
  })
  if(pos !== range.end)
    children.push(triviaToAst(new Range(source, pos, range.end), delimiters, triviaCustomScanner))
  return new AstNode(range, children)
}

function triviaToAst(
  range: Range,
  delimiters: ReadonlySet<string>,
  customScanner: (
    source: Source,
    pos: number,
    contents: string,
    children: Ast[],
  ) => number | undefined = () => undefined,
): Ast{
  const { source } = range
  let pos = range.start
  const children: Ast[] = []
  main: while(pos < range.end) {
    const contents = range.contents.slice(pos - range.start)
    const customScannerResult = customScanner(source, pos, contents, children)
    if(customScannerResult !== undefined) {
      pos = customScannerResult
      continue
    }
    if(contents.startsWith("\n") || contents.startsWith("\r\n")) {
      const delimiter = contents.startsWith("\n") ? "\n" : "\r\n"
      const prevLine = source.getLineAtPos(pos)
      const curLine = source.getLineAtPos(pos + delimiter.length)
      console.log(prevLine, curLine)
      const start = pos
      const end = pos + delimiter.length + curLine.indentLevel
      const range = new Range(source, start, end)
      children.push(new AstTrivia(range, "newline"))
      if(prevLine.indentLevel < curLine.indentLevel)
        pushMultiple(
          children,
          new AstTrivia(new Range(source, end, end), "indent"),
          curLine.indentLevel - prevLine.indentLevel,
        )
      else if(prevLine.indentLevel > curLine.indentLevel)
        pushMultiple(
          children,
          new AstTrivia(new Range(source, end, end), "outdent"),
          prevLine.indentLevel - curLine.indentLevel,
        )
      pos = end
      continue main
    }
    for(const delimiter of delimiters)
      if(contents.startsWith(delimiter)) {
        children.push(new AstTrivia(new Range(source, pos, pos += delimiter.length), "delimiter"))
        continue main
      }
    children.push(new AstTrivia(new Range(source, pos, pos += 1), "other"))
  }
  return new AstNode(range, children)
}

function pushMultiple<T>(array: T[], value: T, count: number){
  for(let i = 0; i < count; i++)
    array.push(value)
}

const file = (path: string) => readFileSync(require.resolve(path), "utf8")

const rules = ts.createSourceFile("rules", file("../test/eglintRules.ts"), ts.ScriptTarget.ES2020)

const x = tsSourceFileToAst(rules)

console.log(x)

setInterval(() => {
  if(Math.random() > 1)
    console.log(x)
}, 1000)
