/**
 * components/question/CodeRead.tsx · 读程序写结果（含可视化运行器）
 * 约定 G1：cin 的取值只来自 payload.testInput，不弹输入框。
 */
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CodeReadPayloadSchema } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { matchText } from '@/engine/grade'
import { CodeHighlighter } from '../runner/CodeHighlighter'
import { TracePlayer } from '../runner/TracePlayer'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'
import { haptic } from '@/store/settings'
import { NumberPad } from './NumberPad'
import type { QuestionProps } from './types'
import { useAnswerFlow } from './useAnswerFlow'

export function CodeRead({ level, locked, onSubmit, onInteract }: QuestionProps) {
  const animated = useAnimated()
  const payload = useMemo(() => CodeReadPayloadSchema.safeParse(level.payload), [level.payload])
  const [value, setValue] = useState('')
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [showRunner, setShowRunner] = useState(false)
  const [codeOpen, setCodeOpen] = useState(true)
  const flow = useAnswerFlow(onSubmit)
  const disabled = locked || flow.solved || flow.revealed

  useEffect(() => {
    // 答对之后自动把「看它跑」展开，让程序自己解释一遍
    if (flow.solved && payload.success && payload.data.allowRunner) setShowRunner(true)
  }, [flow.solved, payload])

  if (!payload.success) return null
  const { code, testInput, expectedStdout, allowRunner } = payload.data
  const answer = String(level.answer)

  return (
    <div className="space-y-3">
      <div>
        <button
          type="button"
          onClick={() => setCodeOpen((v) => !v)}
          aria-expanded={codeOpen}
          className="mb-2 flex w-full items-center justify-between rounded-[var(--r-md)] border bg-surface px-3 py-2.5 text-[15px] font-bold"
          style={{ borderColor: 'var(--c-line)', minHeight: 48 }}
        >
          <span>{zh.question.codePanel}</span>
          <Icon name={codeOpen ? 'chevronDown' : 'chevronRight'} size={18} />
        </button>
        {codeOpen && <CodeHighlighter code={code} />}
      </div>

      {allowRunner && (
        <button
          type="button"
          onClick={() => {
            haptic(10)
            onInteract?.()
            setShowRunner((v) => !v)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-dashed px-3 py-3 text-[15px] font-bold"
          style={{
            minHeight: 48,
            borderColor: showRunner ? 'var(--c-brand)' : 'var(--c-line-strong)',
            background: showRunner ? 'var(--c-brand-soft)' : 'transparent',
            color: showRunner ? 'var(--c-brand-deep)' : 'var(--c-ink-soft)',
          }}
          data-testid="toggle-runner"
        >
          <Icon name={showRunner ? 'chevronDown' : 'play'} size={17} filled={!showRunner} />
          {showRunner ? zh.level.hideRunner : zh.level.runIt}
          {!showRunner && (
            <span className="text-[12px] font-normal opacity-75">{zh.question.runnerPeek}</span>
          )}
        </button>
      )}

      {showRunner && allowRunner && (
        <TracePlayer code={code} testInput={testInput} expectedStdout={expectedStdout} />
      )}

      <div className="space-y-3 rounded-[var(--r-md)] border bg-surface p-3.5" style={{ borderColor: 'var(--c-line)' }}>
        <p className="text-[13px] text-ink-soft">{zh.question.readHint}</p>

        <motion.div
          className="flex items-center justify-center gap-2 rounded-[var(--r-md)] border-2 px-4 py-3"
          style={{
            minHeight: 76,
            borderColor: flow.justWrong
              ? 'var(--c-danger)'
              : flow.solved || flow.revealed
                ? 'var(--c-leaf)'
                : 'var(--c-brand)',
            background: flow.solved || flow.revealed ? '#e2f2e7' : 'var(--c-surface-sunken)',
          }}
          animate={animated && flow.justWrong ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
        >
          <span className="num text-[30px] font-bold leading-none whitespace-pre">
            {value || <span className="text-[18px] text-ink-faint">{zh.question.screenEmpty}</span>}
          </span>
        </motion.div>

        {keyboardMode ? (
          <input
            value={value}
            onChange={(e) => {
              onInteract?.()
              setValue(e.target.value)
            }}
            disabled={disabled}
            aria-label={zh.question.inputOutputAria}
            className="num w-full rounded-[var(--r-md)] border-2 px-3 py-3 text-[22px] font-bold outline-none"
            style={{ borderColor: 'var(--c-line-strong)', background: 'var(--c-surface)' }}
            placeholder={zh.question.readPlaceholder}
          />
        ) : (
          <NumberPad
            value={value}
            onChange={(v) => {
              onInteract?.()
              setValue(v)
            }}
            extras={[{ label: zh.question.spaceKey, insert: ' ' }]}
            disabled={disabled}
            maxLength={16}
          />
        )}

        {/* 键盘输入的备选路径：本身也是触摸目标，命中区不低于 44px */}
        <button
          type="button"
          onClick={() => setKeyboardMode((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-center text-[13px] font-bold underline"
          style={{ color: 'var(--c-brand-deep)' }}
        >
          {keyboardMode ? zh.question.usePadKeys : zh.question.useKeyboard}
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="btn btn-primary flex-1"
            disabled={disabled || value.trim() === ''}
            onClick={() => {
              haptic(12)
              onInteract?.()
              flow.attempt(matchText(value, answer))
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
            {zh.level.wrong}
          </p>
        )}
      </div>
    </div>
  )
}
