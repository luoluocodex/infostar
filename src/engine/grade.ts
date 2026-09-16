/**
 * engine/grade.ts · 判分、星级与解锁规则
 * 星级规则来源：主方案 §4.2 / guides/03 §5。
 *   ★   完成本关全部小题
 *   ★★  首次作答正确数 ≥ stars.two
 *   ★★★ 首次作答正确数 ≥ stars.three（或全程只用了 ≤1 次提示且最终全对）
 * 纯函数，可在 Node 下单测。
 */

export interface SubResult {
  id: string
  /** 首次作答是否正确 */
  correct: boolean
}

export interface LevelOutcome {
  subs: SubResult[]
  hintsUsed: number
  /** 学生最终是否把所有空都填对/答对（含改对） */
  allCorrect: boolean
}

export interface StarThresholds {
  two: number
  three: number
}

export interface StarExplanation {
  star: 1 | 2 | 3
  got: boolean
  text: string
}

export interface StarResult {
  stars: 0 | 1 | 2 | 3
  correctCount: number
  total: number
  firstTryRate: number
  explanations: StarExplanation[]
}

export const MAX_STARS_PER_LEVEL = 3

export function computeStars(
  thresholds: StarThresholds,
  outcome: LevelOutcome,
): StarResult {
  const total = outcome.subs.length
  const correctCount = outcome.subs.filter((s) => s.correct).length
  const firstTryRate = total === 0 ? 0 : correctCount / total

  const one = outcome.allCorrect
  const two = one && correctCount >= thresholds.two
  const three = one && (correctCount >= thresholds.three || outcome.hintsUsed <= 1)
  const stars: 0 | 1 | 2 | 3 = !one ? 0 : three ? 3 : two ? 2 : 1

  return {
    stars,
    correctCount,
    total,
    firstTryRate,
    explanations: [
      { star: 1, got: one, text: '把这一关全部做完' },
      { star: 2, got: two, text: `第一次就做对 ${thresholds.two} 个以上` },
      { star: 3, got: three, text: `第一次就做对 ${thresholds.three} 个（或只求助 1 次且全对）` },
    ],
  }
}

/** 重玩只刷新记录，星星保留历史最高值（防止刷分焦虑） */
export function mergeStars(previous: number, next: number): number {
  return Math.max(previous | 0, next | 0)
}

/** 整章满星数 */
export function chapterMaxStars(levelCount: number): number {
  return levelCount * MAX_STARS_PER_LEVEL
}

/** 解锁下一章所需的星数：前序章节累计 ≥ 60% */
export function unlockThreshold(previousChapterLevelCount: number): number {
  return Math.ceil(0.6 * chapterMaxStars(previousChapterLevelCount))
}

export interface UnlockState {
  unlocked: boolean
  need: number
  have: number
  missing: number
}

/**
 * 判断第 index 章是否解锁（index 从 0 开始）。
 * index === 0 恒解锁；其余需前序各章都达标（逐章递进，避免跳级劝退）。
 */
export function evaluateUnlock(
  chapterIndex: number,
  chapterLevelCounts: number[],
  earnedStars: number[],
): UnlockState {
  if (chapterIndex <= 0) return { unlocked: true, need: 0, have: 0, missing: 0 }
  let unlocked = true
  let need = 0
  let have = 0
  for (let i = 0; i < chapterIndex; i++) {
    const chapterNeed = unlockThreshold(chapterLevelCounts[i] ?? 0)
    const chapterHave = earnedStars[i] ?? 0
    need += chapterNeed
    have += Math.min(chapterHave, chapterNeed)
    if (chapterHave < chapterNeed) unlocked = false
  }
  return { unlocked, need, have, missing: unlocked ? 0 : Math.max(0, need - have) }
}

/** 数值答案判分：容忍前后空格、全角数字、中文单位后缀、等值小数写法 */
export function normalizeNumeric(input: string): string {
  return input
    .trim()
    .replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10))
    .replace(/[，,]/g, '')
    .replace(/[颗个只人对次种元分钟米级层步条个台阶\s]/g, '')
    .replace(/。/g, '')
}

export function matchNumeric(input: string, answer: string): boolean {
  const a = normalizeNumeric(input)
  const b = normalizeNumeric(answer)
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-9
  return false
}

/** 文本答案判分：忽略首尾空格与大小写，压缩内部空白 */
export function matchText(input: string, answer: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
  return norm(input) === norm(answer)
}
