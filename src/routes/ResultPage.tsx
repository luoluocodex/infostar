/**
 * routes/ResultPage.tsx · 星级结算页
 * 星星逐颗飞入 + 总数滚动；告诉孩子「怎么拿更多星星」，不做攀比。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { chapterOfLevel, loadChapter, neighbours } from '@/content'
import type { Level } from '@/content/schema'
import { MAX_STARS_PER_LEVEL, computeStars } from '@/engine/grade'
import { zh } from '@/i18n/zh'
import { useProgress } from '@/store/progress'
import { AppHeader, StarRow, useAnimated } from '@/components/common/primitives'
import { Icon } from '@/components/common/Icon'

export function ResultPage() {
  const { levelId = '' } = useParams()
  const navigate = useNavigate()
  const animated = useAnimated()
  const { ready, init, levels, totalStars, isLevelUnlocked } = useProgress()
  const [level, setLevel] = useState<Level | null>(null)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!ready) void init()
  }, [ready, init])

  useEffect(() => {
    const chapter = chapterOfLevel(levelId)
    if (!chapter) return
    let alive = true
    loadChapter(chapter.id).then((ch) => {
      if (!alive) return
      setLevel(ch.levels.find((l) => l.id === levelId) ?? null)
    })
    return () => {
      alive = false
    }
  }, [levelId])

  const record = levels[levelId]
  const stars = record?.stars ?? 0
  const hintsUsed = record?.hintsUsed ?? 0
  const correctCount = record?.lastFirstTryCorrect ?? 0
  const total = record?.lastTotal ?? 1
  // 星星逐颗跳出
  useEffect(() => {
    setShown(0)
    if (!animated) {
      setShown(stars)
      return
    }
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      setShown(i)
      if (i >= stars) window.clearInterval(t)
    }, 340)
    return () => window.clearInterval(t)
  }, [stars, animated])

  /**
   * 星级说明用「产出 stars 的那一次作答」快照反推，
   * 而不是写死 allCorrect: true —— 否则答错时第 1 颗星会错误地显示为已获得，
   * 拿满 3 星时第 2/3 颗星又错误地显示为未获得。
   */
  const explanations = useMemo(() => {
    if (!level) return []
    const t = Math.max(1, record?.lastTotal ?? 1)
    const c = Math.min(Math.max(0, record?.lastFirstTryCorrect ?? 0), t)
    const subs = Array.from({ length: t }, (_, i) => ({ id: `s${i + 1}`, correct: i < c }))
    const allCorrect = record?.lastAllCorrect ?? (record?.stars ?? 0) > 0
    return computeStars(level.stars, { subs, hintsUsed: record?.hintsUsed ?? 0, allCorrect })
      .explanations
  }, [level, record])

  const { next } = neighbours(levelId)
  const nextUnlocked = next ? isLevelUnlocked(next) : false
  const chapterMeta = chapterOfLevel(levelId)
  const nextChapterMeta = next ? chapterOfLevel(next) : null
  /** 这一关是本章最后一关，且下一关已经踏进新地图 */
  const opensNewChapter = Boolean(
    next && nextUnlocked && nextChapterMeta && chapterMeta && nextChapterMeta.id !== chapterMeta.id,
  )
  const chapterMax = (chapterMeta?.levels.length ?? 6) * MAX_STARS_PER_LEVEL

  return (
    <div className="app-shell pt-[max(8px,env(safe-area-inset-top))]">
      <AppHeader
        title={zh.result.title}
        subtitle={level ? `${chapterMeta?.title ?? ''}　${level.title}` : undefined}
        onBack={() => navigate('/')}
      />

      <section className="card overflow-hidden p-5 text-center" style={{ background: 'linear-gradient(160deg,#fffdf8,#fbeedd)' }}>
        <motion.div
          className="mx-auto grid h-16 w-16 place-items-center rounded-full"
          style={{ background: stars > 0 ? 'var(--c-sun)' : 'var(--c-surface-sunken)', color: stars > 0 ? '#fff' : 'var(--c-ink-faint)' }}
          animate={animated && stars > 0 ? { scale: [0.6, 1.14, 1], rotate: [0, -8, 0] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.4, 0.64, 1] }}
          aria-hidden="true"
        >
          <Icon name="star" size={34} filled />
        </motion.div>

        <h2 className="mt-3 text-[var(--t-h2)] font-extrabold">
          {stars > 0 ? zh.result.stars(stars) : zh.result.noStar}
        </h2>

        <div className="mt-3 flex justify-center">
          <StarRow count={shown} size={40} animateIndex={shown - 1} />
        </div>

        <p className="mt-3 text-[14px] text-ink-soft">
          {zh.result.firstTry(correctCount, total)}
          {hintsUsed > 0 ? `　${zh.result.hintUsed(hintsUsed)}` : ''}
        </p>

        <p className="num mt-3 text-[15px] font-bold" style={{ color: 'var(--c-brand-deep)' }}>
          {zh.result.mapSummary(totalStars(), chapterMax)}
        </p>
      </section>

      <section className="card mt-4 p-4">
        <h3 className="mb-2.5 text-[var(--t-h3)] font-extrabold">{zh.result.howToGet}</h3>
        <ul className="space-y-2">
          {explanations.map((e) => (
            <li
              key={e.star}
              data-testid={`star-explain-${e.star}`}
              data-got={e.got ? 'yes' : 'no'}
              className="flex items-center gap-2.5 text-[15px]"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                style={{
                  background: e.got ? 'var(--c-leaf)' : 'var(--c-surface-sunken)',
                  color: e.got ? '#fff' : 'var(--c-ink-faint)',
                }}
                aria-hidden="true"
              >
                <Icon name={e.got ? 'check' : 'starOutline'} size={14} />
              </span>
              <span className="num shrink-0 font-bold">{'★'.repeat(e.star)}</span>
              <span
                className="flex-1"
                style={{
                  color: e.got ? 'var(--c-leaf-deep)' : 'var(--c-ink-soft)',
                  fontWeight: e.got ? 700 : 500,
                }}
              >
                {e.text}
              </span>
              {/* 明确的状态文字：图标 + 颜色对读屏软件不可读，这里补一份可读的 */}
              <span
                className="shrink-0 rounded-full px-2 py-[2px] text-[12px] font-bold"
                style={{
                  background: e.got ? 'var(--c-leaf)' : 'var(--c-surface-sunken)',
                  color: e.got ? '#fff' : 'var(--c-ink-faint)',
                }}
              >
                {e.got ? zh.result.gotStar : zh.result.notYet}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 space-y-2">
        {opensNewChapter && (
          <motion.p
            initial={animated ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-[var(--r-md)] px-3 py-2.5 text-[15px] font-extrabold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}
            role="status"
          >
            <Icon name="sparkle" size={17} />
            {zh.result.nextChapter}
          </motion.p>
        )}
        {next && nextUnlocked && (
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => navigate(`/level/${next}`)}
            data-testid="next-level"
          >
            {opensNewChapter ? zh.result.keepGoing : zh.quick.next}
            <Icon name="arrowRight" size={17} />
          </button>
        )}
        <button type="button" className="btn btn-ghost w-full" onClick={() => navigate('/')} data-testid="back-map">
          {zh.result.backHome}
        </button>
      </div>
    </div>
  )
}
