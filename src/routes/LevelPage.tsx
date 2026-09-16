/**
 * routes/LevelPage.tsx · 关卡游玩页（五段式：情境 → 讲一讲 → 动手 → 反馈 → 结算）
 * 每屏只处理一个主要学习动作（AGENTS §2.4）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadChapter, chapterOfLevel, levelIndexInChapter } from '@/content'
import type { Level } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { useProgress } from '@/store/progress'
import { AppHeader, BottomSheet, StepDots, useAnimated } from '@/components/common/primitives'
import { Icon } from '@/components/common/Icon'
import { LifeSteps } from '@/components/level/LifeSteps'
import { QuestionRenderer } from '@/components/question/QuestionRenderer'
import { FeedbackCard } from '@/components/question/FeedbackCard'
import type { QuestionResult } from '@/components/question/types'
import { SceneArt, sceneVariant } from '@/components/illustration/SceneArt'
import { haptic } from '@/store/settings'

const STEP_LABELS = [zh.level.step_intro, zh.level.step_learn, zh.level.step_play, zh.level.step_feedback, zh.level.step_settle]

export function LevelPage() {
  const { levelId = '' } = useParams()
  const navigate = useNavigate()
  const animated = useAnimated()
  const { ready, init, recordOutcome, isLevelUnlocked, levels } = useProgress()

  const [level, setLevel] = useState<Level | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintOpen, setHintOpen] = useState(false)
  const [outcome, setOutcome] = useState<{ correctCount: number; total: number; passed: boolean } | null>(null)
  const feedbackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ready) void init()
  }, [ready, init])

  // ---------- 载入关卡 ----------
  useEffect(() => {
    let alive = true
    const chapter = chapterOfLevel(levelId)
    if (!chapter) {
      setError(zh.error.notFound)
      return
    }
    loadChapter(chapter.id)
      .then((ch) => {
        if (!alive) return
        const found = ch.levels.find((l) => l.id === levelId) ?? null
        if (!found) {
          setError(zh.error.contentMissing)
          return
        }
        setLevel(found)
        setStep(0)
        setHintsUsed(0)
        setOutcome(null)
      })
      .catch(() => alive && setError(zh.error.loadFail))
    return () => {
      alive = false
    }
  }, [levelId])

  const chapterMeta = chapterOfLevel(levelId)
  const index = levelIndexInChapter(levelId)
  const unlocked = isLevelUnlocked(levelId)
  const previousStars = levels[levelId]?.stars ?? 0

  const handleSubmit = useCallback(
    (result: QuestionResult) => {
      if (!level) return
      haptic(16)
      const correctCount = result.subs.filter((s) => s.correct).length
      const passed = result.allCorrect
      void recordOutcome(
        level.id,
        { subs: result.subs, hintsUsed, allCorrect: passed },
        level.stars,
      )
      setOutcome({ correctCount, total: result.subs.length, passed })
      setStep(3)
      window.setTimeout(() => {
        feedbackRef.current?.scrollIntoView({
          behavior: animated ? 'smooth' : 'auto',
          block: 'start',
        })
      }, 120)
    },
    [animated, hintsUsed, level, recordOutcome],
  )

  const hintList = useMemo(() => level?.hints ?? [], [level])

  if (error) {
    return (
      <div className="app-shell pt-6">
        <AppHeader title={zh.error.title} onBack={() => navigate('/')} />
        <p className="card p-5 text-[16px]">{error}</p>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => navigate('/')}>
          {zh.nav.backToMap}
        </button>
      </div>
    )
  }

  if (!level) {
    return (
      <div className="app-shell pt-6">
        <AppHeader title={zh.app.name} onBack={() => navigate('/')} />
        <div className="card grid place-items-center p-10">
          <span className="text-[15px] text-ink-soft">{zh.error.loading}</span>
        </div>
      </div>
    )
  }

  if (ready && !unlocked) {
    return (
      <div className="app-shell pt-6">
        <AppHeader title={level.title} onBack={() => navigate('/')} />
        <div className="card space-y-3 p-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--c-surface-sunken)' }}>
            <Icon name="lock" size={26} />
          </div>
          <p className="text-[16px] font-bold">{zh.level.lockedTip}</p>
          <button type="button" className="btn btn-primary w-full" onClick={() => navigate('/')}>
            {zh.nav.backToMap}
          </button>
        </div>
      </div>
    )
  }

  /** 承载白字的实心按钮用 -deep 变体，保证白字对比度 ≥4.5:1 */
  const accent = level.region === 'C' ? 'var(--c-region-c-deep)' : 'var(--c-region-d-deep)'

  return (
    <div className="app-shell pt-[max(8px,env(safe-area-inset-top))]">
      <AppHeader
        title={level.title}
        subtitle={`${chapterMeta?.title ?? ''}　${index >= 0 ? zh.level.badge(index + 1, chapterMeta?.levels.length ?? 6) : ''}`}
        onBack={() => navigate('/')}
        right={
          <button
            type="button"
            onClick={() => setHintOpen(true)}
            aria-label={zh.level.hint}
            className="tap-target grid shrink-0 place-items-center rounded-2xl border bg-surface"
            style={{ borderColor: 'var(--c-line-strong)', width: 48, height: 48 }}
            data-testid="open-hint"
          >
            <Icon name="hint" size={21} />
          </button>
        }
      />

      <StepDots labels={[...STEP_LABELS]} current={step} />

      {/* ---------- 情境 ---------- */}
      {step === 0 && (
        <motion.section initial={animated ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
          <SceneArt variant={sceneVariant(level)} />
          <div className="card p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="pill" style={{ background: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' }}>
                {zh.level.introTitle}
              </span>
              {previousStars > 0 && (
                <span className="pill" style={{ background: 'var(--c-surface-sunken)', color: 'var(--c-ink-soft)' }}>
                  {zh.level.previousStars(previousStars)}
                </span>
              )}
            </div>
            <p className="text-[18px] font-semibold leading-relaxed">{level.statement}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              haptic(10)
              setStep(1)
            }}
            data-testid="start-level"
          >
            {zh.quick.start}
          </button>
        </motion.section>
      )}

      {/* ---------- 讲一讲 ---------- */}
      {step === 1 && (
        <motion.section initial={animated ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
          <div className="card p-4">
            <h2 className="mb-3 text-[var(--t-h3)] font-extrabold">{zh.level.learnTitle}</h2>
            <LifeSteps life={level.life} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                haptic(10)
                setStep(2)
              }}
              data-testid="go-play"
            >
              {zh.level.learnNext}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              {zh.level.learnSkip}
            </button>
          </div>
        </motion.section>
      )}

      {/* ---------- 动手 + 反馈 ---------- */}
      {(step === 2 || step === 3) && (
        <section className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="pill" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }}>
                {step === 2 ? zh.level.playTitle : zh.level.step_feedback}
              </span>
            </div>
            <p className="text-[16px] leading-relaxed">{level.statement}</p>
          </div>

          <QuestionRenderer
            level={level}
            locked={step === 3}
            onSubmit={handleSubmit}
            onInteract={() => undefined}
          />

          {step === 3 && outcome && (
            <div ref={feedbackRef} className="space-y-3.5 pt-1">
              <FeedbackCard
                passed={outcome.passed}
                correctCount={outcome.correctCount}
                total={outcome.total}
                explanation={level.explanation}
                hintsUsed={hintsUsed}
              />
              <button
                type="button"
                className="btn btn-accent w-full"
                onClick={() => {
                  haptic(14)
                  navigate(`/result/${level.id}`)
                }}
                style={{ background: accent }}
                data-testid="go-result"
              >
                {zh.level.seeMyStars}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ---------- 提示抽屉 ---------- */}
      <BottomSheet open={hintOpen} title={zh.level.hints} onClose={() => setHintOpen(false)}>
        <div className="space-y-3 pb-2">
          {hintList.slice(0, hintsUsed).map((h, i) => (
            <div
              key={i}
              className="rounded-[var(--r-md)] border p-3.5"
              style={{ borderColor: 'var(--c-line)', background: 'var(--c-surface-sunken)' }}
            >
              <div className="mb-1 text-[12px] font-bold text-ink-faint">{zh.level.hintIndex(i + 1)}</div>
              <p className="text-[16px] leading-relaxed">{h}</p>
            </div>
          ))}

          {hintsUsed < hintList.length ? (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => {
                haptic(8)
                setHintsUsed((n) => Math.min(n + 1, hintList.length))
              }}
              data-testid="next-hint"
            >
              {zh.level.hintUsed(hintsUsed + 1, hintList.length)}
            </button>
          ) : (
            <p className="text-center text-[14px] font-bold text-ink-soft">
              {zh.level.hintExhausted}
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
