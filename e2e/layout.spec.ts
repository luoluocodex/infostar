/**
 * e2e/layout.spec.ts · 视觉层级与可用性硬指标
 * 这一组断言对应「移动优先」的底线，任何人改样式都不该把它们改坏：
 *   1. 任何页面在任何宽度下都不横向溢出
 *   2. 触摸目标 ≥44×44，且相互不粘连
 *   3. 无障碍最小集：main 地标、按钮都有可读名字、html lang 正确
 *   4. 正文文字对比度 ≥4.5:1（大字 ≥3:1）
 *   5. 开启「减少动态效果」后，整条闯关闭环仍然能走通
 */
import { expect, test, type Page } from '@playwright/test'
import {
  auditBasicA11y,
  auditTouchTargets,
  expectNoHorizontalScroll,
  openLevel,
  unlockUpTo,
} from './helpers'

const ROUTES = ['/', '/settings', '/level/C01-01', '/level/C01-02', '/level/C01-04', '/level/C01-05']

test.describe('布局与无障碍（每一条路由都要成立）', () => {
  test.beforeEach(async ({ page }) => {
    // 线性闯关：先把 C 区全部记成满星，才能逐条打开各关做布局审查
    await unlockUpTo(page, 'D01-01')
  })

  for (const route of ROUTES) {
    test(`布局与无障碍：${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()

      await expectNoHorizontalScroll(page, route)

      const small = await auditTouchTargets(page)
      expect(
        small,
        `${route} 有 ${small.length} 个触摸目标小于 44px：\n` +
          small.map((t) => `  <${t.tag}>「${t.label}」 ${t.w}×${t.h}`).join('\n'),
      ).toEqual([])

      const a11y = await auditBasicA11y(page)
      expect(a11y, `${route} 无障碍问题：\n${a11y.join('\n')}`).toEqual([])
    })
  }
})

/**
 * 量当前页面上「实色背景上、可直接量到的」文字对比度。
 * 渐变/图片背景交给人工目检；opacity < 0.9 的元素（动画中/禁用态）跳过。
 */
async function measureContrast(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const parse = (c: string): [number, number, number, number] => {
      const m = c.match(/rgba?\(([^)]+)\)/)
      if (!m) return [0, 0, 0, 1]
      const p = m[1]!.split(',').map((x) => parseFloat(x))
      return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p[3] ?? 1]
    }
    const lum = ([r, g, b]: [number, number, number, number]) => {
      const f = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

    const problems: string[] = []
    document.querySelectorAll<HTMLElement>('#root *').forEach((el) => {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim()
      if (!text) return
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') return
      if (parseFloat(cs.opacity) < 0.9) return

      // 往上找到第一个实色背景
      let bg: [number, number, number, number] | null = null
      let node: HTMLElement | null = el
      while (node && !bg) {
        const s = getComputedStyle(node)
        if (s.backgroundImage === 'none') {
          const c = parse(s.backgroundColor)
          if (c[3] > 0.9) bg = c
        }
        node = node.parentElement
      }
      if (!bg) return

      const fg = parse(cs.color)
      const size = parseFloat(cs.fontSize)
      const weight = parseInt(cs.fontWeight, 10) || 400
      const large = size >= 24 || (size >= 18.66 && weight >= 700)
      const need = large ? 3 : 4.5
      const got = ratio(lum(fg), lum(bg))
      if (got < need) {
        problems.push(
          `「${text.slice(0, 18)}」 ${size}px/${weight} 对比度 ${got.toFixed(2)}:1（需要 ${need}）`,
        )
      }
    })
    return problems
  })
}

/** 等入场动画落定后再量，避免量到「正在淡入」的中间态 */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(700)
}

test('正文与辅助文字的对比度都过线（地图 / 讲一讲 / 动手段 / 结算页）', async ({ page }) => {
  // 1) 地图：章节色块、星数标签、卡片文字
  await page.goto('/')
  await expect(page.getByTestId('node-C01-01')).toBeVisible()
  await settle(page)
  const mapLow = await measureContrast(page)
  expect(mapLow, `地图页对比度不达标：\n${mapLow.join('\n')}`).toEqual([])

  // 2) 关卡「讲一讲」：四步法编号徽标（14px 白字）与四色文字
  await page.goto('/level/C01-01')
  await page.getByTestId('start-level').click()
  await expect(page.getByTestId('life-steps')).toBeVisible()
  await settle(page)
  const learnLow = await measureContrast(page)
  expect(learnLow, `「讲一讲」对比度不达标：\n${learnLow.join('\n')}`).toEqual([])

  // 3) 动手段：题干卡、选项/键盘、积木托盘
  await page.getByTestId('go-play').click()
  await expect(page.getByTestId('submit-answer')).toBeVisible()
  await settle(page)
  const playLow = await measureContrast(page)
  expect(playLow, `动手段对比度不达标：\n${playLow.join('\n')}`).toEqual([])

  // 4) 结算页：星星说明（图标 + 颜色 + 文字标签）
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-2').click()
  await page.getByTestId('step-2').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('submit-answer').click()
  await page.getByTestId('go-result').click()
  await expect(page.getByTestId('star-explain-3')).toBeVisible()
  await settle(page)
  const resultLow = await measureContrast(page)
  expect(resultLow, `结算页对比度不达标：\n${resultLow.join('\n')}`).toEqual([])
})

test('开启「减少动态效果」后，闯关闭环依然走得通', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openLevel(page, 'C01-02')
  await page.getByTestId('option-C').click()
  await page.getByTestId('submit-answer').click()
  // 动画被关掉也必须能拿到反馈与结算入口
  await expect(page.getByTestId('go-result')).toBeVisible()
  await page.getByTestId('go-result').click()
  await expect(page.getByRole('heading', { name: /你拿到 ★★★ 啦/ })).toBeVisible()
})

test('键盘可以走完一次作答（焦点态可见、不需要鼠标）', async ({ page }) => {
  await openLevel(page, 'C01-03')

  await page.getByRole('button', { name: '输入 8' }).focus()
  await expect(page.getByRole('button', { name: '输入 8' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('fill-display')).toContainText('8')

  await page.getByTestId('submit-answer').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('go-result')).toBeVisible()
})
