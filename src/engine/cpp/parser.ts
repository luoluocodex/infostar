/**
 * engine/cpp/parser.ts · 递归下降语法分析
 * 覆盖考纲语句子集：声明 / 赋值 / ++ -- / 表达式 / cin / cout / if-else / for / 一维与二维数组。
 * 出错时一律抛出儿童化的 CppRunError。
 */
import type { Token } from './lexer'
import { lex } from './lexer'
import { CppRunError, syntaxText } from './errors'
import type {
  DeclTypeName,
  Expr,
  Program,
  Stmt,
} from './ast'

const DECL_TYPES: DeclTypeName[] = ['int', 'long', 'float', 'double']

export interface ParseResult {
  program: Program
  lines: string[]
}

class Parser {
  private readonly tokens: Token[]
  private pos = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  // ---------- 基础工具 ----------
  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]!
  }
  private next(): Token {
    const t = this.peek()
    if (t.type !== 'eof') this.pos++
    return t
  }
  private isValue(value: string): boolean {
    return this.peek().value === value && this.peek().type !== 'eof'
  }
  private eat(value: string): boolean {
    if (this.isValue(value)) {
      this.pos++
      return true
    }
    return false
  }
  private expectValue(value: string, friendly: (line: number) => string): Token {
    const t = this.peek()
    if (t.value !== value) throw new CppRunError(t.line, friendly(t.line), `期待「${value}」，实际是「${t.value || '结尾'}」`)
    this.pos++
    return t
  }
  private expectSemi(): void {
    const t = this.peek()
    if (t.value !== ';') {
      throw new CppRunError(t.line, syntaxText.missingSemicolon(t.line), `期待「;」，实际是「${t.value || '结尾'}」`)
    }
    this.pos++
  }
  private expectIdent(): Token {
    const t = this.peek()
    if (t.type !== 'id') {
      throw new CppRunError(t.line, syntaxText.unknownWord(t.line, t.value || '空'), `期待标识符，实际是「${t.value}」`)
    }
    this.pos++
    return t
  }

  // ---------- 程序 ----------
  parseProgram(): Program {
    const first = this.peek()
    if (first.type === 'eof') {
      throw new CppRunError(1, '还没有写任何程序哦')
    }

    // 跳过空语句与 using namespace std;
    for (;;) {
      if (this.eat(';')) continue
      if (this.isValue('using')) {
        this.next()
        this.expectValue('namespace', () => '这行应该是「using namespace std;」')
        this.expectIdent()
        this.expectSemi()
        continue
      }
      break
    }

    if (!this.isValue('int') || this.peek(1).value !== 'main') {
      const t = this.peek()
      throw new CppRunError(t.line, syntaxText.noMain(), `期待「int main(){...}」，实际是「${t.value || '结尾'}」`)
    }
    this.next() // int
    this.next() // main
    this.expectValue('(', () => 'main 后面要跟一对小括号「( )」')
    this.expectValue(')', () => 'main 的小括号「( )」里不用写东西')
    const body = this.parseBlock()
    return { kind: 'program', body: body.body }
  }

  // ---------- 语句 ----------
  private parseBlock(): Extract<Stmt, { kind: 'block' }> {
    const open = this.expectValue('{', (line) => `第 ${line} 行缺一个左花括号「{」`)
    const body: Stmt[] = []
    for (;;) {
      if (this.isValue('}')) {
        this.next()
        break
      }
      if (this.peek().type === 'eof') {
        throw new CppRunError(open.line, syntaxText.missingBrace(open.line))
      }
      body.push(this.parseStatement())
    }
    return { kind: 'block', body, line: open.line }
  }

  private parseStatement(): Stmt {
    const t = this.peek()
    if (t.value === ';') {
      this.next()
      return { kind: 'empty', line: t.line }
    }
    if (t.value === '{') return this.parseBlock()
    if (t.type === 'kw' && DECL_TYPES.includes(t.value as DeclTypeName)) {
      const stmt = this.parseDeclStatement()
      return stmt
    }
    if (t.value === 'if') return this.parseIf()
    if (t.value === 'for') return this.parseFor()
    if (t.value === 'cin') return this.parseCin()
    if (t.value === 'cout') return this.parseCout()
    if (t.value === 'return') return this.parseReturn()
    if (t.value === 'else') {
      throw new CppRunError(t.line, `第 ${t.line} 行的「else」前面好像没有对应的「if」`)
    }
    return this.parseSimpleStatementWithSemi()
  }

  private parseDeclStatement(): Stmt {
    const typeTok = this.next()
    const type = typeTok.value as DeclTypeName
    const decls: Stmt[] = []
    for (;;) {
      const nameTok = this.expectIdent()
      const dims: Expr[] = []
      while (this.isValue('[')) {
        this.next()
        dims.push(this.parseExpr())
        this.expectValue(']', (line) => `第 ${line} 行的方括号「[ ]」没有配成对`)
      }
      let init: Expr | undefined
      if (this.eat('=')) init = this.parseExpr()
      decls.push({
        kind: 'decl',
        type,
        name: nameTok.value,
        dims,
        ...(init ? { init } : {}),
        line: nameTok.line,
      })
      if (this.eat(',')) continue
      break
    }
    this.expectSemi()
    if (decls.length === 1) return decls[0]!
    return { kind: 'block', body: decls, line: typeTok.line }
  }

  /** 不带分号的简单语句：赋值 / ++ -- / 空。用于 for 的 init 与 step */
  private parseSimpleStatement(): Stmt {
    const t = this.peek()
    if (t.value === ';' || t.value === ')') return { kind: 'empty', line: t.line }

    if (t.type === 'kw' && DECL_TYPES.includes(t.value as DeclTypeName)) {
      // for 初始化里的声明：int i=1
      const type = this.next().value as DeclTypeName
      const nameTok = this.expectIdent()
      const dims: Expr[] = []
      while (this.isValue('[')) {
        this.next()
        dims.push(this.parseExpr())
        this.expectValue(']', (line) => `第 ${line} 行的方括号「[ ]」没有配成对`)
      }
      let init: Expr | undefined
      if (this.eat('=')) init = this.parseExpr()
      return {
        kind: 'decl',
        type,
        name: nameTok.value,
        dims,
        ...(init ? { init } : {}),
        line: nameTok.line,
      }
    }

    if (t.value === '++' || t.value === '--') {
      const op = this.next().value as '++' | '--'
      const target = this.parsePostfixTarget()
      return { kind: 'incdec', op, prefix: true, target, line: t.line }
    }

    const expr = this.parseExpr()
    if (this.eat('=')) {
      const value = this.parseExpr()
      return { kind: 'assign', target: expr, value, line: t.line }
    }
    if (expr.kind === 'postfix') {
      return { kind: 'incdec', op: expr.op, prefix: false, target: expr.target, line: t.line }
    }
    throw new CppRunError(
      t.line,
      `第 ${t.line} 行这一句我不知道要做什么，是不是少了「=」或者「++」？`,
    )
  }

  private parseSimpleStatementWithSemi(): Stmt {
    const stmt = this.parseSimpleStatement()
    this.expectSemi()
    return stmt
  }

  private parseIf(): Stmt {
    const ifTok = this.next()
    this.expectValue('(', (line) => `第 ${line} 行「if」后面要跟一对小括号「( )」`)
    const cond = this.parseExpr()
    this.expectValue(')', (line) => `第 ${line} 行 if 的小括号「( )」没有配成对`)
    const then = this.parseStatement()
    let elseBranch: Stmt | undefined
    if (this.eat('else')) elseBranch = this.parseStatement()
    return {
      kind: 'if',
      cond,
      then,
      ...(elseBranch ? { else: elseBranch } : {}),
      line: ifTok.line,
    }
  }

  private parseFor(): Stmt {
    const forTok = this.next()
    this.expectValue('(', (line) => `第 ${line} 行「for」后面要跟一对小括号「( )」`)
    const init = this.parseSimpleStatement()
    this.expectSemi()
    let cond: Expr | null = null
    if (!this.isValue(';')) cond = this.parseExpr()
    this.expectSemi()
    let step: Stmt | null = null
    if (!this.isValue(')')) step = this.parseSimpleStatement()
    this.expectValue(')', (line) => `第 ${line} 行 for 的小括号「( )」没有配成对`)
    const body = this.parseStatement()
    return { kind: 'for', init, cond, step, body, line: forTok.line }
  }

  private parseCout(): Stmt {
    const tok = this.next()
    const parts: Expr[] = []
    for (;;) {
      if (this.isValue('<<')) {
        this.next()
        if (this.isValue('endl')) {
          const e = this.next()
          parts.push({ kind: 'endl', line: e.line })
        } else {
          parts.push(this.parseExpr())
        }
        continue
      }
      break
    }
    if (parts.length === 0) {
      throw new CppRunError(tok.line, `第 ${tok.line} 行「cout」后面少了「<<」`)
    }
    this.expectSemi()
    return { kind: 'cout', parts, line: tok.line }
  }

  private parseCin(): Stmt {
    const tok = this.next()
    const targets: Expr[] = []
    for (;;) {
      if (this.isValue('>>')) {
        this.next()
        targets.push(this.parsePostfixTarget())
        continue
      }
      break
    }
    if (targets.length === 0) {
      throw new CppRunError(tok.line, `第 ${tok.line} 行「cin」后面少了「>>」`)
    }
    this.expectSemi()
    return { kind: 'cin', targets, line: tok.line }
  }

  private parseReturn(): Stmt {
    const tok = this.next()
    if (this.isValue(';')) {
      this.next()
      return { kind: 'return', line: tok.line }
    }
    const value = this.parseExpr()
    this.expectSemi()
    return { kind: 'return', value, line: tok.line }
  }

  /** 只接受 变量 或 变量[下标]，用于 cin 的接收端与 ++/-- 的目标 */
  private parsePostfixTarget(): Expr {
    const t = this.expectIdent()
    const indices: Expr[] = []
    while (this.isValue('[')) {
      this.next()
      indices.push(this.parseExpr())
      this.expectValue(']', (line) => `第 ${line} 行的方括号「[ ]」没有配成对`)
    }
    if (indices.length === 0) return { kind: 'var', name: t.value, line: t.line }
    return { kind: 'index', name: t.value, indices, line: t.line }
  }

  // ---------- 表达式 ----------
  private parseExpr(): Expr {
    return this.parseOr()
  }
  private parseOr(): Expr {
    let left = this.parseAnd()
    while (this.isValue('||')) {
      const op = this.next()
      const right = this.parseAnd()
      left = { kind: 'binary', op: '||', left, right, line: op.line }
    }
    return left
  }
  private parseAnd(): Expr {
    let left = this.parseEquality()
    while (this.isValue('&&')) {
      const op = this.next()
      const right = this.parseEquality()
      left = { kind: 'binary', op: '&&', left, right, line: op.line }
    }
    return left
  }
  private parseEquality(): Expr {
    let left = this.parseRelational()
    while (this.isValue('==') || this.isValue('!=')) {
      const op = this.next()
      const right = this.parseRelational()
      left = { kind: 'binary', op: op.value as '==' | '!=', left, right, line: op.line }
    }
    return left
  }
  private parseRelational(): Expr {
    let left = this.parseAdditive()
    while (['<', '<=', '>', '>='].includes(this.peek().value) && this.peek().type === 'op') {
      const op = this.next()
      const right = this.parseAdditive()
      left = { kind: 'binary', op: op.value as '<' | '<=' | '>' | '>=', left, right, line: op.line }
    }
    return left
  }
  private parseAdditive(): Expr {
    let left = this.parseMultiplicative()
    while (this.isValue('+') || this.isValue('-')) {
      const op = this.next()
      const right = this.parseMultiplicative()
      left = { kind: 'binary', op: op.value as '+' | '-', left, right, line: op.line }
    }
    return left
  }
  private parseMultiplicative(): Expr {
    let left = this.parseUnary()
    while (this.isValue('*') || this.isValue('/') || this.isValue('%')) {
      const op = this.next()
      const right = this.parseUnary()
      left = {
        kind: 'binary',
        op: op.value as '*' | '/' | '%',
        left,
        right,
        line: op.line,
      }
    }
    return left
  }
  private parseUnary(): Expr {
    const t = this.peek()
    // 前置 ++ / -- 出现在表达式里（int a = ++i;）
    if (t.value === '++' || t.value === '--') {
      this.next()
      const target = this.parseUnary()
      return { kind: 'prefix', op: t.value as '++' | '--', target, line: t.line }
    }
    if (t.type === 'op' && (t.value === '!' || t.value === '-' || t.value === '+')) {
      this.next()
      const expr = this.parseUnary()
      return { kind: 'unary', op: t.value as '!' | '-' | '+', expr, line: t.line }
    }
    return this.parsePostfix()
  }
  private parsePostfix(): Expr {
    let expr = this.parsePrimary()
    while (this.isValue('++') || this.isValue('--')) {
      const op = this.next()
      expr = { kind: 'postfix', op: op.value as '++' | '--', target: expr, line: op.line }
    }
    return expr
  }
  private parsePrimary(): Expr {
    const t = this.peek()
    if (t.type === 'num') {
      this.next()
      return { kind: 'num', value: Number(t.value), isFloat: t.value.includes('.'), line: t.line }
    }
    if (t.type === 'str') {
      this.next()
      return { kind: 'str', value: t.value, line: t.line }
    }
    if (t.value === 'endl') {
      this.next()
      return { kind: 'endl', line: t.line }
    }
    if (t.value === '(') {
      this.next()
      const inner = this.parseExpr()
      this.expectValue(')', (line) => `第 ${line} 行的小括号「( )」没有配成对`)
      return inner
    }
    if (t.type === 'id') {
      return this.parsePostfixTarget()
    }
    throw new CppRunError(
      t.line,
      `第 ${t.line} 行这里应该填一个数字或者盒子名字，现在是「${t.value || '空'}」`,
    )
  }
}

export function parse(src: string): ParseResult {
  const { tokens, lines } = lex(src)
  const parser = new Parser(tokens)
  const program = parser.parseProgram()
  return { program, lines }
}
