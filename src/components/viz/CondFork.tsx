/**
 * components/viz/CondFork.tsx · 条件岔路（if-else）
 * 真假两条路，走哪条就点亮哪条。
 */
import { motion } from 'framer-motion'
import { zh } from '@/i18n/zh'
import { useAnimated } from '../common/primitives'

export interface CondForkProps {
  compare?: { expr: string; value: boolean }
  active: boolean
}

export function CondFork({ compare, active }: CondForkProps) {
  const animated = useAnimated()
  const value = compare?.value ?? null
  const branches: { key: 'true' | 'false'; label: string; on: boolean }[] = [
    { key: 'true', label: zh.viz.condTrue, on: value === true },
    { key: 'false', label: zh.viz.condFalse, on: value === false },
  ]

  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold text-ink-soft">{zh.viz.cond}</div>
      <div
        className="mt-1 truncate rounded-[10px] border px-2.5 py-1.5 text-[13px] font-bold"
        style={{
          borderColor: active ? 'var(--c-accent)' : 'var(--c-line)',
          background: active ? 'var(--c-accent-soft)' : 'var(--c-surface-sunken)',
          color: active ? 'var(--c-accent-deep)' : 'var(--c-ink-soft)',
        }}
      >
        {compare ? compare.expr : '—'}
      </div>

      <svg viewBox="0 0 120 34" width="100%" height="34" aria-hidden="true" className="mt-1">
        <path d="M60 2 C60 16, 30 12, 30 30" fill="none" stroke="var(--c-line-strong)" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 2 C60 16, 90 12, 90 30" fill="none" stroke="var(--c-line-strong)" strokeWidth="2" strokeLinecap="round" />
        {value === true && (
          <path d="M60 2 C60 16, 30 12, 30 30" fill="none" stroke="var(--c-leaf)" strokeWidth="3.4" strokeLinecap="round" />
        )}
        {value === false && (
          <path d="M60 2 C60 16, 90 12, 90 30" fill="none" stroke="var(--c-accent)" strokeWidth="3.4" strokeLinecap="round" />
        )}
      </svg>

      <div className="flex items-center justify-between gap-2">
        {branches.map((b) => (
          <motion.span
            key={b.key}
            className="rounded-full px-2.5 py-[3px] text-[11px] font-bold"
            style={{
              background: b.on
                ? b.key === 'true'
                  ? 'var(--c-leaf)'
                  : 'var(--c-accent)'
                : b.key === 'true'
                  ? 'color-mix(in srgb, var(--c-leaf) 16%, white)'
                  : 'var(--c-accent-soft)',
              color: b.on ? '#fff' : b.key === 'true' ? '#2f6a45' : 'var(--c-accent-deep)',
              opacity: b.on ? 1 : 0.72,
            }}
            animate={b.on && animated ? { scale: [0.9, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.34, ease: [0.34, 1.4, 0.64, 1] }}
          >
            {b.label}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
