/**
 * components/question/manip/StairsCanvas.tsx · 爬楼梯（递推入门）
 * 学生自己一步一步摆出走法；由学生判断「我找齐了」，系统再核对——避免直接把答案显示出来。
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { Icon } from '../../common/Icon'
import { useAnimated } from '../../common/primitives'
import { haptic } from '@/store/settings'
import type { CanvasProps } from './types'

/** 上 n 级楼梯的走法数：w[0]=1, w[1]=1, w[i]=w[i-1]+w[i-2] */
function waysTo(n: number): number {
  const w = [1, 1]
  for (let i = 2; i <= n; i++) w[i] = w[i - 1]! + w[i - 2]!
  return w[n] ?? 1
}

export function StairsCanvas({ level, locked, onSubmit, onInteract }: CanvasProps) {
  const animated = useAnimated()
  const init = level.payload as { init?: { steps?: number } }
  const steps = Number(init.init?.steps ?? 3)
  const total = useMemo(() => waysTo(steps), [steps])

  const [walk, setWalk] = useState<number[]>([])
  const [found, setFound] = useState<string[]>([])
  const [dup, setDup] = useState(0)
  const [premature, setPremature] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)

  const position = walk.reduce((a, b) => a + b, 0)
  const disabled = locked || solved

  const step = (n: number) => {
    if (disabled || position + n > steps) return
    onInteract?.()
    const next = [...walk, n]
    const pos = next.reduce((a, b) => a + b, 0)
    haptic(8)
    if (pos === steps) {
      const key = next.join('+')
      if (found.includes(key)) {
        setDup((d) => d + 1)
        setMessage(zh.question.stairsDup)
        haptic(20)
      } else {
        setFound((f) => [...f, key])
        setMessage(null)
        haptic(16)
      }
      setWalk([])
      return
    }
    setWalk(next)
    setMessage(null)
  }

  const checkDone = () => {
    if (disabled) return
    onInteract?.()
    if (found.length === total) {
      const credit = Math.max(0, Math.min(total, found.length - dup - premature))
      setSolved(true)
      onSubmit({
        subs: found.map((w, i) => ({ id: w, correct: i < credit })),
        allCorrect: true,
      })
      return
    }
    setPremature((p) => p + 1)
    haptic(20)
    setMessage(zh.question.stairsPremature)
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.stairsHint}</p>

      {/* ---------- 楼梯 ---------- */}
      <div
        className="relative overflow-hidden rounded-[var(--r-md)] border px-3 pb-3 pt-6"
        style={{ borderColor: 'var(--c-line)', background: 'linear-gradient(180deg,#fffdf8,#f8ecda)' }}
      >
        <div className="flex items-end justify-center gap-1.5">
          {Array.from({ length: steps }, (_, i) => {
            const reached = i < position
            const isNext = i === position
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="grid h-6 place-items-center">
                  {isNext && (
                    <motion.span
                      animate={animated ? { y: [0, -4, 0] } : {}}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ color: 'var(--c-accent-deep)' }}
                    >
                      <Icon name="flag" size={18} />
                    </motion.span>
                  )}
                </span>
                <div
                  className="grid place-items-end rounded-t-[8px] border-2 px-2 pb-1"
                  style={{
                    width: 46,
                    height: 30 + i * 18,
                    background: reached ? 'var(--c-accent-soft)' : 'var(--c-surface)',
                    borderColor: reached ? 'var(--c-accent)' : 'var(--c-line-strong)',
                  }}
                >
                  <span className="num text-[11px] font-bold text-ink-faint">{i + 1}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 当前走法 */}
        <div className="mt-3 flex min-h-[34px] flex-wrap items-center justify-center gap-1.5">
          {walk.length === 0 ? (
            <span className="text-[13px] text-ink-faint">{zh.question.stairsTapHint}</span>
          ) : (
            walk.map((w, i) => (
              <span
                key={i}
                className="num rounded-full px-2.5 py-[3px] text-[13px] font-bold"
                style={{ background: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' }}
              >
                {zh.question.stairsCross(w)}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ---------- 操作 ---------- */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || position + 1 > steps}
          onClick={() => step(1)}
          data-testid="step-1"
        >
          {zh.question.stairsCross(1)}
        </button>
        <button
          type="button"
          className="btn btn-accent"
          disabled={disabled || position + 2 > steps}
          onClick={() => step(2)}
          data-testid="step-2"
        >
          {zh.question.stairsCross(2)}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || walk.length === 0}
          onClick={() => {
            haptic(8)
            setWalk((w) => w.slice(0, -1))
          }}
        >
          {zh.question.stairsBack}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || walk.length === 0}
          onClick={() => setWalk([])}
        >
          {zh.question.stairsReset}
        </button>
      </div>

      {/* ---------- 已找到的走法 ---------- */}
      <div>
        <div className="mb-1.5 text-[13px] font-bold text-ink-soft">
          {zh.question.stairsFoundLabel(found.length)}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {found.length === 0 && (
            <span className="text-[13px] text-ink-faint">{zh.question.stairsNone}</span>
          )}
          {found.map((w) => (
            <motion.span
              key={w}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="num inline-flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[14px] font-bold"
              style={{ background: '#e2f2e7', color: '#2f6a45' }}
            >
              <Icon name="check" size={12} />
              {w.replace(/\+/g, ' + ')}
            </motion.span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[10px] px-3 py-2 text-[14px] font-bold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}
            role="status"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={disabled || found.length === 0}
        onClick={checkDone}
        data-testid="submit-answer"
      >
        {zh.question.stairsDone(found.length)}
      </button>
    </div>
  )
}
