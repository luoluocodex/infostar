/**
 * engine/blocks/index.ts · 拖拽积木引擎对外入口
 */
export { SLOT_PLACEHOLDER, countSlots, splitSkeleton } from './blockModel'
export type { BlockDef, Skeleton, SkeletonPart, SlotDef, SlotKind } from './blockModel'
export {
  SLOT_KIND_LABEL,
  OP_WHITELIST,
  checkSlotAccepts,
  deriveTray,
  gradeSlots,
  isValidBlockText,
  isValidIndexText,
  isValidOpText,
  renderFilledCode,
} from './slots'
export type { SlotFeedback, SlotFill } from './slots'
export { validateSkeleton } from './validate'
export type { SkeletonIssue } from './validate'
