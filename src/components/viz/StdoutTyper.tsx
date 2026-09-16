/**
 * components/viz/StdoutTyper.tsx · 输出打字机（话筒）
 * 「对着话筒念出来」：逐字冒出，点一下可以跳过。
 */
import { useEffect, useRef, useState } from 'react'
import { zh } from '@/i18n/zh'

export interface StdoutTyperProps {
  /** 到当前帧为止的累计输出 */
  text: string
  /** 字号 */
  size?: number
  /** 是否正在播放（播放中才逐字打，单步时直接落到该帧） */
  typing?: boolean
}

const CHAR_MS = 34

export function StdoutTyper({ text, size = 22, typing = true }: StdoutTyperProps) {
  const [shown, setShown] = useState(text)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) {
      window.clearInterval(timer.current)
      timer.current = null
    }
    // 回退或跳帧：直接落到目标
    if (!typing || !text.startsWith(shown) || text.length < shown.length) {
      setShown(text)
      return
    }
    if (text.length === shown.length) return

    let i = shown.length
    timer.current = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length && timer.current) {
        window.clearInterval(timer.current)
        timer.current = null
      }
    }, CHAR_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
      timer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, typing])

  const skip = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    setShown(text)
  }

  const lines = shown.split('\n')

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span
          className="grid h-5 w-5 place-items-center rounded-full"
          style={{ background: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' }}
          aria-hidden="true"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9.5h3l4-3.2v11.4l-4-3.2H6z" />
          </svg>
        </span>
        <span className="text-[11px] font-bold text-ink-soft">{zh.viz.output}</span>
      </div>
      <button
        type="button"
        onClick={skip}
        className="block w-full rounded-[var(--r-md)] border px-3 py-2.5 text-left"
        style={{
          borderColor: 'var(--c-line)',
          background: 'var(--c-surface-sunken)',
          fontFamily: 'var(--font-mono)',
          fontSize: size,
          lineHeight: 1.45,
          minHeight: 56,
        }}
        aria-label={`${zh.viz.output}：${shown || zh.viz.outputEmpty}`}
      >
        {shown.length === 0 ? (
          <span className="text-[14px] text-ink-faint">{zh.viz.outputEmpty}</span>
        ) : (
          lines.map((l, i) => (
            <span key={i} className="block whitespace-pre-wrap break-all">
              {l.length === 0 ? '\u00a0' : l}
            </span>
          ))
        )}
      </button>
    </div>
  )
}
