/**
 * components/question/MathChoice.tsx · 数学选择
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MathChoicePayloadSchema } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'
import { haptic } from '@/store/settings'
import type { QuestionProps } from './types'
import { useAnswerFlow } from './useAnswerFlow'

export function MathChoice({ level, locked, onSubmit, onInteract }: QuestionProps) {
  const animated = useAnimated()
  const payload = useMemo(() => MathChoicePayloadSchema.safeParse(level.payload), [level.payload])
  const [selected, setSelected] = useState<string | null>(null)
  const flow = useAnswerFlow(onSubmit)
  const disabled = locked || flow.solved || flow.revealed

  if (!payload.success) return null
  const { options } = payload.data
  const answer = String(level.answer)
  const revealed = flow.revealed
  const solved = flow.solved

  const handleSubmit = () => {
    if (!selected) return
    onInteract?.()
    flow.attempt(selected === answer)
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.choiceHint}</p>

      <ul className="space-y-2.5" role="radiogroup" aria-label={level.statement}>
        {options.map((o) => {
          const isSelected = selected === o.key
          const isAnswer = o.key === answer
          const showRight = (solved || revealed) && isAnswer
          const showWrong = !solved && !revealed && isSelected && !isAnswer && flow.attempts > 0
          return (
            <li key={o.key}>
              <motion.button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                data-testid={`option-${o.key}`}
                onClick={() => {
                  if (disabled) return
                  haptic(8)
                  onInteract?.()
                  setSelected(o.key)
                }}
                className="flex w-full items-center gap-3 rounded-[var(--r-md)] border-2 px-3.5 py-3 text-left"
                style={{
                  minHeight: 56,
                  background: showRight
                    ? '#e2f2e7'
                    : isSelected
                      ? 'var(--c-brand-soft)'
                      : 'var(--c-surface)',
                  borderColor: showRight
                    ? 'var(--c-leaf)'
                    : showWrong
                      ? 'var(--c-danger)'
                      : isSelected
                        ? 'var(--c-brand)'
                        : 'var(--c-line)',
                  boxShadow: isSelected ? 'var(--sh-card)' : 'none',
                }}
                animate={
                  animated && flow.justWrong && isSelected ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
                }
                whileTap={disabled ? undefined : { scale: 0.985 }}
              >
                <span
                  className="num grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-bold"
                  style={{
                    background: showRight
                      ? 'var(--c-leaf)'
                      : isSelected
                        ? 'var(--c-brand)'
                        : 'var(--c-surface-sunken)',
                    color: showRight || isSelected ? '#fff' : 'var(--c-ink-soft)',
                  }}
                >
                  {showRight ? <Icon name="check" size={16} /> : o.key}
                </span>
                <span className="min-w-0 flex-1 text-[16px] font-semibold">{o.text}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={disabled || !selected}
          onClick={handleSubmit}
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
          {zh.level.wrong}
        </p>
      )}
    </div>
  )
}
