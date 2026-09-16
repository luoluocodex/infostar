/**
 * engine/blocks/blocks.test.ts · 拖拽积木引擎单测（L1 填空式，约定 G2）
 * 骨架切分、托槽类型校验、下标/运算符白名单、组合渲染与逐槽判分。
 */
import { describe, expect, it } from 'vitest'
import {
  checkSlotAccepts,
  countSlots,
  deriveTray,
  gradeSlots,
  isValidBlockText,
  isValidIndexText,
  isValidOpText,
  renderFilledCode,
  splitSkeleton,
  validateSkeleton,
} from './index'
import type { SlotDef } from './blockModel'

const slot = (id: string, accept: SlotDef['accept'], answer: string): SlotDef => ({ id, accept, answer })

describe('骨架切分', () => {
  it('数得清有几个空', () => {
    expect(countSlots('for (int i = ___; i < ___; i++)')).toBe(2)
  })

  it('切成「文字 / 槽位」交替序列，供渲染层直接铺开', () => {
    const slots = [slot('s1', ['num'], '0'), slot('s2', ['num'], '5')]
    const parts = splitSkeleton('i = ___; i < ___;', slots)
    expect(parts).toEqual([
      { kind: 'text', text: 'i = ' },
      { kind: 'slot', slotId: 's1' },
      { kind: 'text', text: '; i < ' },
      { kind: 'slot', slotId: 's2' },
      { kind: 'text', text: ';' },
    ])
  })

  it('空 ___ 个数多于槽位定义时，多出来的空被忽略（由 validateSkeleton 报错）', () => {
    const parts = splitSkeleton('a = ___ + ___', [slot('s1', ['num'], '1')])
    expect(parts.filter((p) => p.kind === 'slot')).toHaveLength(1)
  })
})

describe('槽位类型校验（放了就立刻给反馈，不等提交）', () => {
  it('类型对得上就通过', () => {
    const fb = checkSlotAccepts(slot('s1', ['num'], '3'), { id: 'b', label: '3', kind: 'num' })
    expect(fb.ok).toBe(true)
  })

  it('类型不对要给小学语言提示，而不是「类型不匹配」', () => {
    const fb = checkSlotAccepts(slot('s1', ['op'], '+'), { id: 'b', label: '3', kind: 'num' })
    expect(fb.ok).toBe(false)
    expect(fb.message).toContain('运算符号')
  })

  it('一个槽可以同时接受多类积木', () => {
    const s = slot('s1', ['index', 'var'], 'i')
    expect(checkSlotAccepts(s, { id: 'b', label: 'i', kind: 'var' }).ok).toBe(true)
    expect(checkSlotAccepts(s, { id: 'b', label: 'i-1', kind: 'index' }).ok).toBe(true)
  })
})

describe('写作白名单（约定 G2：只允许考纲内写法）', () => {
  it('运算符只放行 + - * / %', () => {
    expect(isValidOpText('+')).toBe(true)
    expect(isValidOpText('%')).toBe(true)
    expect(isValidOpText('**')).toBe(false)
    expect(isValidOpText('<<')).toBe(false)
  })

  it('下标只放行「变量」或「变量 ± 数字」', () => {
    expect(isValidIndexText('i')).toBe(true)
    expect(isValidIndexText('i-1')).toBe(true)
    expect(isValidIndexText('i + 2')).toBe(true)
    expect(isValidIndexText('i*j')).toBe(false)
    expect(isValidIndexText('2')).toBe(false)
  })

  it('数字积木不接受负数与表达式', () => {
    expect(isValidBlockText({ id: 'b', label: '12', kind: 'num' })).toBe(true)
    expect(isValidBlockText({ id: 'b', label: '-1', kind: 'num' })).toBe(false)
    expect(isValidBlockText({ id: 'b', label: '1+1', kind: 'num' })).toBe(false)
  })

  it('变量名必须是合法标识符', () => {
    expect(isValidBlockText({ id: 'b', label: 'sum', kind: 'var' })).toBe(true)
    expect(isValidBlockText({ id: 'b', label: '2sum', kind: 'var' })).toBe(false)
  })
})

describe('骨架 + 槽位组合校验（构建期用）', () => {
  it('自洽的骨架没有意见', () => {
    const issues = validateSkeleton('for (int i = ___; i < ___; i++)', [
      slot('s1', ['num'], '0'),
      slot('s2', ['num'], '5'),
    ])
    expect(issues).toHaveLength(0)
  })

  it('空的数量与槽位数量对不上要报出来', () => {
    const issues = validateSkeleton('a = ___ + ___', [slot('s1', ['num'], '1')])
    expect(issues.some((i) => i.message.includes('2 个空'))).toBe(true)
  })

  it('答案写法不符合 accept 类型要报出来', () => {
    const issues = validateSkeleton('a = ___', [slot('s1', ['op'], '+++')])
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('渲染与判分', () => {
  const slots = [slot('s1', ['num'], '0'), slot('s2', ['op'], '+' )]

  it('把填好的积木按顺序填回骨架，得到可运行的代码', () => {
    const code = renderFilledCode('s = ___ ___ 1;', slots, { s1: '0', s2: '+' })
    expect(code).toBe('s = 0 + 1;')
  })

  it('没填的空保持 ___ 占位（方便一眼看出还差什么）', () => {
    const code = renderFilledCode('s = ___ ___ 1;', slots, { s1: '0' })
    expect(code).toBe('s = 0 ___ 1;')
  })

  it('逐槽判分，返回每个空的首次对错', () => {
    const g = gradeSlots(slots, { s1: '0', s2: '-' })
    expect(g).toEqual([
      { id: 's1', correct: true },
      { id: 's2', correct: false },
    ])
  })

  it('判分忽略前后空格（孩子手滑多打一个空格不算错）', () => {
    const g = gradeSlots([slot('s1', ['num'], '10')], { s1: ' 10 ' })
    expect(g[0]?.correct).toBe(true)
  })
})

describe('托盘推导（作者没写托盘时的兜底）', () => {
  it('按正确答案生成积木，并自动去重', () => {
    const tray = deriveTray([slot('s1', ['num'], '0'), slot('s2', ['num'], '0')])
    expect(tray).toHaveLength(1)
    expect(tray[0]?.label).toBe('0')
  })

  it('额外干扰项会按「是不是运算符」自动判定类型', () => {
    const tray = deriveTray([slot('s1', ['num'], '0')], ['*', 'i+1'])
    const star = tray.find((b) => b.label === '*')
    const idx = tray.find((b) => b.label === 'i+1')
    expect(star?.kind).toBe('op')
    expect(idx?.kind).toBe('index')
  })

  it('干扰项与正确答案重复时不会被塞第二遍', () => {
    const tray = deriveTray([slot('s1', ['num'], '1')], ['1'])
    expect(tray).toHaveLength(1)
  })
})
