/**
 * components/question/QuestionRenderer.tsx · 按题型分发
 */
import type { QuestionProps } from './types'
import { CodeFill } from './CodeFill'
import { CodeRead } from './CodeRead'
import { MathChoice } from './MathChoice'
import { MathFill } from './MathFill'
import { MathManip } from './MathManip'

export function QuestionRenderer(props: QuestionProps) {
  switch (props.level.type) {
    case 'math-choice':
      return <MathChoice {...props} />
    case 'math-fill':
      return <MathFill {...props} />
    case 'math-manip':
      return <MathManip {...props} />
    case 'code-read':
      return <CodeRead {...props} />
    case 'code-fill':
      return <CodeFill {...props} />
    default:
      return null
  }
}
