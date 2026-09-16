/**
 * scripts/fetch-fonts.mjs · 一次性工具：把显示字体下载到 public/fonts/ 自托管
 * 目的：既满足「不使用通用字体」的排版主张，又满足「不依赖任何外部 CDN」（主方案 §2.3）。
 * 运行：node scripts/fetch-fonts.mjs
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const outDir = path.resolve('public', 'fonts')

const css = await fetch(CSS_URL, { headers: { 'User-Agent': UA } }).then((r) => r.text())
const blocks = css.split('@font-face').filter((b) => b.includes('U+0000-00FF'))

const jobs = []
for (const b of blocks) {
  const weight = /font-weight:\s*([\d ]+)/.exec(b)?.[1]?.trim()
  const url = /url\((https:\/\/[^)]+\.woff2)\)/.exec(b)?.[1]
  if (weight && url) jobs.push({ weight, url })
}

if (jobs.length === 0) {
  console.error('没有解析到字体地址，请检查网络或 Google Fonts 返回内容')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })
for (const { weight, url } of jobs) {
  const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()))
  const file = path.join(outDir, `baloo2-latin-${weight}.woff2`)
  await writeFile(file, buf)
  const { size } = await stat(file)
  console.log(`saved ${path.relative(process.cwd(), file)}  ${size} bytes  <- ${url}`)
}
