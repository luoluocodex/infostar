/**
 * components/question/useAnswerFlow.ts · 单小题的作答流程
 * 规则：第一次提交即记录「首次作答」结果；答错后保留输入、可改可再交；
 *      连续错 2 次后开放「看看怎么做」，避免卡死（主方案 §11 风险 R8）。
 */
import { useCallback, useState } from 'react'
import type { QuestionResult } from './types'

export const REVEAL_AFTER = 2

export interface AnswerFlow {
  /** 是否已经答对并完成本关 */
  solved: boolean
  /** 是否已经查看答案（也视为完成） */
  revealed: boolean
  /** 已经提交过几次 */
  attempts: number
  /** 刚刚答错（用于抖动与提示） */
  justWrong: boolean
  /** 是否可以查看答案了 */
  canReveal: boolean
  /** 提交一次作答 */
  attempt: (correct: boolean) => void
  /** 查看答案并结束本关 */
  reveal: () => void
}

export function useAnswerFlow(onSubmit: (r: QuestionResult) => void): AnswerFlow {
  const [attempts, setAttempts] = useState(0)
  const [firstTry, setFirstTry] = useState<boolean | null>(null)
  const [solved, setSolved] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [justWrong, setJustWrong] = useState(false)

  const attempt = useCallback(
    (correct: boolean) => {
      if (solved || revealed) return
      const n = attempts + 1
      setAttempts(n)
      if (n === 1) setFirstTry(correct)
      if (correct) {
        setSolved(true)
        setJustWrong(false)
        onSubmit({
          subs: [{ id: 'q1', correct: n === 1 ? true : (firstTry ?? true) }],
          allCorrect: true,
        })
      } else {
        setJustWrong(true)
        window.setTimeout(() => setJustWrong(false), 700)
      }
    },
    [attempts, firstTry, onSubmit, revealed, solved],
  )

  const reveal = useCallback(() => {
    if (solved || revealed) return
    setRevealed(true)
    onSubmit({ subs: [{ id: 'q1', correct: false }], allCorrect: true })
  }, [onSubmit, revealed, solved])

  return {
    solved,
    revealed,
    attempts,
    justWrong,
    canReveal: !solved && !revealed && attempts >= REVEAL_AFTER,
    attempt,
    reveal,
  }
}
