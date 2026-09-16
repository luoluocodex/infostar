/**
 * engine/cpp/errors.ts · 儿童化错误消息
 * 规则：不出现「语法错误 expected ';'」这类黑话；一句话说清「第几行」+「哪里不对」+「怎么办」。
 * 口径依据：docs/guides/05-术语勘误与小学化对照表.md §4。
 */
import type { CppError } from './types'

/** 引擎内部使用的可捕获错误（带源码行号） */
export class CppRunError extends Error {
  readonly line: number
  readonly friendly: string
  readonly detail?: string

  constructor(line: number, friendly: string, detail?: string) {
    super(`${friendly}${detail ? ` | ${detail}` : ''}`)
    this.name = 'CppRunError'
    this.line = line
    this.friendly = friendly
    this.detail = detail
  }

  toCppError(): CppError {
    return { line: this.line, message: this.friendly, ...(this.detail ? { detail: this.detail } : {}) }
  }
}

/** 常用措辞集中在此，避免散落在各处导致口径不一 */
export const syntaxText = {
  missingSemicolon: (line: number) => `第 ${line} 行好像少了一个分号「;」`,
  missingParen: (line: number) => `第 ${line} 行的括号好像没有配成对`,
  missingBrace: (line: number) => `第 ${line} 行的花括号「{ }」好像没有配成对`,
  unknownWord: (line: number, word: string) =>
    `第 ${line} 行的「${word}」我不太认识，是不是拼错了？`,
  unsupported: (line: number, word: string, alt: string) =>
    `第 ${line} 行用了还没学到的「${word}」，先用「${alt}」试试吧`,
  divideByZero: (line: number) => `第 ${line} 行在算 除以 0，0 不能当除数哦`,
  noMain: () => '程序里好像少了「int main( ) { }」这个大门，从这儿才能进去',
  indexRange: (line: number, name: string, idx: number, size: number) =>
    `第 ${line} 行：第 ${idx} 号柜子不存在，${name} 一共只有 ${size} 个格子（编号 0 到 ${size - 1}）`,
  notEnoughInput: (line: number) => `第 ${line} 行还想再要一个数字，可是题目给的数字已经用完啦`,
  tooManySteps: () => '这个循环好像跑不完哦，要不要检查一下循环的次数？',
  notANumber: (line: number, name: string) => `第 ${line} 行：「${name}」里装的不是数字，没法这样算`,
  assignToArray: (line: number, name: string) =>
    `第 ${line} 行：${name} 是一排柜子，不能整个装进一个数字里`,
} as const

export function toCppError(err: unknown): CppError {
  if (err instanceof CppRunError) return err.toCppError()
  return {
    line: 0,
    message: '这段程序好像有点小问题，我们再检查一下',
    detail: err instanceof Error ? err.message : String(err),
  }
}
