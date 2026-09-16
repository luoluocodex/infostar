/**
 * e2e/smoke.spec.ts · 首屏与地图：三档手机宽度 + 桌面都要成立的最小事实
 * 覆盖：能打开、无运行期报错、两章 12 关都在、第一章可玩第二章锁着、无横向溢出。
 */
import { expect, test } from '@playwright/test'
import { collectPageErrors, expectNoHorizontalScroll } from './helpers'

const CHAPTER_C = ['C01-01', 'C01-02', 'C01-03', 'C01-04', 'C01-05', 'C01-06']
const CHAPTER_D = ['D01-01', 'D01-02', 'D01-03', 'D01-04', 'D01-05', 'D01-06']

test.describe('闯关地图', () => {
  test('打开首页没有报错，标题与整体进度都在', async ({ page }) => {
    const { errors } = collectPageErrors(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('信息学闯关')
    await expect(page.getByText('总共拿到')).toBeVisible()
    await expect(page.getByTestId('quick-start')).toBeVisible()

    expect(errors, `首屏出现运行期错误：\n${errors.join('\n')}`).toEqual([])
  })

  test('地图上有两章 12 个关卡节点，一个不多一个不少', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('node-C01-01')).toBeVisible()

    for (const id of [...CHAPTER_C, ...CHAPTER_D]) {
      await expect(page.getByTestId(`node-${id}`), `缺少关卡节点 ${id}`).toHaveCount(1)
    }
    await expect(page.locator('[data-testid^="node-"]')).toHaveCount(12)
  })

  test('第一章可以直接玩，第二章一开始锁着（线性闯关）', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('node-C01-01')).toBeEnabled()
    await expect(page.getByTestId('node-C01-02')).toBeDisabled()
    await expect(page.getByTestId('node-D01-01')).toBeDisabled()
    // 锁着的章节要告诉孩子还差几颗星，而不是只给一把锁
    await expect(page.getByText(/再拿 \d+ 颗星/)).toBeVisible()
  })

  test('没有横向溢出（窄屏最容易在这里翻车）', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('node-C01-06')).toBeVisible()
    await expectNoHorizontalScroll(page, `地图 @${page.viewportSize()?.width}px`)
  })

  test('窄屏下长标题与星数标签都不被裁掉', async ({ page }) => {
    await page.goto('/')
    const chapterC = page.getByTestId('chapter-C01')
    await expect(chapterC).toBeVisible()

    const title = chapterC.getByRole('heading', { name: '爬楼梯的秘密' })
    await expect(title).toBeVisible()
    const box = await title.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(80)

    // 两章各自的星数标签（每章 6 关 × 3 星 = 18 颗）都要完整可见、不被裁掉
    await expect(page.getByText('0/18 颗星')).toHaveCount(2)
    for (const id of ['C01', 'D01'] as const) {
      const badge = page.getByTestId(`chapter-${id}`).getByText('0/18 颗星')
      await expect(badge).toBeVisible()
      const b = await badge.boundingBox()
      expect(b, `章节 ${id} 的星数标签没有渲染出来`).not.toBeNull()
      expect(b!.width, `章节 ${id} 的星数标签被压扁了`).toBeGreaterThan(56)
    }
  })
})
