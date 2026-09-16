/**
 * engine/cpp/lexer.ts · 词法分析
 * 支持：数字（含小数）、标识符、字符串字面量、运算符、标点、关键字。
 * 预处理：丢弃以 # 开头的预处理指令行（保留行号占位，保证报错行号准确）；
 *        同时丢弃行注释与块注释，因此考纲里带中文注释的程序也能正常读。
 */
import { CppRunError, syntaxText } from './errors'

export type TokenType = 'num' | 'id' | 'kw' | 'op' | 'punc' | 'str' | 'eof'

export interface Token {
  type: TokenType
  value: string
  line: number
  col: number
}

const KEYWORDS = new Set([
  'int', 'long', 'float', 'double',
  'if', 'else', 'for',
  'return', 'void', 'using', 'namespace',
  'cin', 'cout', 'endl',
  'const', 'char', 'bool', 'true', 'false',
  'break', 'continue',
])

/** 引擎刻意不支持的语法（给出儿童化提示而非莫名报错） */
export const UNSUPPORTED_KEYWORDS: Record<string, string> = {
  while: 'for',
  do: 'for',
  switch: 'if',
  case: 'if',
  class: 'int',
  struct: 'int',
  new: 'int',
  delete: 'int',
  string: 'char',
  goto: 'for',
}

/** 多字符运算符，按长度倒序匹配 */
const OPERATORS = [
  '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '++', '--',
  '+', '-', '*', '/', '%', '<', '>', '=', '!',
]

const PUNCT = ['(', ')', '{', '}', '[', ']', ';', ',']

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}
function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
}
function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch)
}

/** 去掉预处理指令行与注释，但保留行号结构 */
function stripPreprocessor(src: string): string {
  return src
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => (/^\s*#/.test(line) ? '' : line))
    .join('\n')
}

export interface LexResult {
  tokens: Token[]
  /** 每个行列号对应的原始行文本，供代码高亮使用 */
  lines: string[]
}

export function lex(src: string): LexResult {
  const clean = stripPreprocessor(src)
  const lines = clean.split('\n')
  const tokens: Token[] = []

  let i = 0
  let line = 1
  let col = 1

  const push = (type: TokenType, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c })
  }

  while (i < clean.length) {
    const ch = clean[i]!

    if (ch === '\n') {
      i++
      line++
      col = 1
      continue
    }
    if (ch === ' ' || ch === '\t') {
      i++
      col++
      continue
    }
    // 行注释
    if (ch === '/' && clean[i + 1] === '/') {
      while (i < clean.length && clean[i] !== '\n') i++
      continue
    }
    // 块注释
    if (ch === '/' && clean[i + 1] === '*') {
      const startLine = line
      i += 2
      col += 2
      let closed = false
      while (i < clean.length) {
        if (clean[i] === '\n') {
          line++
          col = 1
          i++
          continue
        }
        if (clean[i] === '*' && clean[i + 1] === '/') {
          i += 2
          col += 2
          closed = true
          break
        }
        i++
        col++
      }
      if (!closed) throw new CppRunError(startLine, '有一段注释没有收尾，少了「*/」')
      continue
    }
    // 字符串
    if (ch === '"') {
      const startLine = line
      const startCol = col
      i++
      col++
      let value = ''
      let closed = false
      while (i < clean.length) {
        if (clean[i] === '"') {
          i++
          col++
          closed = true
          break
        }
        if (clean[i] === '\n') break
        value += clean[i]
        i++
        col++
      }
      if (!closed) throw new CppRunError(startLine, `第 ${startLine} 行的引号「"」只写了一半`)
      push('str', value, startLine, startCol)
      continue
    }
    // 数字
    if (isDigit(ch)) {
      const startLine = line
      const startCol = col
      let text = ''
      while (i < clean.length && isDigit(clean[i]!)) {
        text += clean[i]
        i++
        col++
      }
      if (clean[i] === '.' && isDigit(clean[i + 1] ?? '')) {
        text += '.'
        i++
        col++
        while (i < clean.length && isDigit(clean[i]!)) {
          text += clean[i]
          i++
          col++
        }
      }
      push('num', text, startLine, startCol)
      continue
    }
    // 标识符 / 关键字
    if (isIdentStart(ch)) {
      const startLine = line
      const startCol = col
      let text = ''
      while (i < clean.length && isIdentPart(clean[i]!)) {
        text += clean[i]
        i++
        col++
      }
      if (UNSUPPORTED_KEYWORDS[text]) {
        throw new CppRunError(
          startLine,
          syntaxText.unsupported(startLine, text, UNSUPPORTED_KEYWORDS[text]!),
        )
      }
      push(KEYWORDS.has(text) ? 'kw' : 'id', text, startLine, startCol)
      continue
    }
    // 运算符
    const op = OPERATORS.find((o) => clean.startsWith(o, i))
    if (op) {
      push('op', op, line, col)
      i += op.length
      col += op.length
      continue
    }
    // 标点
    if (PUNCT.includes(ch)) {
      push('punc', ch, line, col)
      i++
      col++
      continue
    }

    throw new CppRunError(
      line,
      `第 ${line} 行有一个我不认识的符号「${ch}」，是不是多打了？`,
    )
  }

  push('eof', '', line, col)
  return { tokens, lines }
}
