/**
 * e2e/helpers.ts · 浏览器验证共用断言
 * 把「视觉层级 / 交互节奏 / 可用性」里可被机器判定的部分固定成断言，
 * 这样每次改样式或加关卡都能被自动兜住。
 */
import { expect, type Page } from '@playwright/test'

/** 页面整体不允许出现横向滚动（代码块内部滚动不算） */
export async function expectNoHorizontalScroll(page: Page, label = ''): Promise<void> {
  const { overflow, culprit } = await page.evaluate(() => {
    const de = document.documentElement
    const overflow = de.scrollWidth - de.clientWidth
    let culprit = ''
    if (overflow > 1) {
      document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > de.clientWidth + 1 && !culprit) {
          culprit = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)}`
        }
      })
    }
    return { overflow, culprit }
  })
  expect(overflow, `${label} 出现横向溢出，最可能的元素：${culprit}`).toBeLessThanOrEqual(1)
}

/** 收集运行期错误：控制台 error + 未捕获异常 + 请求失败 */
export function collectPageErrors(page: Page): { errors: string[] } {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('requestfailed', (req) => {
    // 离线用例会主动制造失败请求，交给用例自己过滤
    errors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText ?? ''}`)
  })
  return { errors }
}

interface Target {
  tag: string
  label: string
  w: number
  h: number
}

/**
 * 触摸目标审计：可见的按钮 / 链接 / role=button 命中区必须 ≥44×44。
 * 返回违规清单，由用例决定是断言还是打印。
 */
export async function auditTouchTargets(page: Page): Promise<Target[]> {
  return page.evaluate(() => {
    const out: Array<{ tag: string; label: string; w: number; h: number }> = []
    const nodes = document.querySelectorAll<HTMLElement>(
      'button, a[href], [role="button"], input, select, textarea',
    )
    nodes.forEach((el) => {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      if (r.width >= 44 && r.height >= 44) return
      out.push({
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
        w: Math.round(r.width),
        h: Math.round(r.height),
      })
    })
    return out
  })
}

/** 无障碍最小集：必须有 main 地标、每个按钮都有可读名字、html 有 lang */
export async function auditBasicA11y(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = []
    if (!document.querySelector('main')) problems.push('缺少 <main> 地标')
    if (document.documentElement.getAttribute('lang') !== 'zh-CN') {
      problems.push(`html lang 应为 zh-CN，实际为 ${document.documentElement.getAttribute('lang')}`)
    }
    if (document.querySelectorAll('h1').length === 0) problems.push('页面上没有 h1')
    document.querySelectorAll<HTMLElement>('button').forEach((b) => {
      const name = (b.getAttribute('aria-label') || b.textContent || '').trim()
      if (!name) problems.push(`按钮缺少可读名字：${b.outerHTML.slice(0, 80)}`)
    })
    return problems
  })
}

/** 走完「情境 → 讲一讲 → 动手」两段，停在答题区 */
export async function walkToPlay(page: Page): Promise<void> {
  await page.getByTestId('start-level').click()
  await page.getByTestId('go-play').click()
}

/** 数字键盘输入一串数字 */
export async function typeDigits(page: Page, digits: string): Promise<void> {
  for (const d of digits) {
    await page.getByTestId(`pad-${d}`).click()
  }
}

/** 提交后确认已进入「反馈」段（出现结算按钮） */
export async function expectFeedbackStage(page: Page): Promise<void> {
  await expect(page.getByTestId('go-result')).toBeVisible()
}

/** 从结算页回到地图 */
export async function backToMap(page: Page): Promise<void> {
  await page.getByTestId('back-map').click()
  await expect(page.getByTestId('quick-start')).toBeVisible()
}

/** 整条闯关路径的线性顺序（与 src/content 的 ORDERED_LEVEL_IDS 一致） */
export const LEVEL_ORDER = [
  'C01-01',
  'C01-02',
  'C01-03',
  'C01-04',
  'C01-05',
  'C01-06',
  'D01-01',
  'D01-02',
  'D01-03',
  'D01-04',
  'D01-05',
  'D01-06',
] as const

export interface SeedRecord {
  levelId: string
  stars: number
}

/**
 * 往本地存档（IndexedDB）里塞进度。
 * 为什么需要：闯关是**严格线性**的——没拿到上一关的星，下一关就是锁着的。
 * 所以「直接打开第 5 关来测它的交互」必须先有前 4 关的成绩。
 * 做法：先打开首页让 Dexie 建好库，再用原生 IndexedDB 写入，最后 reload 让应用读到。
 */
export async function seedProgress(page: Page, records: SeedRecord[]): Promise<void> {
  await page.goto('/')
  await page.evaluate(async (recs: SeedRecord[]) => {
    /**
     * 注意：不要写 indexedDB.open('infostar', 1)。
     * Dexie 会把 schema 版本号乘 10 存进 IndexedDB，真实版本是 10，
     * 指定 1 会直接抛 VersionError。这里不指定版本，沿用应用已经建好的库。
     */
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('infostar')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    if (!db.objectStoreNames.contains('levels')) {
      db.close()
      throw new Error('存档库还没建好：请先让页面加载一次再写入')
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('levels', 'readwrite')
      const store = tx.objectStore('levels')
      const now = Date.now()
      for (const r of recs) {
        store.put({
          levelId: r.levelId,
          stars: r.stars,
          attempts: 1,
          lastFirstTryCorrect: 1,
          lastTotal: 1,
          hintsUsed: 0,
          lastAllCorrect: r.stars > 0,
          completedAt: now,
          updatedAt: now,
        })
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }, records)
  await page.reload()
}

/**
 * 把目标关卡之前的所有关卡都记成满星，让目标关卡变成「可以进」。
 * 只影响本用例的隔离上下文，不会污染别的用例。
 */
export async function unlockUpTo(page: Page, levelId: string): Promise<void> {
  const idx = LEVEL_ORDER.indexOf(levelId as (typeof LEVEL_ORDER)[number])
  if (idx < 0) throw new Error(`未知关卡：${levelId}`)
  const prior = LEVEL_ORDER.slice(0, idx)
  if (prior.length === 0) return
  await seedProgress(
    page,
    prior.map((id) => ({ levelId: id, stars: 3 })),
  )
}

/**
 * 直接落在某个关卡的「动手段」，供只关心答题交互的用例使用。
 * 会先把该关解锁，再走完前两段。
 */
export async function openLevel(page: Page, levelId: string): Promise<void> {
  await unlockUpTo(page, levelId)
  await page.goto(`/level/${levelId}`)
  await walkToPlay(page)
}
