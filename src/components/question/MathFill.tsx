/**
 * components/question/MathFill.tsx · 数学填空（手机数字键盘）
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MathFillPayloadSchema } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { matchNumeric } from '@/engine/grade'
import { useAnimated } from '../common/primitives'
import { haptic } from '@/store/settings'
import { NumberPad } from './NumberPad'
import type { QuestionProps } from './types'
import { useAnswerFlow } from './useAnswerFlow'

export function MathFill({ level, locked, onSubmit, onInteract }: QuestionProps) {
  const animated = useAnimated()
  const payload = useMemo(() => MathFillPayloadSchema.safeParse(level.payload), [level.payload])
  const [value, setValue] = useState('')
  const flow = useAnswerFlow(onSubmit)
  const disabled = locked || flow.solved || flow.revealed

  if (!payload.success) return null
  const unit = payload.data.unit ?? ''
  const answer = String(level.answer)

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.fillHint}</p>

      <motion.div
        className="flex items-center justify-center gap-2 rounded-[var(--r-md)] border-2 px-4 py-3"
        style={{
          minHeight: 76,
          borderColor: flow.justWrong
            ? 'var(--c-danger)'
            : flow.solved || flow.revealed
              ? 'var(--c-leaf)'
              : 'var(--c-brand)',
          background: flow.solved || flow.revealed ? '#e2f2e7' : 'var(--c-surface)',
        }}
        animate={animated && flow.justWrong ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
        data-testid="fill-display"
      >
        <span className="num text-[36px] font-bold leading-none">
          {value || <span className="text-[22px] text-ink-faint">?</span>}
        </span>
        {unit && <span className="text-[16px] font-bold text-ink-soft">{unit}</span>}
        {value && (
          <span
            className="ml-1 h-6 w-[3px] animate-pulse rounded-full"
            style={{ background: 'var(--c-brand)' }}
            aria-hidden="true"
          />
        )}
      </motion.div>

      <NumberPad
        value={value}
        onChange={(v) => {
          onInteract?.()
          setValue(v)
        }}
        disabled={disabled}
      />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={disabled || value.trim() === ''}
          onClick={() => {
            haptic(12)
            onInteract?.()
            flow.attempt(matchNumeric(value, answer))
          }}
          data-testid="submit-answer"
        >
          {zh.level.submit}
        </button>
        {flow.canReveal && (
          <button type="button" className="btn btn-ghost" onClick={flow.reveal}>
            {zh.question.reveal}
          </button>
        )}
      </div>

      {flow.justWrong && (
        <p className="text-[15px] font-bold" style={{ color: 'var(--c-danger)' }} role="status">
          {zh.level.wrong}　{zh.level.wrongKept}
        </p>
      )}
    </div>
  )
}
