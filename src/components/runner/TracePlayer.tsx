/**
 * components/runner/TracePlayer.tsx · 执行帧播放器（可视化执行剧场）
 * 播放 / 暂停 / 单步 / 回退 / 变速（0.5x–2x）；当前行与可视化同步。
 * 消费 engine/cpp（纯逻辑），本组件不参与任何程序语义计算。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { runCpp, type Frame } from '@/engine/cpp'
import { zh } from '@/i18n/zh'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'
import { ArrayGrid } from '../viz/ArrayGrid'
import { CondFork } from '../viz/CondFork'
import { LoopDial } from '../viz/LoopDial'
import { StdoutTyper } from '../viz/StdoutTyper'
import { VarBox } from '../viz/VarBox'
import { CodeHighlighter } from './CodeHighlighter'

const SPEEDS = [0.5, 1, 2] as const

function baseDelay(action: Frame['action'] | undefined): number {
  switch (action) {
    case 'output':
      return 820
    case 'cond':
      return 760
    case 'loop-test':
      return 560
    case 'loop-step':
      return 430
    default:
      return 660
  }
}

export interface TracePlayerProps {
  code: string
  testInput: number[]
  expectedStdout: string
  /** 播放到最后一帧时回调（用于「填完看它跑」的核对） */
  onDone?: (stdout: string) => void
  /** 代码区默认是否展开 */
  defaultCodeOpen?: boolean
}

export function TracePlayer({
  code,
  testInput,
  expectedStdout,
  onDone,
  defaultCodeOpen = true,
}: TracePlayerProps) {
  const animated = useAnimated()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [codeOpen, setCodeOpen] = useState(defaultCodeOpen)

  const result = useMemo(() => runCpp(code, testInput), [code, testInput])
  const frames = result.frames
  const last = frames.length - 1
  const frame = frames[Math.min(index, Math.max(last, 0))]

  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [code, testInput])

  useEffect(() => {
    if (!playing) return
    if (index >= last) {
      setPlaying(false)
      return
    }
    const delay = animated ? baseDelay(frames[index]?.action) / speed : 0
    const t = window.setTimeout(() => setIndex((i) => Math.min(i + 1, last)), delay)
    return () => window.clearTimeout(t)
  }, [playing, index, last, frames, speed, animated])

  useEffect(() => {
    if (index >= last && last >= 0 && result.ok) {
      onDone?.(result.stdout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, last])

  const goto = useCallback(
    (i: number) => {
      setPlaying(false)
      setIndex(Math.max(0, Math.min(i, last)))
    },
    [last],
  )

  if (!result.ok || frames.length === 0) {
    return (
      <div
        className="rounded-[var(--r-md)] border p-4"
        style={{ borderColor: 'var(--c-danger)', background: '#fdeee9' }}
        role="alert"
      >
        <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--c-danger)' }}>
          <Icon name="hint" size={18} />
          {zh.runner.errorTitle}
        </div>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--c-ink)' }}>
          {result.error?.message ?? zh.runner.errorTitle}
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">{zh.runner.errorHint}</p>
      </div>
    )
  }

  const vars = Object.values(frame?.vars ?? {})
  const scalars = vars.filter((v) => v.type !== 'array' && v.type !== 'array2d')
  const arrays = vars.filter((v) => v.type === 'array' || v.type === 'array2d')
  const inLoop = (frame?.loopStack.length ?? 0) > 0
  const hasCond = Boolean(frame?.highlight?.compare)

  return (
    <section aria-label={zh.runner.title} className="space-y-3">
      {/* ---------- 舞台 ---------- */}
      <div className="stage px-3 pb-3.5 pt-11">
        <div className="mb-2.5 flex items-start gap-2">
          <span
            className="mt-[3px] grid h-6 w-6 shrink-0 place-items-center rounded-full"
            style={{ background: 'var(--c-sun)', color: 'var(--c-ink)' }}
            aria-hidden="true"
          >
            <Icon name="sparkle" size={13} />
          </span>
          <p className="text-[15px] font-bold leading-snug" data-testid="trace-note">
            {frame?.note}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {inLoop && <LoopDial loopStack={frame?.loopStack ?? []} active />}
          {(hasCond || inLoop) && <CondFork compare={frame?.highlight?.compare} active={hasCond} />}
        </div>

        {scalars.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-bold text-ink-soft">{zh.viz.variables}</div>
            <div className="flex flex-wrap gap-2.5">
              {scalars.map((v) => (
                <VarBox key={v.name} snap={v} />
              ))}
            </div>
          </div>
        )}

        {arrays.length > 0 && (
          <div className="mt-3 space-y-3">
            {arrays.map((v) => (
              <ArrayGrid key={v.name} snap={v} highlight={frame?.highlight?.arrayIndex} />
            ))}
          </div>
        )}

        {scalars.length === 0 && arrays.length === 0 && (
          <p className="mt-2 text-[14px] text-ink-faint">{zh.viz.noVariables}</p>
        )}
      </div>

      {/* ---------- 话筒（输出） ---------- */}
      <StdoutTyper text={frame?.stdout ?? ''} typing={playing} />

      {/* ---------- 控制条 ---------- */}
      <div
        className="flex items-center gap-2 rounded-[var(--r-md)] border bg-surface px-2.5 py-2"
        style={{ borderColor: 'var(--c-line)' }}
      >
        <button
          type="button"
          onClick={() => goto(0)}
          aria-label={zh.runner.restart}
          className="tap-target grid place-items-center rounded-xl"
          style={{ width: 44, height: 44, background: 'var(--c-surface-sunken)' }}
        >
          <Icon name="restart" size={19} />
        </button>
        <button
          type="button"
          onClick={() => goto(index - 1)}
          aria-label={zh.runner.stepBack}
          disabled={index === 0}
          className="tap-target grid place-items-center rounded-xl disabled:opacity-40"
          style={{ width: 44, height: 44, background: 'var(--c-surface-sunken)' }}
        >
          <Icon name="stepBack" size={19} />
        </button>
        <motion.button
          type="button"
          onClick={() => {
            if (index >= last) setIndex(0)
            setPlaying((p) => !p)
          }}
          aria-label={playing ? zh.runner.pause : zh.runner.play}
          className="grid flex-1 place-items-center rounded-xl font-bold text-white"
          style={{ minHeight: 44, background: 'var(--c-brand)' }}
          whileTap={{ scale: 0.97 }}
          data-testid="trace-play"
        >
          <span className="flex items-center gap-1.5">
            <Icon name={playing ? 'pause' : 'play'} size={17} filled={!playing} />
            {playing ? zh.runner.pause : zh.runner.play}
          </span>
        </motion.button>
        <button
          type="button"
          onClick={() => goto(index + 1)}
          aria-label={zh.runner.stepForward}
          disabled={index >= last}
          className="tap-target grid place-items-center rounded-xl disabled:opacity-40"
          style={{ width: 44, height: 44, background: 'var(--c-surface-sunken)' }}
          data-testid="trace-next"
        >
          <Icon name="stepForward" size={19} />
        </button>
        <button
          type="button"
          onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}
          aria-label={zh.runner.speed}
          className="num tap-target grid place-items-center rounded-xl text-[13px] font-bold"
          style={{ width: 48, height: 44, background: 'var(--c-surface-sunken)' }}
        >
          {speed}x
        </button>
      </div>

      <div className="flex items-center justify-between text-[12px] text-ink-faint">
        <span className="num">{zh.runner.progress(Math.min(index + 1, frames.length), frames.length)}</span>
        <span>
          {zh.runner.expected} <b className="num">{expectedStdout || zh.runner.empty}</b>
        </span>
      </div>

      {/* ---------- 代码 ---------- */}
      <div>
        <button
          type="button"
          onClick={() => setCodeOpen((v) => !v)}
          aria-expanded={codeOpen}
          className="mb-2 flex w-full items-center justify-between rounded-[var(--r-md)] border bg-surface px-3 py-2.5 text-[15px] font-bold"
          style={{ borderColor: 'var(--c-line)', minHeight: 48 }}
        >
          <span>{zh.runner.codePanel}</span>
          <Icon name={codeOpen ? 'chevronDown' : 'chevronRight'} size={18} />
        </button>
        {codeOpen && <CodeHighlighter code={code} activeLine={frame?.line} />}
      </div>
    </section>
  )
}
