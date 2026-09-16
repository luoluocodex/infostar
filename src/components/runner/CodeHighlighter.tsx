/**
 * components/runner/CodeHighlighter.tsx · 代码着色 + 当前行高亮
 * 轻量正则着色（构建期零依赖、运行时可忽略不计），当前执行行有明显标志。
 */
import { Fragment } from 'react'
import { zh } from '@/i18n/zh'

const TOKEN_RE =
  /(\/\/[^\n]*)|("[^"]*")|(\b(?:int|long|float|double|if|else|for|return|using|namespace|void|const|cin|cout|endl|main|std)\b)|(\b\d+(?:\.\d+)?\b)/g

const COLORS = {
  comment: '#9c8a78',
  string: '#8fd2a6',
  keyword: '#f0b131',
  number: '#7fd3dd',
  plain: '#f6ead9',
}

function highlightLine(line: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) {
      nodes.push(<Fragment key={`${keyPrefix}-t${last}`}>{line.slice(last, m.index)}</Fragment>)
    }
    const color = m[1]
      ? COLORS.comment
      : m[2]
        ? COLORS.string
        : m[3]
          ? COLORS.keyword
          : COLORS.number
    nodes.push(
      <span key={`${keyPrefix}-m${m.index}`} style={{ color, fontWeight: m[3] ? 700 : 400 }}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < line.length) {
    nodes.push(<Fragment key={`${keyPrefix}-e`}>{line.slice(last)}</Fragment>)
  }
  return nodes
}

export interface CodeHighlighterProps {
  code: string
  /** 当前执行到的行（1 起） */
  activeLine?: number
  /** 是否显示行号 */
  showLineNumbers?: boolean
  className?: string
}

export function CodeHighlighter({
  code,
  activeLine,
  showLineNumbers = true,
  className = '',
}: CodeHighlighterProps) {
  const lines = code.replace(/\r\n?/g, '\n').split('\n')

  return (
    <div
      className={`code-block ${className}`}
      role="figure"
      aria-label={zh.question.codeAria}
      data-testid="code-block"
    >
      <div className="min-w-fit">
        {lines.map((line, i) => {
          const lineNo = i + 1
          const active = activeLine === lineNo
          return (
            <span
              key={lineNo}
              className={`code-line ${active ? 'code-line-active' : ''}`}
              data-line={lineNo}
              data-active={active || undefined}
            >
              {showLineNumbers && (
                <span
                  className="num mr-3 inline-block w-[1.6em] select-none text-right"
                  style={{ color: active ? '#f0b131' : 'rgba(246,234,217,0.34)' }}
                >
                  {lineNo}
                </span>
              )}
              {line.length === 0 ? '\u00a0' : highlightLine(line, `l${lineNo}`)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
