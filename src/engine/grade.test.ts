/**
 * engine/grade.test.ts · 星级 / 解锁 / 答案比对规则单测
 * 规则来源：主方案 §4.2、guides/03 §5。纯函数，无 UI。
 */
import { describe, expect, it } from 'vitest'
import {
  MAX_STARS_PER_LEVEL,
  chapterMaxStars,
  computeStars,
  evaluateUnlock,
  matchNumeric,
  matchText,
  mergeStars,
  normalizeNumeric,
  unlockThreshold,
} from './grade'

const subs = (flags: boolean[]) => flags.map((correct, i) => ({ id: `s${i + 1}`, correct }))

describe('computeStars', () => {
  const th = { two: 3, three: 4 }

  it('没全做完不给星', () => {
    const r = computeStars(th, { subs: subs([true, true, false]), hintsUsed: 0, allCorrect: false })
    expect(r.stars).toBe(0)
  })

  it('全做完但首次错太多 → 1 颗', () => {
    const r = computeStars(th, { subs: subs([false, false, true, true]), hintsUsed: 3, allCorrect: true })
    expect(r.stars).toBe(1)
  })

  it('首次就对 3 个 → 2 颗', () => {
    const r = computeStars(th, {
      subs: subs([true, true, true, false]),
      hintsUsed: 2,
      allCorrect: true,
    })
    expect(r.stars).toBe(2)
  })

  it('首次就对 4 个 → 3 颗', () => {
    const r = computeStars(th, { subs: subs([true, true, true, true]), hintsUsed: 0, allCorrect: true })
    expect(r.stars).toBe(3)
  })

  it('首次不全对，但全程只求助 1 次且最终全对 → 也可以 3 颗（鼓励自己改对）', () => {
    const r = computeStars(th, { subs: subs([true, false, false, true]), hintsUsed: 1, allCorrect: true })
    expect(r.stars).toBe(3)
  })

  it('三条说明都返回给结算页，且 got 与实际一致', () => {
    const r = computeStars(th, { subs: subs([true, true, true, true]), hintsUsed: 0, allCorrect: true })
    expect(r.explanations.map((e) => e.got)).toEqual([true, true, true])
    expect(r.explanations.every((e) => e.text.length > 0)).toBe(true)
  })

  it('空小题列表不会崩（避免除零）', () => {
    const r = computeStars(th, { subs: [], hintsUsed: 0, allCorrect: true })
    expect(r.firstTryRate).toBe(0)
    expect(Number.isFinite(r.firstTryRate)).toBe(true)
  })
})

describe('mergeStars（重玩不倒退，防止刷分焦虑）', () => {
  it('取历史最高', () => {
    expect(mergeStars(3, 1)).toBe(3)
    expect(mergeStars(1, 3)).toBe(3)
    expect(mergeStars(2, 2)).toBe(2)
  })

  it('脏数据（负数 / undefined）也能兜住', () => {
    expect(mergeStars(-5, 2)).toBe(2)
  })
})

describe('解锁规则（前序章节累计 ≥ 60%）', () => {
  it('第一章恒解锁', () => {
    expect(evaluateUnlock(0, [6, 6], [0, 0]).unlocked).toBe(true)
  })

  it('6 关满星 18，门槛是 11 颗（60% 向上取整）', () => {
    expect(chapterMaxStars(6)).toBe(18)
    expect(unlockThreshold(6)).toBe(11)
  })

  it('前一章拿到 11 颗就解锁下一章', () => {
    const s = evaluateUnlock(1, [6, 6], [11, 0])
    expect(s.unlocked).toBe(true)
    expect(s.missing).toBe(0)
  })

  it('差一点就不解锁，并告诉孩子还差几颗', () => {
    const s = evaluateUnlock(1, [6, 6], [8, 0])
    expect(s.unlocked).toBe(false)
    expect(s.missing).toBe(3)
  })

  it('有三章时逐章递进：第二章没达标，第三章也不解锁', () => {
    const s = evaluateUnlock(2, [6, 6, 6], [18, 0, 0])
    expect(s.unlocked).toBe(false)
    expect(s.missing).toBe(11)
  })
})

describe('答案比对（宽容但不放水）', () => {
  it('容忍前后空格', () => {
    expect(matchNumeric(' 42 ', '42')).toBe(true)
  })

  it('容忍全角数字', () => {
    expect(matchNumeric('４２', '42')).toBe(true)
  })

  it('容忍孩子顺手写的单位后缀', () => {
    expect(matchNumeric('42颗', '42')).toBe(true)
    expect(matchNumeric('18 个', '18')).toBe(true)
  })

  it('容忍等价的小数写法', () => {
    expect(matchNumeric('0.50', '0.5')).toBe(true)
  })

  it('答案不同就是错', () => {
    expect(matchNumeric('41', '42')).toBe(false)
  })

  it('normalizeNumeric 会把千分位逗号去掉', () => {
    expect(normalizeNumeric('1,024')).toBe('1024')
  })

  it('文本答案忽略大小写与多余空白', () => {
    expect(matchText('  Hello   World ', 'hello world')).toBe(true)
    expect(matchText('hello', 'world')).toBe(false)
  })
})

describe('星星上限常量', () => {
  it('每关最多 3 颗', () => {
    expect(MAX_STARS_PER_LEVEL).toBe(3)
  })
})

/**
 * 结算页只存了 lastFirstTryCorrect / lastTotal / hintsUsed / lastAllCorrect 四个快照，
 * 再用它们反推出「怎么拿更多星星」三档说明。这组测试锁定一条不变量：
 * 反推出来的星数必须与当初算出的星数完全相等，否则结算页会自相矛盾
 * （标题三颗星、清单说一颗都没拿到）。
 */
describe('结算页快照反推的等价性', () => {
  const cases: Array<{ th: { two: number; three: number }; flags: boolean[]; hints: number; all: boolean }> = [
    { th: { two: 3, three: 4 }, flags: [true, true, true, true], hints: 0, all: true },
    { th: { two: 3, three: 4 }, flags: [true, true, true, false], hints: 2, all: true },
    { th: { two: 3, three: 4 }, flags: [true, false, false, false], hints: 0, all: true },
    { th: { two: 2, three: 3 }, flags: [false, false, true], hints: 1, all: true },
    { th: { two: 1, three: 1 }, flags: [true], hints: 0, all: true },
    { th: { two: 1, three: 1 }, flags: [false], hints: 0, all: false },
    { th: { two: 2, three: 3 }, flags: [false, false, false], hints: 0, all: false },
  ]

  it.each(cases)('反推一致：$flags hints=$hints all=$all', ({ th, flags, hints, all }) => {
    const original = computeStars(th, { subs: subs(flags), hintsUsed: hints, allCorrect: all })

    // 模拟存档里存下的快照，再按 ResultPage 的方式重建
    const lastTotal = original.total
    const lastFirstTryCorrect = original.correctCount
    const rebuilt = computeStars(th, {
      subs: Array.from({ length: Math.max(1, lastTotal) }, (_, i) => ({
        id: `s${i + 1}`,
        correct: i < lastFirstTryCorrect,
      })),
      hintsUsed: hints,
      allCorrect: all,
    })

    expect(rebuilt.stars).toBe(original.stars)
    expect(rebuilt.explanations.map((e) => e.got)).toEqual(original.explanations.map((e) => e.got))
  })

  it('stars > 0 与 allCorrect 互为充要条件', () => {
    for (const all of [true, false]) {
      const r = computeStars({ two: 1, three: 1 }, { subs: subs([true]), hintsUsed: 0, allCorrect: all })
      expect(r.stars > 0).toBe(all)
    }
  })
})
