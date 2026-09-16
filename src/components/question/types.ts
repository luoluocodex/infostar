/**
 * components/question/types.ts · 题型组件的统一契约
 */
import type { Level } from '@/content/schema'
import type { SubResult } from '@/engine/grade'

export interface QuestionResult {
  /** 每个「小题」首次作答的结果 */
  subs: SubResult[]
  /** 最终是否全部答对（含改对） */
  allCorrect: boolean
}

export interface QuestionProps {
  level: Level
  /** 已提交进入反馈态：锁定交互，保留学生输入不清空 */
  locked: boolean
  onSubmit: (result: QuestionResult) => void
  /** 学生有任何操作时通知父级（用于停止入场动画等） */
  onInteract?: () => void
}
