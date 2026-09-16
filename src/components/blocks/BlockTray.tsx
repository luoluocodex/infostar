/**
 * components/blocks/BlockTray.tsx · 底部积木托盘（横向可滚动，拇指可达）
 * 支持两条路径：长按拖动（触屏）/ 点选后再点空格（无障碍备选）。
 */
import { motion } from 'framer-motion'
import type { BlockDef } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { useAnimated } from '../common/primitives'

const KIND_STYLE: Record<BlockDef['kind'], { bg: string; fg: string; border: string }> = {
  op: { bg: 'var(--c-accent-soft)', fg: 'var(--c-accent-deep)', border: 'var(--c-accent)' },
  index: { bg: 'var(--c-brand-soft)', fg: 'var(--c-brand-deep)', border: 'var(--c-brand)' },
  num: { bg: '#fdf0d4', fg: '#8a5c08', border: 'var(--c-sun)' },
  var: { bg: '#e2f2e7', fg: '#2f6a45', border: 'var(--c-leaf)' },
}

export interface BlockTrayProps {
  blocks: BlockDef[]
  /** 已被占用（单次使用）的积木 */
  usedIds: string[]
  selectedId: string | null
  draggingId: string | null
  onBlockPointerDown: (block: BlockDef, e: React.PointerEvent<HTMLButtonElement>) => void
  onBlockPointerMove?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onBlockPointerUp?: () => void
  onBlockClick: (block: BlockDef) => void
}

export function BlockTray({
  blocks,
  usedIds,
  selectedId,
  draggingId,
  onBlockPointerDown,
  onBlockPointerMove,
  onBlockPointerUp,
  onBlockClick,
}: BlockTrayProps) {
  const animated = useAnimated()

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] text-ink-soft">{zh.question.trayHint}</p>
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {blocks.map((b) => {
          const used = usedIds.includes(b.id)
          const selected = selectedId === b.id
          const st = KIND_STYLE[b.kind]
          return (
            <motion.button
              key={b.id}
              type="button"
              disabled={used}
              data-block-id={b.id}
              onPointerDown={(e) => onBlockPointerDown(b, e)}
              onPointerMove={onBlockPointerMove}
              onPointerUp={onBlockPointerUp}
              onPointerCancel={onBlockPointerUp}
              onClick={() => onBlockClick(b)}
              className="num grid shrink-0 place-items-center rounded-[13px] border-2 px-4 text-[17px] font-bold"
              style={{
                minHeight: 50,
                minWidth: 62,
                background: used ? 'var(--c-surface-sunken)' : st.bg,
                color: used ? 'var(--c-ink-faint)' : st.fg,
                borderColor: used ? 'var(--c-line)' : selected ? 'var(--c-ink)' : st.border,
                borderStyle: used ? 'dashed' : 'solid',
                opacity: used ? 0.55 : 1,
                touchAction: 'none',
                cursor: used ? 'not-allowed' : 'grab',
                scrollSnapAlign: 'center',
              }}
              animate={
                animated && selected ? { y: [0, -4, 0] } : { y: 0 }
              }
              transition={{ duration: 0.6, repeat: selected ? Infinity : 0, repeatDelay: 0.4 }}
              aria-pressed={selected}
              aria-label={zh.question.trayBlockAria(b.label, used)}
            >
              <span style={{ opacity: draggingId === b.id ? 0.35 : 1 }}>{b.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
