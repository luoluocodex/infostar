/**
 * playwright.config.ts · 真实浏览器验证（手机视口优先）
 * 用法：
 *   npm run e2e              # 全量（先自动构建 + 起 preview）
 *   npm run e2e -- --ui      # 交互式调试
 * 说明：默认只跑 Chromium；三档手机宽度覆盖 360 / 390 / 430。
 */
import { defineConfig } from '@playwright/test'

const PORT = 4173
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`

/** 手机视口预设（Chromium 的 isMobile/hasTouch 才能真实模拟触摸与手势） */
const phone = (width: number, height: number) => ({
  viewport: { width, height },
  deviceScaleFactor: 2,
  isMobile: true as const,
  hasTouch: true as const,
})

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Windows 下并发 worker 同时落盘 trace/截图会互相锁定文件（EPERM），
  // 因此本机固定 4 个 worker，CI 更保守用 2 个。
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  },

  projects: [
    {
      // 主力机型：整条闭环都跑在这一档
      name: 'phone-390',
      use: phone(390, 844),
    },
    {
      // 最窄的现实机型（iPhone SE / 老安卓）：只跑布局与可见性检查
      name: 'phone-360',
      testMatch: /(smoke|layout)\.spec\.ts/,
      use: phone(360, 780),
    },
    {
      // 大屏手机（Pro Max 档）：只跑布局与可见性检查
      name: 'phone-430',
      testMatch: /(smoke|layout)\.spec\.ts/,
      use: phone(430, 932),
    },
    {
      // 桌面：只验证「居中约束 + 不溢出」，防止手机版在桌面上被拉成一张大饼
      name: 'desktop',
      testMatch: /(smoke|layout)\.spec\.ts/,
      use: { viewport: { width: 1280, height: 900 } },
    },
  ],

  webServer: {
    // 直接起 vite，不要套一层 npm——
    // Windows 上 npm 会再派生子进程，Playwright 收工时容易留下孤儿进程，
    // 表现为「worker process did not exit within 300000ms, force-killed it」。
    command: `node node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
})
