/**
 * engine/blocks/slots.ts · 槽位静态校验
 * 拖入的瞬间就做类型合法性检查，给出即时反馈，不等到提交（主方案 §6.3）。
 */
import type { BlockDef, SlotDef, SlotKind } from './blockModel'

export type SlotFill = string | undefined

export interface SlotFeedback {
  ok: boolean
  /** 儿童化提示，如「这里要放一个运算符哦」 */
  message: string
}

export const SLOT_KIND_LABEL: Record<SlotKind, string> = {
  num: '数字',
  op: '运算符号',
  index: '柜子编号',
  var: '盒子名字',
}

/** 语法层面：这个积木能不能放进这个槽（不看答案对不对） */
export function checkSlotAccepts(slot: SlotDef, block: BlockDef): SlotFeedback {
  if (slot.accept.includes(block.kind)) {
    return { ok: true, message: '放进去啦' }
  }
  const want = slot.accept.map((k) => SLOT_KIND_LABEL[k]).join(' 或 ')
  return { ok: false, message: `这个空格要放${want}，换一块试试？` }
}

/** 下标表达式只允许 变量、变量±数字 这两种写法（L1 限制，避免超纲） */
export function isValidIndexText(text: string): boolean {
  return /^[A-Za-z_]\w*(\s*[+-]\s*\d+)?$/.test(text.trim())
}

/** 运算符白名单（考纲表达式范围内） */
export const OP_WHITELIST = ['+', '-', '*', '/', '%'] as const

export function isValidOpText(text: string): boolean {
  return (OP_WHITELIST as readonly string[]).includes(text.trim())
}

/** 组合校验：按积木自身的 kind 检查其文本是否合法 */
export function isValidBlockText(block: BlockDef): boolean {
  switch (block.kind) {
    case 'num':
      return /^\d+(\.\d+)?$/.test(block.label.trim())
    case 'op':
      return isValidOpText(block.label)
    case 'index':
      return isValidIndexText(block.label)
    case 'var':
      return /^[A-Za-z_]\w*$/.test(block.label.trim())
    default:
      return false
  }
}

/** 渲染填好之后的完整代码（按骨架中 ___ 出现顺序对应 slots） */
export function renderFilledCode(
  skeleton: string,
  slots: SlotDef[],
  fills: Record<string, string>,
): string {
  let i = 0
  return skeleton.replace(/___/g, () => {
    const slot = slots[i]
    i += 1
    const v = slot ? fills[slot.id] : undefined
    return v === undefined || v === '' ? '___' : v
  })
}

/** 逐槽判分 */
export function gradeSlots(
  slots: SlotDef[],
  fills: Record<string, string>,
): { id: string; correct: boolean }[] {
  return slots.map((s) => ({
    id: s.id,
    correct: (fills[s.id] ?? '').trim() === s.answer.trim(),
  }))
}

/** 从答案推导托盘（作者未显式提供托盘时的兜底），并做去重与干扰项补充 */
export function deriveTray(slots: SlotDef[], extra: string[] = []): BlockDef[] {
  const seen = new Set<string>()
  const out: BlockDef[] = []
  slots.forEach((s) => {
    const key = s.answer.trim()
    if (seen.has(key)) return
    seen.add(key)
    out.push({ id: `auto-${s.id}`, label: key, kind: s.accept[0]! })
  })
  extra.forEach((label) => {
    const key = label.trim()
    if (seen.has(key)) return
    seen.add(key)
    out.push({ id: `auto-x-${label}`, label, kind: label.match(/^[+\-*/%]$/) ? 'op' : 'index' })
  })
  return out
}
