/**
 * components/blocks/CodeSkeleton.tsx · 代码骨架（真 C++ 语法外观 + 可拖空格）
 */
import type { SlotDef } from '@/content/schema'
import { splitSkeleton } from '@/engine/blocks'
import { DropSlot, type SlotStatus } from './DropSlot'

export interface CodeSkeletonProps {
  skeleton: string
  slots: SlotDef[]
  fills: Record<string, { label: string }>
  /** 拖拽悬停的槽位 id */
  hoverSlotId: string | null
  statusOf: (slotId: string) => SlotStatus
  onRemove: (slotId: string) => void
}

export function CodeSkeleton({
  skeleton,
  slots,
  fills,
  hoverSlotId,
  statusOf,
  onRemove,
}: CodeSkeletonProps) {
  const parts = splitSkeleton(skeleton, slots)

  return (
    <div
      className="rounded-[var(--r-md)] px-3 py-3.5"
      style={{ background: '#2f2620', overflowX: 'auto' }}
      data-testid="code-skeleton"
    >
      <div
        className="flex min-w-fit flex-wrap items-center gap-y-2"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#f6ead9' }}
      >
        {parts.map((part, i) => {
          if (part.kind === 'text') {
            return (
              <span key={i} className="whitespace-pre">
                {part.text}
              </span>
            )
          }
          const slot = slots.find((s) => s.id === part.slotId)!
          const filled = fills[part.slotId]
          const status: SlotStatus = filled
            ? statusOf(part.slotId)
            : hoverSlotId === part.slotId
              ? 'hover'
              : 'idle'
          return (
            <DropSlot
              key={part.slotId}
              slotId={part.slotId}
              accept={slot.accept}
              {...(filled ? { label: filled.label } : {})}
              status={status}
              onRemove={() => onRemove(part.slotId)}
            />
          )
        })}
      </div>
    </div>
  )
}
