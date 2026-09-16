/**
 * components/question/CodeFill.tsx · 程序填空（L1 拖拽积木）
 * 两条操作路径：长按 150ms 拖动（触屏）/ 点选积木再点空格（无障碍备选）。
 * 填入即做类型检查给即时反馈；提交后仅高亮错误，绝不清空学生输入。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CodeFillPayloadSchema, type BlockDef } from '@/content/schema'
import {
  checkSlotAccepts,
  deriveTray,
  gradeSlots,
  renderFilledCode,
} from '@/engine/blocks'
import { zh } from '@/i18n/zh'
import { BlockTray } from '../blocks/BlockTray'
import { CodeSkeleton } from '../blocks/CodeSkeleton'
import { Icon } from '../common/Icon'
import { useAnimated } from '../common/primitives'
import { TracePlayer } from '../runner/TracePlayer'
import { haptic } from '@/store/settings'
import type { QuestionProps } from './types'

interface Filled {
  blockId: string
  label: string
}

export function CodeFill({ level, locked, onSubmit, onInteract }: QuestionProps) {
  const animated = useAnimated()
  const payload = useMemo(() => CodeFillPayloadSchema.safeParse(level.payload), [level.payload])

  const slots = payload.success ? payload.data.slots : []
  const blocks = useMemo<BlockDef[]>(() => {
    if (!payload.success) return []
    return payload.data.tray ?? deriveTray(payload.data.slots)
  }, [payload])

  const [fills, setFills] = useState<Record<string, Filled>>({})
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ blockId: string; label: string; x: number; y: number } | null>(null)
  const [hoverSlotId, setHoverSlotId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [firstTryMap, setFirstTryMap] = useState<Record<string, boolean>>({})
  const [submittedOnce, setSubmittedOnce] = useState(false)
  const [solved, setSolved] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const pressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number; block: BlockDef } | null>(null)
  const disabled = locked || solved

  const labels = useMemo(() => {
    const out: Record<string, string> = {}
    Object.entries(fills).forEach(([k, v]) => {
      out[k] = v.label
    })
    return out
  }, [fills])

  const latestGrades = useMemo(() => gradeSlots(slots, labels), [slots, labels])
  const usedBlockIds = Object.values(fills).map((f) => f.blockId)
  const allFilled = slots.length > 0 && slots.every((s) => fills[s.id])

  // ---------- 放置 / 取下 ----------
  const placeBlock = (slotId: string, blockId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    const block = blocks.find((b) => b.id === blockId)
    if (!slot || !block || disabled) return
    if (Object.values(fills).some((f) => f.blockId === blockId)) {
      setMessage(zh.question.blockUsed)
      return
    }
    const fb = checkSlotAccepts(slot, block)
    if (!fb.ok) {
      haptic(18)
      setMessage(fb.message)
      window.setTimeout(() => setMessage(null), 2200)
      return
    }
    haptic(12)
    setMessage(null)
    onInteract?.()
    setFills((prev) => ({ ...prev, [slotId]: { blockId, label: block.label } }))
    setSelectedBlockId(null)
  }

  const removeSlot = (slotId: string) => {
    if (disabled) return
    haptic(10)
    setFills((prev) => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }

  // ---------- 拖拽（长按 150ms 触发，避免误划） ----------
  // 监听器在 pointerdown 的那一刻就挂上，不依赖 effect 的执行时机：
  // 极快的一次点按（按下与抬起落在同一帧）也不会留下「拖拽中」的残影状态。
  const dragCleanup = useRef<(() => void) | null>(null)

  const endDrag = () => {
    dragCleanup.current?.()
    dragCleanup.current = null
    setDragging(null)
    setHoverSlotId(null)
  }

  const beginDrag = (block: BlockDef, x: number, y: number) => {
    endDrag()
    setDragging({ blockId: block.id, label: block.label, x, y })
    setSelectedBlockId(null)
    haptic(10)

    const slotUnder = (clientX: number, clientY: number): string | undefined => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
      return (el?.closest('[data-slot-id]') as HTMLElement | null)?.dataset.slotId
    }

    const move = (e: PointerEvent) => {
      setHoverSlotId(slotUnder(e.clientX, e.clientY) ?? null)
      setDragging((d) => (d && d.blockId === block.id ? { ...d, x: e.clientX, y: e.clientY } : d))
    }
    const finish = (e: PointerEvent) => {
      const slotId = slotUnder(e.clientX, e.clientY)
      if (slotId) placeBlock(slotId, block.id)
      endDrag()
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', endDrag)
    dragCleanup.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', endDrag)
    }
  }

  // 组件卸载时不能留下悬空的全局监听
  useEffect(() => () => dragCleanup.current?.(), [])

  const onBlockPointerDown = (block: BlockDef, e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || usedBlockIds.includes(block.id)) return
    onInteract?.()
    if (e.pointerType === 'mouse') {
      beginDrag(block, e.clientX, e.clientY)
      return
    }
    pressStart.current = { x: e.clientX, y: e.clientY, block }
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => {
      const p = pressStart.current
      if (p) beginDrag(p.block, p.x, p.y)
      pressTimer.current = null
    }, 150)
  }

  const onBlockMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = pressStart.current
    if (!p || !pressTimer.current) return
    if (Math.abs(e.clientX - p.x) > 10 || Math.abs(e.clientY - p.y) > 10) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const onBlockUp = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    pressStart.current = null
  }

  const onBlockClick = (block: BlockDef) => {
    if (disabled || usedBlockIds.includes(block.id)) return
    onInteract?.()
    haptic(8)
    setSelectedBlockId((cur) => (cur === block.id ? null : block.id))
  }

  // 点选路径：选中积木后点空格
  const handleSlotTap = (slotId: string) => {
    if (fills[slotId]) return // 已填的空格由 DropSlot 自己处理「取回」
    if (selectedBlockId) placeBlock(slotId, selectedBlockId)
  }

  // ---------- 提交 ----------
  const handleCheck = () => {
    if (!payload.success) return
    haptic(12)
    onInteract?.()
    const map = { ...firstTryMap }
    if (!submittedOnce) {
      latestGrades.forEach((g) => {
        map[g.id] = g.correct
      })
    }
    setFirstTryMap(map)
    setSubmittedOnce(true)
    const allCorrect = latestGrades.every((g) => g.correct)
    if (allCorrect) {
      setSolved(true)
      onSubmit({
        subs: payload.data.slots.map((s) => ({ id: s.id, correct: map[s.id] === true })),
        allCorrect: true,
      })
    }
  }

  const handleReveal = () => {
    if (!payload.success || solved) return
    const map: Record<string, boolean> = {}
    payload.data.slots.forEach((s) => {
      map[s.id] = false
    })
    setSolved(true)
    onSubmit({
      subs: payload.data.slots.map((s) => ({ id: s.id, correct: false })),
      allCorrect: true,
    })
  }

  if (!payload.success) return null
  const { skeleton, demo } = payload.data
  const wrongCount = submittedOnce ? latestGrades.filter((g) => !g.correct).length : 0

  const statusOf = (slotId: string) => {
    if (!submittedOnce) return 'filled' as const
    const g = latestGrades.find((x) => x.id === slotId)
    return g?.correct ? ('good' as const) : ('bad' as const)
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">{zh.question.fillCodeHint}</p>

      {/* 骨架：点空格走「点选」路径 */}
      <div
        onClick={(e) => {
          const slotEl = (e.target as HTMLElement).closest('[data-slot-id]') as HTMLElement | null
          if (slotEl?.dataset.slotId) handleSlotTap(slotEl.dataset.slotId)
        }}
      >
        <CodeSkeleton
          skeleton={skeleton}
          slots={slots}
          fills={fills}
          hoverSlotId={hoverSlotId}
          statusOf={statusOf}
          onRemove={removeSlot}
        />
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[10px] px-3 py-2 text-[14px] font-bold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}
            role="status"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <BlockTray
        blocks={blocks}
        usedIds={usedBlockIds}
        selectedId={selectedBlockId}
        draggingId={dragging?.blockId ?? null}
        onBlockPointerDown={(b, e) => {
          onBlockPointerDown(b, e)
        }}
        onBlockPointerMove={onBlockMove}
        onBlockPointerUp={onBlockUp}
        onBlockClick={onBlockClick}
      />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={disabled || !allFilled}
          onClick={handleCheck}
          data-testid="submit-answer"
        >
          {zh.level.submit}
        </button>
        {submittedOnce && !solved && wrongCount >= 2 && (
          <button type="button" className="btn btn-ghost" onClick={handleReveal}>
            {zh.question.reveal}
          </button>
        )}
      </div>

      {submittedOnce && !solved && (
        <p className="text-[15px] font-bold" style={{ color: 'var(--c-danger)' }} role="status">
          {zh.level.wrong}　{zh.level.wrongKept}
        </p>
      )}

      {solved && demo && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-dashed px-3 py-3 text-[15px] font-bold"
            style={{
              minHeight: 48,
              borderColor: 'var(--c-brand)',
              background: 'var(--c-brand-soft)',
              color: 'var(--c-brand-deep)',
            }}
          >
            <Icon name={showDemo ? 'chevronDown' : 'play'} size={17} filled={!showDemo} />
            {showDemo ? zh.level.hideRunner : zh.question.demoLine}
          </button>
          {showDemo && (
            <TracePlayer
              code={demo.head + renderFilledCode(skeleton, slots, labels) + demo.tail}
              testInput={demo.testInput}
              expectedStdout={demo.expectedStdout}
              defaultCodeOpen
            />
          )}
        </div>
      )}

      {/* 拖拽幽灵 */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            className="num pointer-events-none fixed z-[70] grid place-items-center rounded-[13px] border-2 px-4 text-[17px] font-bold"
            data-testid="drag-ghost"
            style={{
              left: dragging.x - 34,
              top: dragging.y - 26,
              minWidth: 68,
              minHeight: 50,
              background: 'var(--c-accent-soft)',
              borderColor: 'var(--c-accent)',
              color: 'var(--c-accent-deep)',
              boxShadow: 'var(--sh-lift)',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: animated ? 1.06 : 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            aria-hidden="true"
          >
            {dragging.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
