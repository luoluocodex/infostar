/**
 * components/question/manip/VarBoxCanvas.tsx · 会变的盒子（变量）
 * 把数字拖进盒子（手机：长按拖动；也可点数字再点盒子），体验「名字不变、值可以换」。
 */
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { Icon } from '../../common/Icon'
import { useAnimated } from '../../common/primitives'
import { useLongPressDrag } from '../../pointer/useLongPressDrag'
import { haptic } from '@/store/settings'
import type { CanvasProps } from './types'

export function VarBoxCanvas({ level, locked, onSubmit, onInteract }: CanvasProps) {
  const animated = useAnimated()
  const payload = level.payload as { init?: { name?: string; value?: number } }
  const name = String(payload.init?.name ?? 'a')
  const first = Number(payload.init?.value ?? 5)
  const answerObj = (level.answer ?? {}) as { value?: number }
  const target = Number(answerObj.value ?? 8)

  const tokens = useMemo(() => [first, target], [first, target])

  const [history, setHistory] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const justDragged = useRef(false)

  const boxValue = history.length > 0 ? history[history.length - 1]! : null
  const disabled = locked || solved

  const place = (v: number) => {
    if (disabled) return
    onInteract?.()
    haptic(14)
    const next = [...history, v]
    setHistory(next)
    setSelected(null)
    setMessage(null)
    const done = next.includes(first) && next[next.length - 1] === target
    if (done) {
      setSolved(true)
      onSubmit({
        subs: [
          { id: 'cp1', correct: next[0] === first },
          { id: 'cp2', correct: next[next.length - 1] === target },
        ],
        allCorrect: true,
      })
    }
  }

  const drag = useLongPressDrag({
    enabled: !disabled,
    onDrop: (targetId, itemId) => {
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 260)
      if (targetId === 'box') place(Number(itemId))
    },
  })

  const cpDone1 = history.includes(first)
  const cpDone2 = history.length > 0 && history[history.length - 1] === target

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.varBoxHint}</p>

      {/* ---------- 盒子 ---------- */}
      <motion.div
        data-drop-id="box"
        onClick={() => {
          if (disabled || justDragged.current) return
          if (selected === null) {
            setMessage(zh.question.varBoxPrompt)
            return
          }
          place(selected)
        }}
        className="relative mx-auto w-full max-w-[300px] rounded-[var(--r-md)] border-2 px-4 py-4"
        style={{
          borderColor: drag.hoverId === 'box' ? 'var(--c-accent)' : 'var(--c-line-strong)',
          background: drag.hoverId === 'box' ? 'var(--c-accent-soft)' : 'var(--c-surface)',
          borderStyle: boxValue === null ? 'dashed' : 'solid',
          boxShadow: 'var(--sh-card)',
        }}
        animate={animated && solved ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.42 }}
      >
        <div
          className="absolute -top-3 left-4 rounded-full px-2.5 py-[2px] text-[12px] font-bold"
          style={{ background: 'var(--c-brand)', color: '#fff' }}
        >
          {zh.question.varBoxName}：{name}
        </div>
        <div className="text-center">
          <div className="text-[11px] font-bold text-ink-faint">{zh.question.varBoxValue}</div>
          {boxValue === null ? (
            <div className="mt-2 text-[15px] font-bold text-ink-faint">{zh.question.varBoxDrop}</div>
          ) : (
            <motion.div
              key={boxValue}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="num mt-1 text-[54px] font-bold leading-none"
            >
              {boxValue}
            </motion.div>
          )}
        </div>
        {drag.hoverId === 'box' && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[var(--r-md)] border-[3px]"
            style={{ borderColor: 'var(--c-accent)' }}
          />
        )}
      </motion.div>

      {/* ---------- 数字积木 ---------- */}
      <div>
        <div className="mb-1.5 text-[13px] font-bold text-ink-soft">
          可以放进盒子的数字（点一下选中，再点盒子；或者长按拖过去）
        </div>
        <div className="flex gap-2">
          {tokens.map((v) => (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => drag.onPointerDown({ id: String(v), label: String(v) }, e)}
              onPointerMove={drag.onPointerMove}
              onPointerUp={drag.onPointerUp}
              onPointerCancel={drag.onPointerUp}
              onClick={() => {
                if (disabled || justDragged.current) return
                haptic(8)
                onInteract?.()
                setSelected((cur) => (cur === v ? null : v))
              }}
              className="num grid place-items-center rounded-[13px] border-2 px-5 text-[20px] font-bold"
              style={{
                minHeight: 52,
                minWidth: 84,
                background: selected === v ? 'var(--c-accent-soft)' : 'var(--c-brand-soft)',
                borderColor: selected === v ? 'var(--c-accent)' : 'var(--c-brand)',
                color: selected === v ? 'var(--c-accent-deep)' : 'var(--c-brand-deep)',
                touchAction: 'none',
              }}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || history.length === 0}
            onClick={() => {
              setHistory([])
              setMessage(null)
            }}
          >
            {zh.question.varBoxReset}
          </button>
        </div>
      </div>

      {/* ---------- 两个小关卡 ---------- */}
      <ul className="space-y-1.5">
        {[
          { id: 'cp1', text: zh.question.varBoxCheckpoint1, done: cpDone1 },
          { id: 'cp2', text: zh.question.varBoxCheckpoint2, done: cpDone2 },
        ].map((cp) => (
          <li key={cp.id} className="flex items-center gap-2 text-[14px]">
            <span
              className="grid h-5 w-5 place-items-center rounded-full"
              style={{
                background: cp.done ? 'var(--c-leaf)' : 'var(--c-surface-sunken)',
                color: cp.done ? '#fff' : 'var(--c-ink-faint)',
              }}
            >
              {cp.done ? <Icon name="check" size={12} /> : <span className="num text-[11px]">·</span>}
            </span>
            <span style={{ color: cp.done ? '#2f6a45' : 'var(--c-ink-soft)', fontWeight: cp.done ? 700 : 500 }}>
              {cp.text}
            </span>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[10px] px-3 py-2 text-[14px] font-bold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}
            role="status"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      {solved && (
        <p className="text-[15px] font-bold" style={{ color: '#2f6a45' }} role="status">
          {zh.question.varBoxDone(name)}
        </p>
      )}

      {/* 拖拽幽灵 */}
      <AnimatePresence>
        {drag.dragging && (
          <motion.div
            className="num pointer-events-none fixed z-[70] grid place-items-center rounded-[13px] border-2 px-5 text-[20px] font-bold"
            style={{
              left: drag.dragging.x - 42,
              top: drag.dragging.y - 26,
              minHeight: 52,
              minWidth: 84,
              background: 'var(--c-accent-soft)',
              borderColor: 'var(--c-accent)',
              color: 'var(--c-accent-deep)',
              boxShadow: 'var(--sh-lift)',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1.06 }}
            exit={{ opacity: 0, scale: 0.85 }}
            aria-hidden="true"
          >
            {drag.dragging.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
