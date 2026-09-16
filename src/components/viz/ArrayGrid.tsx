/**
 * components/viz/ArrayGrid.tsx · 一维「一排储物柜」与二维「电影院座位表」
 * 读格子：放大 + 高亮；写格子：落格 + 脉冲。
 */
import { motion } from 'framer-motion'
import type { VarSnapshot } from '@/engine/cpp'
import { zh } from '@/i18n/zh'

export interface ArrayGridProps {
  snap: VarSnapshot
  /** 当前帧高亮的格子 */
  highlight?: number[]
}

export function ArrayGrid({ snap, highlight }: ArrayGridProps) {
  const is2d = snap.type === 'array2d'
  const grid = is2d ? (snap.value as number[][]) : null
  const flat = is2d ? [] : (snap.value as number[])

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span
          className="num rounded-md px-2 py-[2px] text-[12px] font-bold"
          style={{ background: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' }}
        >
          {snap.name}
        </span>
        <span className="text-[11px] font-semibold text-ink-faint">{zh.viz.array}</span>
      </div>

      {is2d && grid ? (
        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="inline-flex flex-col gap-1">
            {grid.map((row, r) => (
              <div key={r} className="flex items-center gap-1">
                <span className="num w-5 text-right text-[10px] text-ink-faint">{r}</span>
                {row.map((v, c) => {
                  const on = highlight?.[0] === r && highlight?.[1] === c
                  return (
                    <Cell key={c} value={v} active={on} changed={snap.changed} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="inline-flex items-end gap-1">
            {flat.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-[3px]">
                <Cell value={v} active={highlight?.[0] === i} changed={snap.changed} />
                <span className="num text-[10px] text-ink-faint">{i}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Cell({
  value,
  active,
  changed,
}: {
  value: number
  active: boolean
  changed: boolean
}) {
  return (
    <motion.span
      className="num grid place-items-center rounded-[9px] border-2 text-[15px] font-bold"
      style={{
        width: 40,
        height: 40,
        background: active ? 'var(--c-accent-soft)' : 'var(--c-surface)',
        borderColor: active ? 'var(--c-accent)' : 'var(--c-line-strong)',
        color: active ? 'var(--c-accent-deep)' : 'var(--c-ink)',
      }}
      animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.34, ease: [0.34, 1.4, 0.64, 1] }}
      aria-label={active ? zh.viz.arrayCellAria(String(value)) : undefined}
      data-changed={changed || undefined}
    >
      {value}
    </motion.span>
  )
}
