/**
 * components/question/manip/types.ts · 动手操作类画布的统一契约
 */
import type { Level as FullLevel } from '@/content/schema'
import type { QuestionResult } from '../types'

export interface CanvasProps {
  level: FullLevel
  locked: boolean
  onSubmit: (r: QuestionResult) => void
  onInteract?: () => void
}
