/**
 * components/blocks/DropSlot.tsx · 可拖放的空格
 * 命中区足够大（≥44px），拖拽经过时高亮，放错类型立刻给儿童化反馈。
 */
import { motion } from 'framer-motion'
import type { SlotKind } from '@/engine/blocks'
import { SLOT_KIND_LABEL } from '@/engine/blocks'
import { zh } from '@/i18n/zh'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'

export type SlotStatus = 'idle' | 'hover' | 'filled' | 'good' | 'bad'

export interface DropSlotProps {
  slotId: string
  accept: SlotKind[]
  label?: string
  status: SlotStatus
  onRemove: () => void
}

const STATUS_STYLE: Record<SlotStatus, { border: string; bg: string; color: string }> = {
  idle: { border: 'var(--c-brand)', bg: 'rgba(20,125,138,0.08)', color: 'var(--c-ink-soft)' },
  hover: { border: 'var(--c-accent)', bg: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' },
  filled: { border: 'var(--c-brand)', bg: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' },
  good: { border: 'var(--c-leaf)', bg: '#e2f2e7', color: '#2f6a45' },
  bad: { border: 'var(--c-danger)', bg: '#fdeee9', color: 'var(--c-danger)' },
}

export function DropSlot({ slotId, accept, label, status, onRemove }: DropSlotProps) {
  const animated = useAnimated()
  const s = STATUS_STYLE[status]
  const filled = status === 'filled' || status === 'good' || status === 'bad'
  const want = accept.map((k) => SLOT_KIND_LABEL[k]).join('／')

  return (
    <motion.button
      type="button"
      data-slot-id={slotId}
      data-slot-status={status}
      onClick={filled ? onRemove : undefined}
      aria-label={
        filled ? zh.question.slotRemoveAria(label ?? '') : zh.question.slotWant(want)
      }
      className="inline-flex min-h-[46px] min-w-[76px] items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed px-2.5 align-middle"
      style={{
        borderStyle: filled ? 'solid' : 'dashed',
        borderColor: s.border,
        background: s.bg,
        color: s.color,
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        fontWeight: 700,
        cursor: filled ? 'pointer' : 'default',
        touchAction: 'manipulation',
      }}
      animate={
        animated && status === 'bad'
          ? { x: [0, -5, 5, -3, 3, 0] }
          : animated && status === 'good'
            ? { scale: [1, 1.12, 1] }
            : { x: 0, scale: 1 }
      }
      transition={{ duration: 0.36 }}
    >
      {filled ? (
        <>
          <span>{label}</span>
          <Icon name="close" size={13} />
        </>
      ) : (
        <span className="text-[13px] opacity-80">{zh.question.dropHere}</span>
      )}
    </motion.button>
  )
}
