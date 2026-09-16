/**
 * components/viz/LoopDial.tsx · 循环轮盘（for 转圈圈）
 * 显示：第几圈、嵌套层数、循环变量当前值。
 */
import { motion } from 'framer-motion'
import type { LoopInfo } from '@/engine/cpp'
import { zh } from '@/i18n/zh'
import { useAnimated } from '../common/primitives'

export interface LoopDialProps {
  loopStack: LoopInfo[]
  /** 当前帧是否处于循环内部 */
  active: boolean
}

const RING = 46
const STROKE = 7

export function LoopDial({ loopStack, active }: LoopDialProps) {
  const animated = useAnimated()
  const top = loopStack[loopStack.length - 1]
  const rounds = top?.round ?? 0
  const current = active && top ? rounds + 1 : rounds
  const ticks = Math.min(Math.max(rounds, 0), 12)
  const angle = (current % 12) * 30

  const circumference = 2 * Math.PI * RING
  const progress = top ? Math.min(rounds / 12, 1) : 0

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
        <svg viewBox="0 0 104 104" width={104} height={104} aria-hidden="true">
          <circle
            cx="52"
            cy="52"
            r={RING}
            fill="var(--c-surface)"
            stroke="var(--c-line-strong)"
            strokeWidth="1.5"
          />
          <circle
            cx="52"
            cy="52"
            r={RING}
            fill="none"
            stroke="var(--c-brand-soft)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 52 52)"
          />
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i * 30 - 90) * Math.PI) / 180
            const x1 = 52 + Math.cos(a) * (RING - 12)
            const y1 = 52 + Math.sin(a) * (RING - 12)
            const x2 = 52 + Math.cos(a) * (RING - 9)
            const y2 = 52 + Math.sin(a) * (RING - 9)
            const on = i < ticks
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={on ? 'var(--c-brand)' : 'var(--c-line-strong)'}
                strokeWidth={on ? 2.4 : 1.6}
                strokeLinecap="round"
              />
            )
          })}
          {loopStack.length > 1 && (
            <circle
              cx="52"
              cy="52"
              r={RING - 16}
              fill="none"
              stroke="var(--c-accent)"
              strokeWidth="2"
              strokeDasharray="4 5"
              opacity="0.85"
            />
          )}
        </svg>

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ width: 2, height: RING - 14, marginLeft: -1, transformOrigin: '50% 100%' }}
          animate={{ rotate: angle }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span
            className="block h-full w-full rounded-full"
            style={{ background: 'var(--c-accent)' }}
          />
        </motion.div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className="num text-[26px] font-bold">{current}</div>
            <div className="text-[10px] font-bold text-ink-faint">{zh.viz.loopRing}</div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-bold text-ink-soft">{zh.viz.loop}</div>
        <div className="mt-1 text-[15px] font-bold">
          {loopStack.length === 0 ? zh.viz.loopIdle : zh.viz.loopRound(current)}
        </div>
        {top?.counter && <div className="num mt-0.5 text-[13px] text-ink-soft">{top.counter}</div>}
        {loopStack.length > 1 && (
          <div className="mt-1 text-[12px] text-ink-faint">
            {zh.viz.loopLayers(loopStack.length)}
          </div>
        )}
      </div>
    </div>
  )
}
