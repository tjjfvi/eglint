import ts from "typescript"

export function getChildOfKind(children: ts.Node[], index: number, kind: ts.SyntaxKind){
  return children[index].kind === kind ? children[index] : undefined
}
