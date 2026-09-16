/**
 * components/question/FeedbackCard.tsx · 答后反馈（温和解释「为什么」）
 */
import { motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'

export interface FeedbackCardProps {
  /** 是否已经过关（首次全对或最终全对） */
  passed: boolean
  correctCount: number
  total: number
  explanation: string
  hintsUsed: number
}

export function FeedbackCard({
  passed,
  correctCount,
  total,
  explanation,
  hintsUsed,
}: FeedbackCardProps) {
  const animated = useAnimated()
  const great = passed && correctCount === total

  return (
    <motion.section
      initial={animated ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[var(--r-lg)] border p-4"
      style={{
        borderColor: great ? 'var(--c-leaf)' : 'var(--c-line)',
        background: great ? '#e9f5ed' : 'var(--c-surface)',
        boxShadow: 'var(--sh-card)',
      }}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-white"
          style={{ background: great ? 'var(--c-leaf)' : 'var(--c-brand)' }}
          aria-hidden="true"
        >
          <Icon name={great ? 'check' : 'hint'} size={17} />
        </span>
        <div>
          <h3 className="text-[var(--t-h3)] font-extrabold">
            {great ? zh.level.correct : passed ? zh.level.finishedPartial : zh.level.wrong}
          </h3>
          <p className="text-[13px] text-ink-soft">
            {zh.result.firstTry(correctCount, total)}
            {hintsUsed > 0 ? `　${zh.result.hintUsed(hintsUsed)}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[var(--r-md)] p-3" style={{ background: 'var(--c-surface)' }}>
        <div className="mb-1 text-[12px] font-bold text-ink-soft">{zh.level.explanation}</div>
        <p className="text-[15px] leading-relaxed">{explanation}</p>
      </div>
    </motion.section>
  )
}
