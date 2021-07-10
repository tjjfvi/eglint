
import ts from "typescript"

export function syntaxKindName(kind: ts.SyntaxKind){
  for(const name in ts.SyntaxKind)
    if(ts.SyntaxKind[name] as never === kind)
      return name
  throw new Error("Unknown ts.SyntaxKind " + kind)
}
