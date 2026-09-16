/**
 * components/viz/VarBox.tsx · 变量盒子（会变的盒子）
 * 只读 Frame 里的 VarSnapshot，不自己算程序逻辑（AGENTS §2.6 分层铁律 4）。
 */
import { motion } from 'framer-motion'
import type { VarSnapshot } from '@/engine/cpp'
import { zh } from '@/i18n/zh'
import { useAnimated } from '../common/primitives'

export interface VarBoxProps {
  snap: VarSnapshot
}

export function VarBox({ snap }: VarBoxProps) {
  const animated = useAnimated()
  const big = snap.boxSize === 'big'
  const isArray = snap.type === 'array' || snap.type === 'array2d'
  const valueText = isArray ? zh.viz.cellCount((snap.value as number[]).length) : String(snap.value)

  return (
    <motion.div
      className="relative min-w-[92px] shrink-0"
      animate={
        animated && snap.changed
          ? { scale: [1, 1.1, 0.98, 1], rotate: [0, -1.6, 1.2, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={{ duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }}
      aria-label={`${snap.name} = ${valueText}`}
    >
      {/* 盒子标签：贴着名字的胶带 */}
      <div
        className="mx-auto w-fit max-w-full truncate rounded-t-[10px] px-2.5 py-[3px] text-[12px] font-bold"
        style={{
          background: snap.changed ? 'var(--c-accent-soft)' : 'var(--c-brand-soft)',
          color: snap.changed ? 'var(--c-accent-deep)' : 'var(--c-brand-deep)',
        }}
      >
        {snap.name}
      </div>
      {/* 盒身 */}
      <div
        className="grid place-items-center rounded-[14px] border-2"
        style={{
          minWidth: big ? 92 : 72,
          minHeight: big ? 68 : 54,
          padding: big ? '10px 14px' : '8px 12px',
          background: snap.changed ? '#fff6ec' : 'var(--c-surface)',
          borderColor: snap.changed ? 'var(--c-accent)' : 'var(--c-line-strong)',
          borderStyle: big ? 'solid' : 'dashed',
          boxShadow: 'var(--sh-card)',
        }}
      >
        <span
          className="num leading-none"
          style={{ fontSize: big ? 26 : 22, fontWeight: 700 }}
        >
          {valueText}
        </span>
        <span className="mt-[3px] text-[10px] font-semibold text-ink-faint">
          {zh.viz.typeName[snap.type] ?? snap.type}
        </span>
      </div>
    </motion.div>
  )
}
