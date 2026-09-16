/**
 * engine/blocks/blockModel.ts · 拖拽积木（L1 填空式）数据模型
 * 约定 G2：MVP 只做 L1——代码骨架留空槽，槽位类型限「数字 / 运算符 / 下标表达式 / 变量名」。
 */

export type SlotKind = 'num' | 'op' | 'index' | 'var'

export interface SlotDef {
  id: string
  accept: SlotKind[]
  answer: string
}

/** 托盘里的一块积木 */
export interface BlockDef {
  id: string
  label: string
  kind: SlotKind
}

/** 代码骨架：以 ___ 作为槽位占位符 */
export interface Skeleton {
  text: string
  slots: SlotDef[]
}

export const SLOT_PLACEHOLDER = '___'

/** 把骨架切成「文字片段 | 槽位」交替的序列，供渲染层直接使用 */
export type SkeletonPart =
  | { kind: 'text'; text: string }
  | { kind: 'slot'; slotId: string }

export function splitSkeleton(skeleton: string, slots: SlotDef[]): SkeletonPart[] {
  const pieces = skeleton.split(SLOT_PLACEHOLDER)
  const parts: SkeletonPart[] = []
  pieces.forEach((piece, i) => {
    if (piece.length > 0) parts.push({ kind: 'text', text: piece })
    const slot = slots[i]
    if (slot) parts.push({ kind: 'slot', slotId: slot.id })
  })
  return parts
}

export function countSlots(skeleton: string): number {
  return skeleton.split(SLOT_PLACEHOLDER).length - 1
}
