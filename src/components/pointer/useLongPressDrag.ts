/**
 * components/pointer/useLongPressDrag.ts · 轻量「长按拖拽到目标」交互
 * 手机端：长按 150ms 才进入拖拽（防误划）；鼠标端：按下即可拖。
 * 落点判定用 elementFromPoint + 目标元素上的 data-drop-id / data-slot-id，简单且精确。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { haptic } from '@/store/settings'

export interface DragItem {
  id: string
  label: string
}

export interface DragState extends DragItem {
  x: number
  y: number
}

export interface UseLongPressDragOptions {
  /** 落点容器的选择器，默认同时匹配 data-drop-id 与 data-slot-id */
  targetSelector?: string
  longPressMs?: number
  enabled?: boolean
  onDrop: (targetId: string, itemId: string) => void
  onStart?: (item: DragItem) => void
}

export interface LongPressDrag {
  dragging: DragState | null
  hoverId: string | null
  onPointerDown: (item: DragItem, e: React.PointerEvent<HTMLElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
  onPointerUp: () => void
}

const DEFAULT_SELECTOR = '[data-drop-id], [data-slot-id]'

export function useLongPressDrag({
  targetSelector = DEFAULT_SELECTOR,
  longPressMs = 150,
  enabled = true,
  onDrop,
  onStart,
}: UseLongPressDragOptions): LongPressDrag {
  const [dragging, setDragging] = useState<DragState | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  const pending = useRef<{ x: number; y: number; item: DragItem } | null>(null)
  /** 当前拖拽挂上的全局监听清理函数 */
  const cleanup = useRef<(() => void) | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const findTarget = useCallback(
    (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      const host = el?.closest(targetSelector) as HTMLElement | null
      if (!host) return null
      return host.dataset.dropId ?? host.dataset.slotId ?? null
    },
    [targetSelector],
  )

  const end = useCallback(() => {
    cleanup.current?.()
    cleanup.current = null
    setDragging(null)
    setHoverId(null)
  }, [])

  const begin = useCallback(
    (item: DragItem, x: number, y: number) => {
      // 先清掉上一轮可能残留的监听，再同步挂上新的：
      // 不依赖 useEffect 的时机，极快的一次点按也不会留下「拖拽中」的残影。
      end()
      setDragging({ ...item, x, y })
      haptic(10)
      onStart?.(item)

      const move = (e: PointerEvent) => {
        setHoverId(findTarget(e.clientX, e.clientY))
        setDragging((d) => (d && d.id === item.id ? { ...d, x: e.clientX, y: e.clientY } : d))
      }
      const finish = (e: PointerEvent) => {
        const target = findTarget(e.clientX, e.clientY)
        if (target) onDrop(target, item.id)
        end()
      }

      window.addEventListener('pointermove', move, { passive: true })
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', end)
      cleanup.current = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', end)
      }
    },
    [end, findTarget, onDrop, onStart],
  )

  const onPointerDown = useCallback(
    (item: DragItem, e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (e.pointerType === 'mouse') {
        begin(item, e.clientX, e.clientY)
        return
      }
      pending.current = { x: e.clientX, y: e.clientY, item }
      clearTimer()
      timer.current = window.setTimeout(() => {
        const p = pending.current
        if (p) begin(p.item, p.x, p.y)
        timer.current = null
      }, longPressMs)
    },
    [begin, clearTimer, enabled, longPressMs],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const p = pending.current
      if (!p || !timer.current) return
      if (Math.abs(e.clientX - p.x) > 10 || Math.abs(e.clientY - p.y) > 10) clearTimer()
    },
    [clearTimer],
  )

  const onPointerUp = useCallback(() => {
    clearTimer()
    pending.current = null
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  // 卸载时连拖拽监听一起收干净
  useEffect(() => () => cleanup.current?.(), [])

  return { dragging, hoverId, onPointerDown, onPointerMove, onPointerUp }
}
