/**
 * engine/cpp/ast.ts · AST 节点定义（对齐考纲语法子集）
 */

export type BinOp =
  | '+' | '-' | '*' | '/' | '%'
  | '<' | '<=' | '>' | '>=' | '==' | '!='
  | '&&' | '||'

export interface ExprNum {
  kind: 'num'
  value: number
  isFloat: boolean
  line: number
}
export interface ExprStr {
  kind: 'str'
  value: string
  line: number
}
export interface ExprEndl {
  kind: 'endl'
  line: number
}
export interface ExprVar {
  kind: 'var'
  name: string
  line: number
}
export interface ExprIndex {
  kind: 'index'
  name: string
  indices: Expr[]
  line: number
}
export interface ExprUnary {
  kind: 'unary'
  op: '!' | '-' | '+'
  expr: Expr
  line: number
}
export interface ExprBinary {
  kind: 'binary'
  op: BinOp
  left: Expr
  right: Expr
  line: number
}
/** 后置 ++ / --（i++、a[i]-- 等） */
export interface ExprPostfix {
  kind: 'postfix'
  op: '++' | '--'
  target: Expr
  line: number
}
/** 前置 ++ / -- 出现在表达式里（int a = ++i;）——与 postfix 的区别正是考点 */
export interface ExprPrefix {
  kind: 'prefix'
  op: '++' | '--'
  target: Expr
  line: number
}

export type Expr =
  | ExprNum
  | ExprStr
  | ExprEndl
  | ExprVar
  | ExprIndex
  | ExprUnary
  | ExprBinary
  | ExprPostfix
  | ExprPrefix

export type DeclTypeName = 'int' | 'long' | 'float' | 'double'

export interface StmtDecl {
  kind: 'decl'
  type: DeclTypeName
  name: string
  /** 每个维度一个长度表达式；空数组表示标量 */
  dims: Expr[]
  init?: Expr
  line: number
}
export interface StmtAssign {
  kind: 'assign'
  target: Expr
  value: Expr
  line: number
}
export interface StmtIncDec {
  kind: 'incdec'
  op: '++' | '--'
  prefix: boolean
  target: Expr
  line: number
}
export interface StmtIf {
  kind: 'if'
  cond: Expr
  then: Stmt
  else?: Stmt
  line: number
}
export interface StmtFor {
  kind: 'for'
  init: Stmt | null
  cond: Expr | null
  step: Stmt | null
  body: Stmt
  line: number
}
export interface StmtCout {
  kind: 'cout'
  parts: Expr[]
  line: number
}
export interface StmtCin {
  kind: 'cin'
  targets: Expr[]
  line: number
}
export interface StmtBlock {
  kind: 'block'
  body: Stmt[]
  line: number
}
export interface StmtReturn {
  kind: 'return'
  value?: Expr
  line: number
}
export interface StmtEmpty {
  kind: 'empty'
  line: number
}

export type Stmt =
  | StmtDecl
  | StmtAssign
  | StmtIncDec
  | StmtIf
  | StmtFor
  | StmtCout
  | StmtCin
  | StmtBlock
  | StmtReturn
  | StmtEmpty

export interface Program {
  kind: 'program'
  body: Stmt[]
}
