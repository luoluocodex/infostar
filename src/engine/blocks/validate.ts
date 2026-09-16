/**
 * engine/blocks/validate.ts · 骨架与槽位的组合校验（构建期也复用）
 */
import type { BlockDef, SlotDef } from './blockModel'
import { countSlots } from './blockModel'
import { isValidBlockText, checkSlotAccepts } from './slots'

export interface SkeletonIssue {
  level: string
  slotId: string
  message: string
}

/**
 * 校验一道 code-fill 题的骨架与槽位自洽性：
 * 1. ___ 的个数必须与 slots 个数一致
 * 2. 每个槽位声明的 accept 必须至少覆盖一个合法类别
 * 3. 答案必须能通过自身 accept 的语法白名单
 */
export function validateSkeleton(
  skeleton: string,
  slots: SlotDef[],
  levelId = '',
): SkeletonIssue[] {
  const issues: SkeletonIssue[] = []
  const n = countSlots(skeleton)
  if (n !== slots.length) {
    issues.push({
      level: levelId,
      slotId: '-',
      message: `骨架里有 ${n} 个空，但定义了 ${slots.length} 个槽位`,
    })
  }
  slots.forEach((s) => {
    if (s.accept.length === 0) {
      issues.push({ level: levelId, slotId: s.id, message: '槽位没有声明 accept 类型' })
      return
    }
    const probe: BlockDef = { id: s.id, label: s.answer, kind: s.accept[0]! }
    const fb = checkSlotAccepts(s, probe)
    if (!fb.ok) {
      issues.push({
        level: levelId,
        slotId: s.id,
        message: `答案「${s.answer}」的类型与 accept 不匹配`,
      })
    }
    if (!isValidBlockText(probe)) {
      issues.push({
        level: levelId,
        slotId: s.id,
        message: `答案「${s.answer}」不符合 ${s.accept[0]} 的写法要求`,
      })
    }
  })
  return issues
}
