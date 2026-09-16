/**
 * engine/cpp/index.ts · C++ 子集解释器对外入口
 * 只暴露三个能力：干活（runCpp）、数 cin 要几个数（countInputReads）、自检（checkCode）。
 */
import { parse } from './parser'
import { interpret } from './interpreter'
import type { Program, Stmt } from './ast'
import type { RunResult } from './types'
import { toCppError } from './errors'
import type { CppError } from './types'

export { MAX_STEPS, formatNumber } from './interpreter'
export { lex } from './lexer'
export { parse } from './parser'
export { interpret } from './interpreter'
export { CppRunError, syntaxText, toCppError } from './errors'
export type { Frame, FrameAction, FrameHighlight, LoopInfo, RunResult, VarSnapshot, CppError } from './types'
export type { Expr, Program, Stmt } from './ast'

/** 跑一段 C++ 子集代码。解析失败也会返回 ok:false + 儿童化错误，不抛异常。 */
export function runCpp(code: string, testInput: number[] = []): RunResult {
  let program: Program
  try {
    program = parse(code).program
  } catch (err) {
    return { ok: false, frames: [], stdout: '', steps: 0, inputsUsed: 0, error: toCppError(err) }
  }
  return interpret(program, testInput)
}

/** 数一数程序一共会读几个数（用于校验约定 G1：testInput 不多不少） */
export function countInputReads(program: Program): number {
  let n = 0
  const walk = (s: Stmt): void => {
    switch (s.kind) {
      case 'cin':
        n += s.targets.length
        return
      case 'block':
        s.body.forEach(walk)
        return
      case 'if':
        walk(s.then)
        if (s.else) walk(s.else)
        return
      case 'for':
        if (s.init) walk(s.init)
        walk(s.body)
        if (s.step) walk(s.step)
        return
      default:
        return
    }
  }
  program.body.forEach(walk)
  return n
}

export interface CodeCheck {
  ok: boolean
  actual: string
  expected: string
  inputCount: number
  error?: CppError
}

/**
 * 构建期 / 运行时自检：引擎输出与 expectedStdout 是否逐字符一致。
 * inputCount 取「真跑一遍实际吃了几个数」——循环体里的 cin 也数得准（约定 G1）。
 * 程序中途报错时退回静态统计，保证错误信息里仍能给出有意义的数字。
 */
export function checkCode(
  code: string,
  testInput: number[],
  expectedStdout: string,
): CodeCheck {
  let program: Program
  try {
    program = parse(code).program
  } catch (err) {
    return {
      ok: false,
      actual: '',
      expected: expectedStdout,
      inputCount: 0,
      error: toCppError(err),
    }
  }
  const result = interpret(program, testInput)
  const inputCount = result.ok ? result.inputsUsed : countInputReads(program)
  if (!result.ok) {
    return {
      ok: false,
      actual: result.stdout,
      expected: expectedStdout,
      inputCount,
      error: result.error,
    }
  }
  return {
    ok: result.stdout === expectedStdout,
    actual: result.stdout,
    expected: expectedStdout,
    inputCount,
  }
}
