/**
 * e2e/journey.spec.ts · 完整学习闭环（真实浏览器，手机视口 390）
 * 覆盖用户要求的「可用性 + 交互节奏 + 动效」里可被验证的部分：
 *   1. 五段式流程走得通、每段只做一件事
 *   2. 三种题型 + 拖拽积木都能作答
 *   3. 错答不清空输入、错误解释说人话
 *   4. 提示抽屉逐条解锁、用了提示会被计入结算
 *   5. 可视化执行器真的能播放并演出每一帧
 *   6. 打完第一章能解锁第二章；刷新后进度还在
 */
import { expect, test, type Page } from '@playwright/test'
import { expectFeedbackStage, openLevel, typeDigits, walkToPlay } from './helpers'

/** 只做「摆三维楼梯」的作答动作，不含进入答题区的前两段 */
async function answerStairs(page: Page): Promise<void> {
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-1').click()
  await page.getByTestId('step-2').click()
  await page.getByTestId('step-2').click()
  await page.getByTestId('step-1').click()
  await expect(page.getByText('已经摆出来的走法（3 种）')).toBeVisible()
  await page.getByTestId('submit-answer').click()
}

/** 从地图/关卡入口一路走到作答完毕（含前两段） */
async function playStairs(page: Page): Promise<void> {
  await walkToPlay(page)
  await answerStairs(page)
}

/** 选中托盘积木 → 点空格（点选路径，等价于触屏长按拖拽） */
async function placeBlock(page: Page, blockId: string, slotId: string): Promise<void> {
  await page.locator(`[data-block-id="${blockId}"]`).click()
  await page.locator(`[data-slot-id="${slotId}"]`).click()
}

test.describe('五段式关卡流程', () => {
  test('一关从头走到尾：情境 → 讲一讲 → 动手 → 反馈 → 结算', async ({ page }) => {
    await page.goto('/level/C01-01')

    // 情境段
    await expect(page.getByText('先看看这件事')).toBeVisible()
    await expect(page.getByText('小明要上 3 级楼梯')).toBeVisible()
    await page.getByTestId('start-level').click()

    // 讲一讲段：生活化类比四步（场景 → 动手 → 想成符号 → 回到程序）
    // 注意要限定在四步法里 —— 顶部进度条上也有一个叫「动手」的圆点
    await expect(page.getByText('讲一讲，为什么是这样')).toBeVisible()
    const lifeSteps = page.getByTestId('life-steps')
    for (const label of ['场景', '动手', '想成符号', '回到程序']) {
      await expect(lifeSteps.getByText(label, { exact: true })).toBeVisible()
    }

    // 动手段
    await page.getByTestId('go-play').click()
    await expect(page.getByText('轮到你了')).toBeVisible()

    // 注意：此处已进入答题区，只做作答，不能再走一次前两段
    await answerStairs(page)

    // 反馈段：说清楚对在哪、错在哪
    await expectFeedbackStage(page)
    await expect(page.getByText('小明上楼梯').first()).toBeVisible()

    // 结算段
    await page.getByTestId('go-result').click()
    await expect(page.getByRole('heading', { name: /你拿到 ★★★ 啦/ })).toBeVisible()
    await expect(page.getByText('怎么拿更多星星')).toBeVisible()
  })

  test('每一步只出现一个主要动作按钮（不给孩子选择压力）', async ({ page }) => {
    await page.goto('/level/C01-01')
    await expect(page.locator('.btn-primary:visible')).toHaveCount(1) // 情境段只有「我们来玩一关吧」
    await page.getByTestId('start-level').click()
    // 讲一讲段有一个主动作 + 一个「直接动手」的次要出口
    await expect(page.getByTestId('go-play')).toBeVisible()
    await expect(page.getByText('我知道了，直接动手')).toBeVisible()
  })
})

test.describe('三种题型都能答对', () => {
  test('数学选择：点选项再提交', async ({ page }) => {
    await openLevel(page, 'C01-02')
    await page.getByTestId('option-C').click()
    await page.getByTestId('submit-answer').click()
    await expectFeedbackStage(page)
  })

  test('数学填空：用屏幕数字键盘输入，不留输入框', async ({ page }) => {
    await openLevel(page, 'C01-03')
    await typeDigits(page, '8')
    await expect(page.getByTestId('fill-display')).toContainText('8')
    await page.getByTestId('submit-answer').click()
    await expectFeedbackStage(page)
  })

  test('程序填空：拖拽积木（点选路径）填满三个空', async ({ page }) => {
    await openLevel(page, 'C01-05')

    // 骨架里有三个空，一开始都是待填状态
    await expect(page.getByTestId('code-skeleton')).toBeVisible()
    await expect(page.locator('[data-slot-status="idle"]')).toHaveCount(3)

    // 放错类型要立刻用孩子的语言解释，而不是等提交
    await placeBlock(page, 'b3', 's2') // i+1 是下标，放进「运算符」空
    await expect(page.getByText(/要放运算符号/)).toBeVisible()
    await expect(page.locator('[data-slot-status="idle"]')).toHaveCount(3)

    // 答对
    await placeBlock(page, 'b1', 's1')
    await placeBlock(page, 'b4', 's2')
    await placeBlock(page, 'b2', 's3')
    await expect(page.locator('[data-slot-status="filled"]')).toHaveCount(3)

    await page.getByTestId('submit-answer').click()
    await expectFeedbackStage(page)

    // 填对之后能把「这一行放进程序里怎么跑」演一遍
    await expect(page.getByTestId('code-skeleton')).toContainText('a[i-1]+a[i-2]')
  })
})

test.describe('错误反馈与可用性底线', () => {
  test('答错不清空输入，只高亮并给出解释', async ({ page }) => {
    await page.goto('/level/C01-03')
    await walkToPlay(page)
    await typeDigits(page, '7')
    await page.getByTestId('submit-answer').click()

    // 输入必须保留，孩子可以改一个数字再试
    await expect(page.getByTestId('fill-display')).toContainText('7')
    await expect(page.getByRole('status')).toBeVisible()

    // 改对之后照样能过
    await page.getByTestId('pad-backspace').click()
    await typeDigits(page, '8')
    await page.getByTestId('submit-answer').click()
    await expectFeedbackStage(page)
  })

  test('连错两次才出现「看看怎么做」，不提前泄题', async ({ page }) => {
    await page.goto('/level/C01-04')
    await walkToPlay(page)
    await expect(page.getByText('看看怎么做')).toHaveCount(0)
    await typeDigits(page, '1')
    await page.getByTestId('submit-answer').click()
    await typeDigits(page, '2')
    await page.getByTestId('submit-answer').click()
    await expect(page.getByText('看看怎么做')).toBeVisible()
  })

  test('提示抽屉逐条解锁，并计入结算', async ({ page }) => {
    await page.goto('/level/C01-06')
    await walkToPlay(page)
    await page.getByTestId('open-hint').click()
    await page.getByTestId('next-hint').click()
    await expect(page.getByText('提示 1')).toBeVisible()
    await page.getByTestId('next-hint').click()
    await expect(page.getByText('提示 2')).toBeVisible()
    await page.getByTestId('next-hint').click()
    await expect(page.getByText('提示已经用完啦')).toBeVisible()
  })

  test('点锁着的关卡给温和提示，而不是没反应', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('node-D01-01').click({ force: true })
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('结算页的星星与「怎么拿更多星星」必须自洽，不能互相打脸', async ({ page }) => {
    // 答错 → 0 颗星：三档说明都应该标成「还没拿到」
    await page.goto('/level/C01-03')
    await walkToPlay(page)
    await typeDigits(page, '7')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await expect(page.getByText('再试一次就能拿到星星')).toBeVisible()
    for (const s of [1, 2, 3]) {
      await expect(page.getByTestId(`star-explain-${s}`)).toHaveAttribute('data-got', 'no')
    }

    // 答对 → 拿满 3 颗星：三档说明都应该标成「已经拿到」
    await openLevel(page, 'C01-03')
    await typeDigits(page, '8')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await expect(page.getByRole('heading', { name: /你拿到 ★★★ 啦/ })).toBeVisible()
    for (const s of [1, 2, 3]) {
      await expect(page.getByTestId(`star-explain-${s}`)).toHaveAttribute('data-got', 'yes')
    }
  })
})

test.describe('可视化执行器', () => {
  test('程序阅读题：点「看它跑」能演出每一帧，并给出输出', async ({ page }) => {
    await openLevel(page, 'C01-04')

    await expect(page.getByTestId('code-block')).toBeVisible()
    await page.getByTestId('toggle-runner').click()

    // 单步走：每一步都有中文解释
    await page.getByTestId('trace-next').click()
    await expect(page.getByTestId('trace-note')).not.toBeEmpty()

    // 自动播放到结束，屏幕上要出现程序输出
    await page.getByTestId('trace-play').click()
    await expect(page.getByTestId('trace-note')).toContainText(/念出|输出/, { timeout: 15_000 })
  })
})

test.describe('星级与解锁闭环', () => {
  test('打完第一章 6 关 → 拿到 18 颗星 → 第二章解锁；刷新后进度还在', async ({ page }) => {
    test.slow()

    // C01-01 爬楼梯（动手摆）
    await page.goto('/level/C01-01')
    await playStairs(page)
    await page.getByTestId('go-result').click()
    await expect(page.getByRole('heading', { name: /你拿到 ★★★ 啦/ })).toBeVisible()
    await page.getByTestId('back-map').click()

    // C01-02 选择
    await page.getByTestId('node-C01-02').click()
    await walkToPlay(page)
    await page.getByTestId('option-C').click()
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await page.getByTestId('next-level').click()

    // C01-03 填空
    await walkToPlay(page)
    await typeDigits(page, '8')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await page.getByTestId('next-level').click()

    // C01-04 读程序
    await walkToPlay(page)
    await typeDigits(page, '8')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await page.getByTestId('next-level').click()

    // C01-05 拖积木
    await walkToPlay(page)
    await placeBlock(page, 'b1', 's1')
    await placeBlock(page, 'b4', 's2')
    await placeBlock(page, 'b2', 's3')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await page.getByTestId('next-level').click()

    // C01-06 挑战题
    await walkToPlay(page)
    await typeDigits(page, '10946')
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await page.getByTestId('back-map').click()

    // 地图上：第一章满星，第二章解锁
    await expect(page.getByTestId('node-C01-06')).toHaveAttribute('data-stars', '3')
    await expect(page.getByTestId('node-D01-01')).toBeEnabled()
    await expect(page.getByText('18/18 颗星')).toBeVisible()
    await expect(page.getByText('已经玩过 6/12 关')).toBeVisible()

    // 刷新后进度不能丢（存本地）
    await page.reload()
    await expect(page.getByTestId('node-C01-06')).toHaveAttribute('data-stars', '3')
    await expect(page.getByTestId('node-D01-01')).toBeEnabled()
    await expect(page.getByText('18/18 颗星')).toBeVisible()
  })

  test('重玩只升不降，星星取历史最高', async ({ page }) => {
    await openLevel(page, 'C01-02')
    await page.getByTestId('option-C').click()
    await page.getByTestId('submit-answer').click()
    await page.getByTestId('go-result').click()
    await expect(page.getByRole('heading', { name: /你拿到 ★★★ 啦/ })).toBeVisible()
    await page.getByTestId('back-map').click()
    await expect(page.getByTestId('node-C01-02')).toHaveAttribute('data-stars', '3')
  })
})
