/**
 * components/question/MathManip.tsx · 动手操作题的分发器
 */
import { MathManipPayloadSchema } from '@/content/schema'
import type { QuestionProps } from './types'
import { CandyCanvas } from './manip/CandyCanvas'
import { StairsCanvas } from './manip/StairsCanvas'
import { VarBoxCanvas } from './manip/VarBoxCanvas'

export function MathManip(props: QuestionProps) {
  const parsed = MathManipPayloadSchema.safeParse(props.level.payload)
  if (!parsed.success) return null

  switch (parsed.data.canvas) {
    case 'stairs':
      return <StairsCanvas {...props} />
    case 'candy':
      return <CandyCanvas {...props} />
    case 'varBox':
      return <VarBoxCanvas {...props} />
    default:
      return null
  }
}
