/**
 * components/question/manip/CandyCanvas.tsx · 分糖果（整除）
 * 先真的分一次（动手），再回答「每人能整份拿到几颗」（抽象）。
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { matchNumeric } from '@/engine/grade'
import { useAnimated } from '../../common/primitives'
import { haptic } from '@/store/settings'
import { NumberPad } from '../NumberPad'
import { useAnswerFlow } from '../useAnswerFlow'
import type { CanvasProps } from './types'

function Dots({ n, tone }: { n: number; tone: 'candy' | 'left' }) {
  return (
    <div className="flex flex-wrap gap-[3px]">
      {Array.from({ length: n }, (_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.012 }}
          className="block rounded-full"
          style={{
            width: 12,
            height: 12,
            background: tone === 'candy' ? 'var(--c-accent)' : 'var(--c-ink-faint)',
            opacity: tone === 'candy' ? 1 : 0.5,
          }}
        />
      ))}
      {n === 0 && <span className="text-[12px] text-ink-faint">{zh.question.candyEmpty}</span>}
    </div>
  )
}

export function CandyCanvas({ level, locked, onSubmit, onInteract }: CanvasProps) {
  const animated = useAnimated()
  const payload = level.payload as {
    init?: { total?: number; groups?: number }
    goal?: string
  }
  const total = Number(payload.init?.total ?? 20)
  const groups = Number(payload.init?.groups ?? 3)

  const [remaining, setRemaining] = useState(total)
  const [each, setEach] = useState(0)
  const [phase, setPhase] = useState<'deal' | 'answer'>('deal')
  const [value, setValue] = useState('')
  const flow = useAnswerFlow(onSubmit)
  const disabled = locked || flow.solved || flow.revealed

  const dealt = total - remaining
  const dealtWhole = remaining < groups
  const eachFull = total % groups === 0 ? total / groups : Math.floor(total / groups)

  const dealRound = () => {
    if (disabled || dealtWhole) return
    onInteract?.()
    haptic(8)
    setRemaining((r) => r - groups)
    setEach((e) => e + 1)
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.candyHint}</p>

      <div
        className="rounded-[var(--r-md)] border px-3 py-3"
        style={{ borderColor: 'var(--c-line)', background: 'var(--c-surface)' }}
      >
        <div className="mb-2 text-[13px] font-bold text-ink-soft">
          {zh.question.candyBag(remaining, dealt)}
        </div>
        <Dots n={remaining} tone="left" />

        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${groups}, minmax(0,1fr))` }}>
          {Array.from({ length: groups }, (_, i) => (
            <motion.div
              key={i}
              className="rounded-[var(--r-sm)] border-2 border-dashed px-2 py-2"
              style={{ borderColor: 'var(--c-line-strong)', background: 'var(--c-surface-sunken)' }}
              animate={animated && each > 0 ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="mb-1 text-center text-[11px] font-bold text-ink-faint">
                {zh.question.candyPlate(i + 1)}
              </div>
              <Dots n={each} tone="candy" />
            </motion.div>
          ))}
        </div>
      </div>

      {phase === 'deal' ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn btn-primary col-span-1"
              disabled={disabled || dealtWhole}
              onClick={dealRound}
              data-testid="deal-one"
            >
              {zh.question.candyDeal}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={disabled || each === 0}
              onClick={() => {
                setRemaining(total)
                setEach(0)
              }}
            >
              {zh.question.candyReset}
            </button>
          </div>
          {dealtWhole && (
            <button
              type="button"
              className="btn btn-accent w-full"
              disabled={disabled}
              onClick={() => {
                haptic(12)
                setPhase('answer')
              }}
              data-testid="go-answer"
            >
              {zh.question.candyDone}
            </button>
          )}
          {!dealtWhole && (
            <p className="text-[13px] text-ink-faint">{zh.question.candyRoundLeft(remaining)}</p>
          )}
        </>
      ) : (
        <div className="space-y-3 rounded-[var(--r-md)] border bg-surface p-3.5" style={{ borderColor: 'var(--c-line)' }}>
          <p className="text-[15px] font-bold">{zh.question.candyAnswer}</p>
          <div
            className="num flex items-center justify-center rounded-[var(--r-md)] border-2 px-4 py-3 text-[32px] font-bold"
            style={{
              minHeight: 68,
              borderColor: flow.solved ? 'var(--c-leaf)' : 'var(--c-brand)',
              background: flow.solved ? '#e2f2e7' : 'var(--c-surface-sunken)',
            }}
          >
            {value || <span className="text-[18px] text-ink-faint">?</span>}
            <span className="ml-1 text-[16px] text-ink-soft">{zh.question.candyUnit}</span>
          </div>
          <NumberPad
            value={value}
            onChange={(v) => {
              onInteract?.()
              setValue(v)
            }}
            disabled={disabled}
            maxLength={3}
          />
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={disabled || value === ''}
            onClick={() => {
              haptic(12)
              flow.attempt(matchNumeric(value, String(eachFull)))
            }}
            data-testid="submit-answer"
          >
            {zh.level.submit}
          </button>
          {flow.canReveal && (
            <button type="button" className="btn btn-ghost w-full" onClick={flow.reveal}>
              {zh.question.reveal}
            </button>
          )}
          <AnimatePresence>
            {flow.justWrong && (
              <motion.p
                className="text-[15px] font-bold"
                style={{ color: 'var(--c-danger)' }}
                role="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {zh.level.wrong}　{zh.level.wrongKept}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
