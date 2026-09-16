/**
 * e2e/pwa.spec.ts · 离线能力（渐进增强，绝不能阻断在线使用）
 * 对应主方案 §9.3：仅安全上下文注册 SW；HTTP 入口静默降级为在线模式。
 */
import { expect, test } from '@playwright/test'

test('manifest 可读，图标齐全，可被「添加到主屏幕」', async ({ page }) => {
  await page.goto('/')
  const href = await page.getAttribute('link[rel="manifest"]', 'href')
  expect(href).toBeTruthy()

  const manifest = await page.evaluate(async (url) => {
    const res = await fetch(url!)
    return res.json() as Promise<{
      name: string
      display: string
      start_url: string
      icons: Array<{ src: string; sizes: string }>
    }>
  }, href)

  expect(manifest.name).toContain('信息学闯关')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  )

  for (const icon of manifest.icons) {
    const ok = await page.evaluate(async (src) => {
      const res = await fetch(src)
      return res.ok
    }, `/${icon.src.replace(/^\//, '')}`)
    expect(ok, `图标取不到：${icon.src}`).toBe(true)
  }
})

test('Service Worker 在安全上下文注册成功，并且真的缓存了应用外壳', async ({ page }) => {
  await page.goto('/')
  // localhost 属于安全上下文，这里应当注册（HTTP 局域网入口则会静默跳过）
  const registered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration('/')
    return Boolean(reg)
  })
  expect(registered).toBe(true)

  const cached = await page.evaluate(async () => {
    const names = await caches.keys()
    return names
  })
  expect(cached.length, '应该至少有一个 workbox 预缓存').toBeGreaterThan(0)
})

test('断网后重新打开，仍然能进地图并开始一关（离线可用）', async ({ page, context }) => {
  await page.goto('/')
  // 等 SW 装好并接管
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration('/')
    await reg?.update()
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
        setTimeout(resolve, 4000)
      })
    }
  })
  await page.reload()

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { level: 1 })).toContainText('信息学闯关')
  await expect(page.getByTestId('quick-start')).toBeVisible()

  await page.getByTestId('node-C01-01').click()
  await expect(page.getByTestId('start-level')).toBeVisible()

  await context.setOffline(false)
})
