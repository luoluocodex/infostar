/**
 * engine/cpp/interpreter.ts · 解释执行 → 生成 Frame Trace
 * 纯逻辑、无 UI 依赖、无 eval / Function 构造（纯 AST 求值）。
 * 支持：int/long/float/double、算术（含整数除法与取余语义）、关系、逻辑（短路）、
 *       cin（只从题目预置用例读取，约定 G1）、cout、if-else、for、一维/二维数组。
 */
import type {
  CppScalarType,
  Frame,
  FrameHighlight,
  LoopInfo,
  RunResult,
  VarSnapshot,
  VarValue,
} from './types'
import { CppRunError, syntaxText, toCppError } from './errors'
import type { Expr, Program, Stmt } from './ast'

export const MAX_STEPS = 20000

interface ScalarVar {
  kind: 'scalar'
  type: CppScalarType
  value: number
}
interface ArrayVar {
  kind: 'array'
  type: CppScalarType
  dims: [number] | [number, number]
  data: number[]
}
type Var = ScalarVar | ArrayVar

type CppValue = { t: CppScalarType; v: number } | { t: 'str'; s: string } | { t: 'endl' }

/** 模拟 C++ cout 的默认数字输出（float/double 保留 6 位有效数字并去掉多余 0） */
export function formatNumber(t: CppScalarType, v: number): string {
  if (t === 'int' || t === 'long') return String(Math.trunc(v))
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf'
  let s = v.toPrecision(6)
  if (s.includes('e')) return s
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

function isIntType(t: CppScalarType): boolean {
  return t === 'int' || t === 'long'
}

function promote(a: CppScalarType, b: CppScalarType): CppScalarType {
  if (!isIntType(a) || !isIntType(b)) return 'double'
  if (a === 'long' || b === 'long') return 'long'
  return 'int'
}

function shorter(t: CppScalarType): CppScalarType {
  if (t === 'double') return 'float'
  if (t === 'long') return 'int'
  return t
}

/** 把值转成目标类型（模拟 C++ 的隐式截断） */
function coerce(t: CppScalarType, v: number): number {
  return isIntType(t) ? Math.trunc(v) : v
}

type StmtCtx = 'normal' | 'loop-init' | 'loop-step'

class Interpreter {
  private readonly vars = new Map<string, Var>()
  private readonly input: number[]
  private inputPos = 0
  private stdout = ''
  private readonly frames: Frame[] = []
  private readonly loopStack: LoopInfo[] = []
  private changed = new Set<string>()
  private steps = 0
  private returned = false

  constructor(input: number[]) {
    this.input = input
  }

  // ---------- 工具 ----------
  private emit(
    action: Frame['action'],
    line: number,
    note: string,
    highlight?: FrameHighlight,
  ): void {
    this.steps++
    if (this.steps > MAX_STEPS) {
      throw new CppRunError(line, syntaxText.tooManySteps())
    }
    const vars: Record<string, VarSnapshot> = {}
    for (const [name, v] of this.vars) {
      vars[name] = this.toSnapshot(name, v)
    }
    this.changed.clear()
    const frame: Frame = {
      step: this.steps,
      line,
      action,
      vars,
      stdout: this.stdout,
      loopStack: this.loopStack.map((l) => ({ ...l })),
      note,
      ...(highlight ? { highlight } : {}),
    }
    this.frames.push(frame)
  }

  private toSnapshot(name: string, v: Var): VarSnapshot {
    let type: VarSnapshot['type']
    let value: VarValue
    if (v.kind === 'scalar') {
      type = v.type
      value = v.value
    } else {
      type = v.dims.length === 2 ? 'array2d' : 'array'
      if (v.dims.length === 2) {
        const [rows, cols] = v.dims
        const grid: number[][] = []
        for (let r = 0; r < rows; r++) {
          grid.push(v.data.slice(r * cols, (r + 1) * cols))
        }
        value = grid
      } else {
        value = v.data.slice()
      }
    }
    return {
      name,
      type,
      value,
      changed: this.changed.has(name),
      boxSize: v.kind === 'array' || v.type === 'long' || v.type === 'double' ? 'big' : 'small',
    }
  }

  private markChanged(name: string): void {
    this.changed.add(name)
  }

  private readVar(name: string, line: number): Var {
    const v = this.vars.get(name)
    if (!v) {
      throw new CppRunError(line, `第 ${line} 行的盒子「${name}」还没出现过呢，先声明它吧`)
    }
    return v
  }

  // ---------- 常量求值（用于数组长度） ----------
  private constEval(e: Expr): number {
    switch (e.kind) {
      case 'num':
        return e.value
      case 'unary': {
        const v = this.constEval(e.expr)
        return e.op === '-' ? -v : e.op === '+' ? v : v === 0 ? 1 : 0
      }
      case 'binary': {
        const a = this.constEval(e.left)
        const b = this.constEval(e.right)
        switch (e.op) {
          case '+':
            return a + b
          case '-':
            return a - b
          case '*':
            return a * b
          case '/':
            return b === 0 ? 0 : Math.trunc(a / b)
          case '%':
            return b === 0 ? 0 : a - Math.trunc(a / b) * b
          default:
            return 0
        }
      }
      default:
        throw new CppRunError(e.line, `第 ${e.line} 行：柜子个数必须是一个固定的数字`)
    }
  }

  // ---------- 表达式求值 ----------
  private evalExpr(e: Expr, trace: boolean): CppValue {
    switch (e.kind) {
      case 'num':
        return { t: e.isFloat ? 'double' : 'int', v: e.value }
      case 'str':
        return { t: 'str', s: e.value }
      case 'endl':
        return { t: 'endl' }
      case 'var': {
        const v = this.readVar(e.name, e.line)
        if (v.kind === 'array') {
          throw new CppRunError(e.line, syntaxText.assignToArray(e.line, e.name))
        }
        return { t: v.type, v: v.value }
      }
      case 'index':
        return this.readIndex(e, trace)
      case 'unary': {
        const inner = this.evalExpr(e.expr, trace)
        const n = this.asNumber(inner, e.line)
        if (e.op === '!') return { t: 'int', v: n.v === 0 ? 1 : 0 }
        if (e.op === '-') return { t: n.t, v: -n.v }
        return { t: n.t, v: n.v }
      }
      case 'binary':
        return this.evalBinary(e, trace)
      case 'postfix': {
        // 独立的 i++ 表达式（不是在 for 的 step 位置时也应生效）
        const before = this.readLValue(e.target, e.line)
        const after = e.op === '++' ? before.value + 1 : before.value - 1
        this.writeLValue(e.target, coerce(before.type, after), e.line)
        return { t: before.type, v: before.value }
      }
      case 'prefix': {
        // ++i：先把盒子里的数改掉，再把新值交出去（这正是与 i++ 的区别）
        const before = this.readLValue(e.target, e.line)
        const after = e.op === '++' ? before.value + 1 : before.value - 1
        const written = coerce(before.type, after)
        this.writeLValue(e.target, written, e.line)
        return { t: before.type, v: written }
      }
      default:
        throw new CppRunError(0, '这一步我还不会算')
    }
  }

  private asNumber(v: CppValue, line: number): { t: CppScalarType; v: number } {
    if (v.t === 'str' || v.t === 'endl') {
      throw new CppRunError(line, `第 ${line} 行：文字不能拿来算数哦`)
    }
    return v
  }

  private evalBinary(e: Extract<Expr, { kind: 'binary' }>, trace: boolean): CppValue {
    // 逻辑短路
    if (e.op === '&&' || e.op === '||') {
      const l = this.asNumber(this.evalExpr(e.left, trace), e.line)
      const lb = l.v !== 0
      if (e.op === '&&' && !lb) return { t: 'int', v: 0 }
      if (e.op === '||' && lb) return { t: 'int', v: 1 }
      const r = this.asNumber(this.evalExpr(e.right, trace), e.line)
      return { t: 'int', v: r.v !== 0 ? 1 : 0 }
    }

    const a = this.asNumber(this.evalExpr(e.left, trace), e.line)
    const b = this.asNumber(this.evalExpr(e.right, trace), e.line)

    switch (e.op) {
      case '+':
        return { t: promote(a.t, b.t), v: a.v + b.v }
      case '-':
        return { t: promote(a.t, b.t), v: a.v - b.v }
      case '*':
        return { t: promote(a.t, b.t), v: a.v * b.v }
      case '/': {
        if (b.v === 0) throw new CppRunError(e.line, syntaxText.divideByZero(e.line))
        const t = promote(a.t, b.t)
        return { t, v: isIntType(t) ? Math.trunc(a.v / b.v) : a.v / b.v }
      }
      case '%': {
        if (b.v === 0) throw new CppRunError(e.line, syntaxText.divideByZero(e.line))
        return { t: promote(shorter(a.t), shorter(b.t)), v: a.v - Math.trunc(a.v / b.v) * b.v }
      }
      case '<':
        return { t: 'int', v: a.v < b.v ? 1 : 0 }
      case '<=':
        return { t: 'int', v: a.v <= b.v ? 1 : 0 }
      case '>':
        return { t: 'int', v: a.v > b.v ? 1 : 0 }
      case '>=':
        return { t: 'int', v: a.v >= b.v ? 1 : 0 }
      case '==':
        return { t: 'int', v: a.v === b.v ? 1 : 0 }
      case '!=':
        return { t: 'int', v: a.v !== b.v ? 1 : 0 }
      default:
        throw new CppRunError(e.line, `第 ${e.line} 行的运算符我还不会算`)
    }
  }

  /** 下标读取（可产生 array-read 帧） */
  private readIndex(e: Extract<Expr, { kind: 'index' }>, trace: boolean): CppValue {
    const v = this.readVar(e.name, e.line)
    if (v.kind !== 'array') {
      throw new CppRunError(e.line, `第 ${e.line} 行：${e.name} 不是一排柜子，不能用方括号`)
    }
    if (e.indices.length !== v.dims.length) {
      throw new CppRunError(
        e.line,
        `第 ${e.line} 行：${e.name} 需要 ${v.dims.length} 个编号，现在写了 ${e.indices.length} 个`,
      )
    }
    const idx = e.indices.map((ie) => Math.trunc(this.asNumber(this.evalExpr(ie, false), e.line).v))
    const flat = this.flatIndex(e.name, v, idx, e.line)
    const value = v.data[flat] ?? 0
    if (trace) {
      this.emit(
        'array-read',
        e.line,
        `打开 ${e.name}[${idx.join('][')}]，取出 ${formatNumber(v.type, value)}`,
        { varName: e.name, arrayIndex: idx },
      )
    }
    return { t: v.type, v: value }
  }

  private flatIndex(name: string, v: ArrayVar, idx: number[], line: number): number {
    if (v.dims.length === 1) {
      const n = v.dims[0]!
      if (idx[0]! < 0 || idx[0]! >= n) {
        throw new CppRunError(line, syntaxText.indexRange(line, name, idx[0]!, n))
      }
      return idx[0]!
    }
    const rows = v.dims[0]!
    const cols = v.dims[1]!
    if (idx[0]! < 0 || idx[0]! >= rows) {
      throw new CppRunError(
        line,
        `第 ${line} 行：${name} 只有 ${rows} 排（0 到 ${rows - 1}），没有第 ${idx[0]} 排`,
      )
    }
    if (idx[1]! < 0 || idx[1]! >= cols) {
      throw new CppRunError(
        line,
        `第 ${line} 行：${name} 每排只有 ${cols} 个座位（0 到 ${cols - 1}），没有 ${idx[1]} 号`,
      )
    }
    return idx[0]! * cols + idx[1]!
  }

  private readLValue(target: Expr, line: number): { type: CppScalarType; value: number } {
    if (target.kind === 'var') {
      const v = this.readVar(target.name, line)
      if (v.kind === 'array') throw new CppRunError(line, syntaxText.assignToArray(line, target.name))
      return { type: v.type, value: v.value }
    }
    if (target.kind === 'index') {
      const v = this.readVar(target.name, line)
      if (v.kind !== 'array') {
        throw new CppRunError(line, `第 ${line} 行：${target.name} 不是一排柜子`)
      }
      const idx = target.indices.map((ie) =>
        Math.trunc(this.asNumber(this.evalExpr(ie, false), line).v),
      )
      const flat = this.flatIndex(target.name, v, idx, line)
      return { type: v.type, value: v.data[flat] ?? 0 }
    }
    throw new CppRunError(line, `第 ${line} 行：这里不能放东西`)
  }

  private writeLValue(target: Expr, value: number, line: number): void {
    if (target.kind === 'var') {
      const v = this.readVar(target.name, line)
      if (v.kind === 'array') throw new CppRunError(line, syntaxText.assignToArray(line, target.name))
      v.value = coerce(v.type, value)
      this.markChanged(target.name)
      return
    }
    if (target.kind === 'index') {
      const v = this.readVar(target.name, line)
      if (v.kind !== 'array') {
        throw new CppRunError(line, `第 ${line} 行：${target.name} 不是一排柜子`)
      }
      const idx = target.indices.map((ie) =>
        Math.trunc(this.asNumber(this.evalExpr(ie, false), line).v),
      )
      const flat = this.flatIndex(target.name, v, idx, line)
      v.data[flat] = coerce(v.type, value)
      this.markChanged(target.name)
      return
    }
    throw new CppRunError(line, `第 ${line} 行：这里不能存东西`)
  }

  /** 生成用于展示的表达式文本（条件岔路用） */
  private describe(e: Expr): string {
    switch (e.kind) {
      case 'num':
        return String(e.value)
      case 'str':
        return `"${e.value}"`
      case 'endl':
        return 'endl'
      case 'var':
        return e.name
      case 'index':
        return `${e.name}[${e.indices.map((i) => this.describe(i)).join('][')}]`
      case 'unary':
        return `${e.op}${this.describe(e.expr)}`
      case 'binary':
        return `${this.describe(e.left)} ${e.op} ${this.describe(e.right)}`
      case 'postfix':
        return `${this.describe(e.target)}${e.op}`
      case 'prefix':
        return `${e.op}${this.describe(e.target)}`
      default:
        return ''
    }
  }

  /** 左值拆解：varName 用于高亮哪个盒子/柜子，label 用于念出来的文案 */
  private lvalue(target: Expr): { varName: string; label: string } {
    if (target.kind === 'var') return { varName: target.name, label: target.name }
    if (target.kind === 'index') {
      const idx = target.indices.map((i) => this.describe(i)).join('][')
      return { varName: target.name, label: `${target.name}[${idx}]` }
    }
    return { varName: '', label: this.describe(target) }
  }

  /** 取变量当前值文本，用于「i=3」这类备注 */
  private varText(name: string): string {
    const v = this.vars.get(name)
    if (!v) return ''
    if (v.kind === 'scalar') return formatNumber(v.type, v.value)
    return '…'
  }

  private firstDeclName(s: Stmt | null): string | null {
    if (!s) return null
    if (s.kind === 'decl') return s.name
    if (s.kind === 'incdec') {
      return s.target.kind === 'var' ? s.target.name : null
    }
    return null
  }

  // ---------- 语句执行 ----------
  private execStmt(s: Stmt, ctx: StmtCtx): void {
    if (this.returned) return
    switch (s.kind) {
      case 'empty':
        return
      case 'block':
        for (const inner of s.body) {
          this.execStmt(inner, ctx === 'normal' ? 'normal' : ctx)
          if (this.returned) return
        }
        return
      case 'decl':
        this.execDecl(s, ctx)
        return
      case 'assign':
        this.execAssign(s)
        return
      case 'incdec':
        this.execIncDec(s, ctx)
        return
      case 'if':
        this.execIf(s)
        return
      case 'for':
        this.execFor(s)
        return
      case 'cout':
        this.execCout(s)
        return
      case 'cin':
        this.execCin(s)
        return
      case 'return':
        this.emit('return', s.line, '程序走完了，报告「一切正常」')
        this.returned = true
        return
      default:
        return
    }
  }

  private execDecl(s: Extract<Stmt, { kind: 'decl' }>, ctx: StmtCtx): void {
    if (s.dims.length > 0) {
      const dims = s.dims.map((d) => this.constEval(d))
      if (dims.length > 2) {
        throw new CppRunError(s.line, '第 ' + s.line + ' 行：柜子最多两层（一排，或者几排几号）')
      }
      const total = dims.reduce((a, b) => a * b, 1)
      if (total <= 0 || total > 100000) {
        throw new CppRunError(s.line, `第 ${s.line} 行：柜子的数量看起来不太对哦`)
      }
      const v: ArrayVar = {
        kind: 'array',
        type: s.type,
        dims: dims.length === 1 ? [dims[0]!] : [dims[0]!, dims[1]!],
        data: new Array<number>(total).fill(0),
      }
      this.vars.set(s.name, v)
      this.markChanged(s.name)
      const shape = dims.length === 1 ? `一排 ${dims[0]} 个格子` : `${dims[0]} 排 × ${dims[1]} 号`
      const action = ctx === 'loop-init' ? 'loop-init' : 'declare'
      this.emit(action, s.line, `摆好了一排储物柜「${s.name}」（${shape}）`, {
        varName: s.name,
      })
      return
    }

    const raw = s.init ? this.asNumber(this.evalExpr(s.init, true), s.line).v : 0
    const value = coerce(s.type, raw)
    this.vars.set(s.name, { kind: 'scalar', type: s.type, value })
    this.markChanged(s.name)
    const action: Frame['action'] =
      ctx === 'loop-init' ? 'loop-init' : ctx === 'loop-step' ? 'loop-step' : 'declare'
    this.emit(action, s.line, `新盒子「${s.name}」出现了，里面装着 ${formatNumber(s.type, value)}`, {
      varName: s.name,
    })
  }

  private execAssign(s: Extract<Stmt, { kind: 'assign' }>): void {
    const raw = this.asNumber(this.evalExpr(s.value, true), s.line).v
    const before = this.readLValue(s.target, s.line)
    const after = coerce(before.type, raw)

    if (s.target.kind === 'index') {
      const idx = s.target.indices.map((ie) =>
        Math.trunc(this.asNumber(this.evalExpr(ie, false), s.line).v),
      )
      this.writeLValue(s.target, after, s.line)
      this.emit(
        'array-write',
        s.line,
        `把 ${formatNumber(before.type, after)} 放进 ${s.target.name}[${idx.join('][')}]`,
        { varName: s.target.name, arrayIndex: idx },
      )
      return
    }

    const name = s.target.kind === 'var' ? s.target.name : ''
    if (before.value === after) {
      this.writeLValue(s.target, after, s.line)
      this.emit('assign', s.line, `${name} 还是 ${formatNumber(before.type, after)}，没有变`, {
        varName: name,
      })
      return
    }
    this.writeLValue(s.target, after, s.line)
    this.emit(
      'assign',
      s.line,
      `${name} 从 ${formatNumber(before.type, before.value)} 变成 ${formatNumber(before.type, after)} 了`,
      { varName: name },
    )
  }

  private execIncDec(s: Extract<Stmt, { kind: 'incdec' }>, ctx: StmtCtx): void {
    const before = this.readLValue(s.target, s.line)
    const after = s.op === '++' ? before.value + 1 : before.value - 1
    this.writeLValue(s.target, after, s.line)
    const { varName, label } = this.lvalue(s.target)
    const word = s.op === '++' ? '往上加 1' : '往下减 1'
    const action: Frame['action'] = ctx === 'loop-step' ? 'loop-step' : 'assign'
    this.emit(
      action,
      s.line,
      `${label} ${word}，现在是 ${formatNumber(before.type, coerce(before.type, after))}`,
      { varName },
    )
  }

  private execIf(s: Extract<Stmt, { kind: 'if' }>): void {
    const cond = this.asNumber(this.evalExpr(s.cond, true), s.line)
    const truthy = cond.v !== 0
    const text = this.describe(s.cond)
    this.emit(
      'cond',
      s.line,
      truthy ? `「${text}」成立，走里面这条路` : `「${text}」不成立，跳过里面`,
      { compare: { expr: text, value: truthy } },
    )
    if (truthy) this.execStmt(s.then, 'normal')
    else if (s.else) this.execStmt(s.else, 'normal')
  }

  private execFor(s: Extract<Stmt, { kind: 'for' }>): void {
    if (s.init) this.execStmt(s.init, 'loop-init')
    const counterName = this.firstDeclName(s.init) ?? this.firstDeclName(s.step)
    const info: LoopInfo = {
      line: s.line,
      round: 0,
      depth: this.loopStack.length + 1,
      ...(counterName ? { counter: `${counterName}=${this.varText(counterName)}` } : {}),
    }
    this.loopStack.push(info)

    for (;;) {
      if (this.returned) break
      const top = this.loopStack[this.loopStack.length - 1]!
      if (counterName) top.counter = `${counterName}=${this.varText(counterName)}`

      const condTrue = s.cond
        ? this.asNumber(this.evalExpr(s.cond, true), s.line).v !== 0
        : true
      const condText = s.cond ? this.describe(s.cond) : '一直转'
      this.emit(
        'loop-test',
        s.line,
        condTrue
          ? `第 ${top.round + 1} 圈开始：${condText} 成立，继续转`
          : `${condText} 不成立，这一层转圈结束`,
        { compare: { expr: condText, value: condTrue } },
      )
      if (!condTrue) break

      this.execStmt(s.body, 'normal')
      if (this.returned) break

      if (s.step) this.execStmt(s.step, 'loop-step')
      top.round += 1
      if (counterName) top.counter = `${counterName}=${this.varText(counterName)}`
    }
    this.loopStack.pop()
  }

  private execCout(s: Extract<Stmt, { kind: 'cout' }>): void {
    let added = ''
    for (const part of s.parts) {
      if (part.kind === 'endl') {
        added += '\n'
        continue
      }
      if (part.kind === 'str') {
        added += part.value
        continue
      }
      const v = this.asNumber(this.evalExpr(part, true), s.line)
      added += formatNumber(v.t, v.v)
    }
    this.stdout += added
    const shown = added.replace(/\n/g, '⏎').trim() || '（空）'
    this.emit('output', s.line, `对着话筒念出「${shown}」`)
  }

  private execCin(s: Extract<Stmt, { kind: 'cin' }>): void {
    for (const target of s.targets) {
      if (this.inputPos >= this.input.length) {
        throw new CppRunError(s.line, syntaxText.notEnoughInput(s.line))
      }
      const raw = this.input[this.inputPos++]!
      const before = this.readLValue(target, s.line)
      this.writeLValue(target, coerce(before.type, raw), s.line)
      const { varName, label } = this.lvalue(target)
      this.emit('input', s.line, `收到一张纸条，上面写着 ${raw}，放进 ${label} 里`, {
        varName,
      })
    }
  }

  run(program: Program): RunResult {
    try {
      this.execStmt({ kind: 'block', body: program.body, line: 1 }, 'normal')
      if (this.frames.length === 0) {
        this.emit('note', program.body[0]?.line ?? 1, '程序里还没有可以做的事情')
      }
      return {
        ok: true,
        frames: this.frames,
        stdout: this.stdout,
        steps: this.steps,
        inputsUsed: this.inputPos,
      }
    } catch (err) {
      return {
        ok: false,
        frames: this.frames,
        stdout: this.stdout,
        steps: this.steps,
        inputsUsed: this.inputPos,
        error: toCppError(err),
      }
    }
  }
}

/** 引擎唯一入口：跑一段 C++ 子集代码，返回可播放的帧序列 */
export function interpret(program: Program, testInput: number[] = []): RunResult {
  return new Interpreter(testInput).run(program)
}
