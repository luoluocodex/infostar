/**
 * content/validate.ts · 题库交叉校验（构建期 + 单测共用）
 * 除了 Zod 结构校验，还做四件「只有跑起来才知道」的事：
 *   1. code-read：引擎真跑一遍，输出必须与 expectedStdout 逐字符一致
 *   2. code-read / code-fill：testInput 的数量必须与 cin 读取次数一致（约定 G1）
 *   3. code-fill：骨架 ___ 个数与槽位数一致，且把标准答案填进去后能跑出 expectedStdout
 *   4. 星级门槛不得超过该关的小题数
 */
import {
  ChapterSchema,
  type Chapter,
  type Level,
  MathManipPayloadSchema,
  MathChoicePayloadSchema,
  CodeFillPayloadSchema,
  CodeReadPayloadSchema,
  MathFillPayloadSchema,
} from './schema'
import { checkCode } from '@/engine/cpp'
import { countSlots, renderFilledCode, validateSkeleton } from '@/engine/blocks'

export interface ContentIssue {
  levelId: string
  where: string
  message: string
}

/** 该关一共有几个「小题」，决定星级门槛的上限 */
export function subItemCount(level: Level): number {
  if (level.type === 'code-fill') {
    const p = CodeFillPayloadSchema.safeParse(level.payload)
    return p.success ? p.data.slots.length : 1
  }
  if (level.type === 'math-manip') {
    const p = MathManipPayloadSchema.safeParse(level.payload)
    return p.success ? (p.data.checkpoints ?? 1) : 1
  }
  return 1
}

export function validateChapter(chapter: Chapter, seenIds: Set<string>): ContentIssue[] {
  const issues: ContentIssue[] = []
  const parsed = ChapterSchema.safeParse(chapter)
  if (!parsed.success) {
    parsed.error.issues.forEach((i) =>
      issues.push({
        levelId: chapter.id ?? '?',
        where: i.path.join('.'),
        message: i.message,
      }),
    )
    // 结构不对就不再往下做更细的检查
    return issues
  }

  const data = parsed.data
  data.levels.forEach((level) => {
    const id = level.id
    const push = (where: string, message: string) => issues.push({ levelId: id, where, message })

    // ---- 编号与归属 ----
    if (seenIds.has(id)) push('id', `关卡 ID 重复：${id}`)
    seenIds.add(id)
    if (!id.startsWith(data.id)) push('id', `关卡 ID 前缀与章节 ${data.id} 不一致`)
    if (level.region !== data.region) push('region', `region 与章节 ${data.region} 不一致`)
    if (level.chapter !== data.id) push('chapter', `chapter 应为 ${data.id}`)
    if (level.chapterTitle !== data.title) push('chapterTitle', `chapterTitle 应为「${data.title}」`)

    // ---- 星级门槛 ----
    const subs = subItemCount(level)
    if (level.stars.three > subs) {
      push('stars', `stars.three=${level.stars.three} 超过小题数 ${subs}`)
    }
    if (level.stars.two > subs) {
      push('stars', `stars.two=${level.stars.two} 超过小题数 ${subs}`)
    }

    // ---- 分题型深度校验 ----
    switch (level.type) {
      case 'code-read': {
        const p = CodeReadPayloadSchema.safeParse(level.payload)
        if (!p.success) break
        const r = checkCode(p.data.code, p.data.testInput, p.data.expectedStdout)
        if (r.error) {
          push('payload.code', `引擎无法执行：第 ${r.error.line} 行 ${r.error.message}`)
          break
        }
        if (r.inputCount !== p.data.testInput.length) {
          push(
            'payload.testInput',
            `程序要读 ${r.inputCount} 个数，但 testInput 给了 ${p.data.testInput.length} 个`,
          )
        }
        if (!r.ok) {
          push(
            'payload.expectedStdout',
            `引擎输出 ${JSON.stringify(r.actual)} 与 expectedStdout ${JSON.stringify(r.expected)} 不一致`,
          )
        }
        if (level.answer !== p.data.expectedStdout) {
          push('answer', 'answer 必须等于 payload.expectedStdout')
        }
        break
      }
      case 'code-fill': {
        const p = CodeFillPayloadSchema.safeParse(level.payload)
        if (!p.success) break
        const skIssues = validateSkeleton(p.data.skeleton, p.data.slots, id)
        skIssues.forEach((i) => push(`payload.${i.slotId}`, i.message))
        if (countSlots(p.data.skeleton) !== p.data.slots.length) break

        // 把标准答案填进去，能跑出期望输出吗？
        if (p.data.demo) {
          const fills: Record<string, string> = {}
          p.data.slots.forEach((s) => {
            fills[s.id] = s.answer
          })
          const filledLine = renderFilledCode(p.data.skeleton, p.data.slots, fills)
          const code = p.data.demo.head + filledLine + p.data.demo.tail
          const r = checkCode(code, p.data.demo.testInput, p.data.demo.expectedStdout)
          if (r.error) {
            push('payload.demo', `填上标准答案后引擎报错：第 ${r.error.line} 行 ${r.error.message}`)
          } else if (!r.ok) {
            push(
              'payload.demo',
              `填上标准答案后输出 ${JSON.stringify(r.actual)}，与期望 ${JSON.stringify(r.expected)} 不一致`,
            )
          }
        }

        // 槽位答案必须与题库 answer 一致
        const ans = level.answer as Record<string, string> | undefined
        if (ans && typeof ans === 'object') {
          p.data.slots.forEach((s) => {
            if (ans[s.id] !== s.answer) {
              push('answer', `answer.${s.id}=${String(ans[s.id])} 与槽位标准答案 ${s.answer} 不一致`)
            }
          })
        }
        break
      }
      case 'math-choice': {
        const p = MathChoicePayloadSchema.safeParse(level.payload)
        if (!p.success) break
        if (typeof level.answer !== 'string' || !p.data.options.some((o) => o.key === level.answer)) {
          push('answer', '答案必须是某个选项的 key')
        }
        break
      }
      case 'math-fill': {
        const p = MathFillPayloadSchema.safeParse(level.payload)
        if (!p.success) break
        if (typeof level.answer !== 'string' || level.answer.trim() === '') {
          push('answer', 'fill 题答案必须是非空字符串')
        }
        break
      }
      case 'math-manip': {
        const p = MathManipPayloadSchema.safeParse(level.payload)
        if (!p.success) break
        const cps = p.data.checkpoints ?? 1
        if (level.stars.three > cps) {
          push('payload.checkpoints', `checkpoints=${cps} 少于 stars.three=${level.stars.three}`)
        }
        break
      }
      default:
        break
    }
  })

  return issues
}
