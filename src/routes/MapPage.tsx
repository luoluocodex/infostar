/**
 * routes/MapPage.tsx · 闯关地图（主页）
 * 线性两章 12 关；节点沿一条蜿蜒小路排布，完成填色、当前呼吸、未解锁灰暗带锁。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CHAPTER_META, totalLevelCount } from '@/content'
import { zh } from '@/i18n/zh'
import { useProgress } from '@/store/progress'
import { Icon } from '@/components/common/Icon'
import { StarRow, useAnimated } from '@/components/common/primitives'

export function MapPage() {
  const navigate = useNavigate()
  const animated = useAnimated()
  const store = useProgress()
  const {
    ready,
    init,
    levels,
    nickname,
    streakDays,
    totalStars,
    maxStars,
    completedCount,
    chapterEarned,
    chapterUnlock,
    isLevelUnlocked,
    lastCompletedLevelId,
    clearJustCompleted,
  } = store

  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) void init()
  }, [ready, init])

  useEffect(() => {
    if (!tip) return
    const t = window.setTimeout(() => setTip(null), 2600)
    return () => window.clearTimeout(t)
  }, [tip])

  useEffect(() => {
    if (!lastCompletedLevelId) return
    const t = window.setTimeout(() => clearJustCompleted(), 3200)
    return () => window.clearTimeout(t)
  }, [lastCompletedLevelId, clearJustCompleted])

  /** 下一关：第一个已解锁且未拿星的关卡；都玩完了就回到最后一关 */
  const nextLevelId = useMemo(() => {
    const all = CHAPTER_META.flatMap((c) => c.levels.map((l) => l.id))
    const pending = all.find((id) => isLevelUnlocked(id) && (levels[id]?.stars ?? 0) === 0)
    if (pending) return pending
    return [...all].reverse().find((id) => isLevelUnlocked(id)) ?? all[0] ?? null
  }, [levels, isLevelUnlocked])

  const got = totalStars()
  const max = maxStars()

  return (
    <div className="app-shell pt-[max(14px,env(safe-area-inset-top))]">
      {/* ---------- 顶部 ---------- */}
      <header className="mb-4 flex items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: 'var(--c-brand)', color: '#fff', boxShadow: 'var(--sh-card)' }}
          aria-hidden="true"
        >
          <Icon name="flag" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[var(--t-h1)] font-extrabold leading-tight">{zh.app.name}</h1>
          <p className="text-[13px] text-ink-soft">
            {nickname ? `${nickname}，${zh.map.greeting}` : zh.app.tagline}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label={zh.nav.settings}
          className="tap-target grid place-items-center rounded-2xl border bg-surface"
          style={{ borderColor: 'var(--c-line-strong)', width: 48, height: 48 }}
        >
          <Icon name="gear" size={22} />
        </button>
      </header>

      {/* ---------- 概览 ---------- */}
      <section
        className="card mb-4 overflow-hidden p-4"
        style={{ background: 'linear-gradient(150deg, #fffdf8 0%, #fbeedd 100%)' }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[12px] font-bold text-ink-faint">{zh.map.totalGot}</div>
            <div className="num mt-0.5 text-[44px] font-bold leading-none">
              {got}
              <span className="text-[18px] text-ink-faint"> / {max}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}>
              <Icon name="sparkle" size={14} />
              {zh.map.streak(streakDays)}
            </div>
            <div className="mt-1.5 text-[12px] text-ink-soft">
              {zh.map.totalProgress(completedCount(), totalLevelCount())}
            </div>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--c-surface-sunken)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#F5B23C,#E9612F)' }}
            initial={{ width: 0 }}
            animate={{ width: `${max === 0 ? 0 : Math.round((got / max) * 100)}%` }}
            transition={{ duration: animated ? 0.7 : 0, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {nextLevelId && (
          <button
            type="button"
            onClick={() => navigate(`/level/${nextLevelId}`)}
            className="btn btn-primary mt-4 w-full"
            data-testid="quick-start"
          >
            <Icon name="play" size={16} filled />
            {completedCount() === 0 ? zh.quick.start : zh.map.continueHere}
          </button>
        )}
      </section>

      {/* ---------- 章节地图 ---------- */}
      {CHAPTER_META.map((chapter) => {
        const unlock = chapterUnlock(chapter.id)
        const earned = chapterEarned(chapter.id)
        const chapterMax = chapter.levels.length * 3
        const accent = chapter.accent === 'c' ? 'var(--c-region-c)' : 'var(--c-region-d)'
        const accentDeep = chapter.accent === 'c' ? 'var(--c-region-c-deep)' : 'var(--c-region-d-deep)'
        const accentSoft = chapter.accent === 'c' ? 'var(--c-region-c-soft)' : 'var(--c-region-d-soft)'

        return (
          <section key={chapter.id} data-testid={`chapter-${chapter.id}`} className="mb-5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px] font-bold text-white" style={{ background: accentDeep }}>
                {chapter.region}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[var(--t-h3)] font-extrabold">{chapter.title}</h2>
                <p className="truncate text-[12px] text-ink-soft">{chapter.subtitle}</p>
              </div>
              <span className="num rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: accentSoft, color: accentDeep }}>
                {zh.map.regionProgress(earned, chapterMax)}
              </span>
            </div>

            {!unlock.unlocked && (
              <p
                className="mb-2 rounded-[10px] px-3 py-2 text-[13px] font-bold"
                style={{ background: 'var(--c-surface-sunken)', color: 'var(--c-ink-soft)' }}
              >
                🔒 {zh.map.unlockedHint(unlock.missing)}
              </p>
            )}

            <ol className="relative">
              {/* 蜿蜒小路 */}
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-[3px] rounded-full"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundImage: `repeating-linear-gradient(180deg, ${accent} 0 9px, transparent 9px 20px)`,
                  opacity: unlock.unlocked ? 0.42 : 0.16,
                }}
              />
              {chapter.levels.map((lvl, i) => {
                const stars = levels[lvl.id]?.stars ?? 0
                const unlocked = unlock.unlocked && isLevelUnlocked(lvl.id)
                const isCurrent = lvl.id === nextLevelId && unlocked
                const justDone = lvl.id === lastCompletedLevelId
                const cardLeft = i % 2 === 0

                const node = (
                  <button
                    type="button"
                    disabled={!unlocked}
                    data-testid={`node-${lvl.id}`}
                    data-stars={stars}
                    aria-current={isCurrent ? 'step' : undefined}
                    onClick={() => {
                      if (!unlocked) {
                        setTip(zh.level.lockedTip)
                        return
                      }
                      navigate(`/level/${lvl.id}`)
                    }}
                    aria-label={`${lvl.title}${!unlocked ? `（${zh.a11y.locked}）` : `，${zh.a11y.starCount(stars)}`}`}
                    className="relative grid h-[56px] w-[56px] place-items-center rounded-full border-[3px] transition-colors"
                    style={{
                      background: !unlocked
                        ? 'var(--c-surface-sunken)'
                        : stars > 0
                          ? accentDeep
                          : 'var(--c-surface)',
                      borderColor: !unlocked ? 'var(--c-line-strong)' : accent,
                      color: !unlocked ? 'var(--c-ink-faint)' : stars > 0 ? '#fff' : accentDeep,
                      boxShadow: isCurrent ? `0 0 0 6px ${accentSoft}` : 'var(--sh-card)',
                    }}
                  >
                    {unlocked ? (
                      <span className="num text-[19px] font-bold">{i + 1}</span>
                    ) : (
                      <Icon name="lock" size={20} />
                    )}
                    {isCurrent && animated && (
                      <motion.span
                        className="pointer-events-none absolute inset-[-3px] rounded-full border-[3px]"
                        style={{ borderColor: accent }}
                        animate={{ scale: [1, 1.22], opacity: [0.75, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </button>
                )

                const card = (
                  <div
                    className="min-w-0 rounded-[var(--r-md)] border bg-surface px-3 py-2.5"
                    style={{
                      borderColor: isCurrent ? accent : 'var(--c-line)',
                      boxShadow: isCurrent ? 'var(--sh-lift)' : 'var(--sh-card)',
                      opacity: unlocked ? 1 : 0.62,
                    }}
                  >
                    <div className="truncate text-[15px] font-bold">{lvl.title}</div>
                    <div className="mt-1 flex items-center gap-2" style={{ justifyContent: cardLeft ? 'flex-end' : 'flex-start' }}>
                      <span className="rounded-full px-2 py-[1px] text-[11px] font-bold" style={{ background: accentSoft, color: accentDeep }}>
                        {zh.typeLabel[lvl.type] ?? lvl.type}
                      </span>
                      <StarRow count={stars} size={14} animateIndex={justDone ? stars - 1 : undefined} />
                    </div>
                  </div>
                )

                return (
                  <li
                    key={lvl.id}
                    className="relative grid items-center gap-2 py-2.5"
                    style={{ gridTemplateColumns: '1fr 56px 1fr' }}
                  >
                    <div>{cardLeft ? card : null}</div>
                    <div className="flex justify-center">{node}</div>
                    <div>{cardLeft ? null : card}</div>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      <p className="mt-2 text-center text-[12px] text-ink-faint">{zh.map.storageNote}</p>

      {/* ---------- 轻提示 ---------- */}
      {tip && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2.5 text-[14px] font-bold text-white"
          style={{ background: 'var(--c-ink)', maxWidth: '88vw' }}
          role="status"
        >
          {tip}
        </motion.p>
      )}
    </div>
  )
}
