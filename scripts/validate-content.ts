/**
 * scripts/validate-content.ts · 题库构建期校验（校验不过 → 直接构建失败）
 * 依据：docs/guides/03-内容与题库规范.md §7 / §8，主方案 §6.4。
 * 运行：npm run validate:content
 */
import { CHAPTER_META, loadAllChapters } from '../src/content'
import { LevelSchema } from '../src/content/schema'
import { validateChapter, type ContentIssue } from '../src/content/validate'
import { checkCode } from '../src/engine/cpp'

const EXPECTED_MVP_LEVELS = 12
const MVP_TYPES = new Set(['math-choice', 'math-fill', 'math-manip', 'code-read', 'code-fill'])

async function main(): Promise<void> {
  const issues: ContentIssue[] = []
  const chapters = await loadAllChapters()
  const seenIds = new Set<string>()

  for (const chapter of chapters) {
    // 1) 逐题 Zod 结构校验
    chapter.levels.forEach((level) => {
      const r = LevelSchema.safeParse(level)
      if (!r.success) {
        r.error.issues.forEach((i) => {
          issues.push({
            levelId: level.id,
            where: i.path.join('.') || '(root)',
            message: i.message,
          })
        })
      }
    })

    // 2) 交叉校验（引擎跑一遍、槽位自洽、星级门槛…）
    issues.push(...validateChapter(chapter, seenIds))

    // 3) 目录（CHAPTER_META）与内容文件必须一致，防止地图与题目脱节
    const meta = CHAPTER_META.find((m) => m.id === chapter.id)
    if (!meta) {
      issues.push({ levelId: chapter.id, where: 'CHAPTER_META', message: '章节未登记在地图目录中' })
      continue
    }
    if (meta.region !== chapter.region) {
      issues.push({ levelId: chapter.id, where: 'CHAPTER_META.region', message: '区域号不一致' })
    }
    if (meta.title !== chapter.title) {
      issues.push({ levelId: chapter.id, where: 'CHAPTER_META.title', message: '章节标题不一致' })
    }
    if (meta.levels.length !== chapter.levels.length) {
      issues.push({
        levelId: chapter.id,
        where: 'CHAPTER_META.levels',
        message: `关数不一致：目录 ${meta.levels.length}，内容 ${chapter.levels.length}`,
      })
    }
    chapter.levels.forEach((level, i) => {
      const m = meta.levels[i]
      if (!m) {
        issues.push({ levelId: level.id, where: 'CHAPTER_META.levels', message: '目录缺少这一关' })
        return
      }
      if (m.id !== level.id) {
        issues.push({ levelId: level.id, where: 'CHAPTER_META.levels.order', message: `顺序不一致（目录为 ${m.id}）` })
      }
      if (m.title !== level.title) {
        issues.push({ levelId: level.id, where: 'CHAPTER_META.title', message: '关名与地图目录不一致' })
      }
      if (m.type !== level.type) {
        issues.push({ levelId: level.id, where: 'CHAPTER_META.type', message: '题型与地图目录不一致' })
      }
      if (m.difficulty !== level.difficulty) {
        issues.push({ levelId: level.id, where: 'CHAPTER_META.difficulty', message: '难度与地图目录不一致' })
      }
    })

    // 4) 每章必须绑定生活化类比（四段式已由 Zod 保证），这里只统计
    chapter.levels.forEach((level) => {
      if (!MVP_TYPES.has(level.type)) {
        issues.push({ levelId: level.id, where: 'type', message: `${level.type} 不属于 MVP 题型范围` })
      }
    })
  }

  // 5) MVP 范围：2 章 12 关
  const totalLevels = chapters.reduce((n, c) => n + c.levels.length, 0)
  if (totalLevels !== EXPECTED_MVP_LEVELS) {
    issues.push({
      levelId: '-',
      where: 'MVP',
      message: `MVP 应为 ${EXPECTED_MVP_LEVELS} 关，实际 ${totalLevels} 关`,
    })
  }

  // 6) 所有 code-read 交叉验证汇总（重复一次，输出可见）
  const codeLevels = chapters.flatMap((c) => c.levels).filter((l) => l.type === 'code-read')
  console.log(`\n题库校验 · 共 ${chapters.length} 章 / ${totalLevels} 关`)
  console.log(`其中程序阅读题 ${codeLevels.length} 道，逐题用引擎跑过一遍：`)
  codeLevels.forEach((l) => {
    const p = l.payload as { code: string; testInput: number[]; expectedStdout: string }
    const r = checkCode(p.code, p.testInput, p.expectedStdout)
    console.log(
      `  ${l.id} ${l.title}（${l.source.kind}）→ 引擎输出 ${JSON.stringify(r.actual)} ${
        r.ok ? '✔ 与期望一致' : '✘ 不一致'
      }，需读入 ${r.inputCount} 个数，testInput 给了 ${p.testInput.length} 个`,
    )
  })

  const byDifficulty = new Map<number, number>()
  chapters
    .flatMap((c) => c.levels)
    .forEach((l) => byDifficulty.set(l.difficulty, (byDifficulty.get(l.difficulty) ?? 0) + 1))
  console.log(
    `难度分布：${[...byDifficulty.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([d, n]) => `Lv${d}×${n}`)
      .join('　')}`,
  )
  const bySource = new Map<string, number>()
  chapters
    .flatMap((c) => c.levels)
    .forEach((l) => bySource.set(l.source.kind, (bySource.get(l.source.kind) ?? 0) + 1))
  console.log(
    `来源分布：${[...bySource.entries()].map(([k, n]) => `${k}×${n}`).join('　')}`,
  )

  if (issues.length > 0) {
    console.error(`\n✘ 校验未通过，共 ${issues.length} 个问题：`)
    issues.forEach((i) => console.error(`  [${i.levelId}] ${i.where} — ${i.message}`))
    process.exit(1)
  }

  console.log('\n✔ 题库校验全部通过\n')
}

main().catch((err) => {
  console.error('校验脚本自身出错：', err)
  process.exit(1)
})
