/**
 * components/common/primitives.tsx · 通用基础组件
 * 包含：应用头部、星星行、底部抽屉、进度圆点、数字排版。
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { zh } from '@/i18n/zh'
import { useSettings } from '@/store/settings'
import { Icon } from './Icon'

/** 是否允许播放动画（同时尊重系统「减少动态效果」与 App 内开关） */
export function useAnimated(): boolean {
  const reduce = useReducedMotion()
  const motionOn = useSettings((s) => s.motion)
  return motionOn && !reduce
}

/** 数字排版：统一走显示字体，制造辨识度 */
export function Num({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`num ${className}`}>{children}</span>
}

export interface AppHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}

export function AppHeader({ title, subtitle, onBack, right }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 -mx-[18px] mb-4 px-[18px] pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md">
      <div
        className="absolute inset-0 -z-10 border-b"
        style={{
          background: 'linear-gradient(180deg, rgba(251,241,227,0.96), rgba(251,241,227,0.82))',
          borderColor: 'var(--c-line)',
        }}
      />
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={zh.nav.back}
            className="tap-target grid shrink-0 place-items-center rounded-2xl border bg-surface text-ink"
            style={{ borderColor: 'var(--c-line-strong)', width: 48, height: 48 }}
          >
            <Icon name="arrowLeft" size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[var(--t-h2)] font-extrabold">{title}</h1>
          {subtitle && (
            <p className="truncate text-[var(--t-tiny)] text-ink-faint">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </header>
  )
}

export interface StarRowProps {
  count: number
  max?: number
  size?: number
  /** 是否展示动画（新得星时的弹跳） */
  animateIndex?: number
}

export function StarRow({ count, max = 3, size = 20, animateIndex }: StarRowProps) {
  const animated = useAnimated()
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={zh.a11y.starCount(count)}
    >
      {Array.from({ length: max }, (_, i) => {
        const on = i < count
        return (
          <motion.span
            key={i}
            initial={false}
            animate={
              animated && animateIndex === i
                ? { scale: [0.4, 1.35, 1], rotate: [0, -12, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.5, ease: [0.34, 1.4, 0.64, 1] }}
            style={{ color: on ? '#e8a61e' : 'var(--c-ink-faint)', display: 'inline-flex' }}
          >
            <Icon
              name={on ? 'star' : 'starOutline'}
              size={size}
              filled={on}
              strokeWidth={on ? 1.2 : 2}
              style={on ? { stroke: '#96630a' } : undefined}
            />
          </motion.span>
        )
      })}
    </span>
  )
}

export interface StepDotsProps {
  labels: string[]
  current: number
}

export function StepDots({ labels, current }: StepDotsProps) {
  return (
    <ol className="mb-4 flex items-center gap-2" aria-label={zh.level.stepProgressAria}>
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="h-[6px] w-full rounded-full transition-colors"
              style={{
                background: done || active ? 'var(--c-brand)' : 'var(--c-line-strong)',
                opacity: active ? 1 : done ? 0.7 : 0.5,
              }}
            />
            <span
              className="text-[11px] font-bold"
              style={{ color: active ? 'var(--c-brand-deep)' : 'var(--c-ink-faint)' }}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const animated = useAnimated()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animated ? 0.18 : 0 }}
        >
          <button
            type="button"
            aria-label={zh.level.close}
            className="absolute inset-0 bg-[rgba(44,33,26,0.42)]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-[var(--w-app)] rounded-t-[var(--r-xl)] border-t bg-surface px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-4"
            style={{ borderColor: 'var(--c-line)', boxShadow: 'var(--sh-lift)' }}
            initial={{ y: animated ? '100%' : 0 }}
            animate={{ y: 0 }}
            exit={{ y: animated ? '100%' : 0 }}
            transition={{ duration: animated ? 0.32 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[var(--t-h3)] font-extrabold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={zh.level.close}
                className="tap-target grid place-items-center rounded-2xl border bg-surface"
                style={{ borderColor: 'var(--c-line)', width: 44, height: 44 }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="max-h-[62dvh] overflow-y-auto pr-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Pill({
  children,
  tone = 'brand',
}: {
  children: ReactNode
  tone?: 'brand' | 'accent' | 'plain'
}) {
  const style =
    tone === 'brand'
      ? { background: 'var(--c-brand-soft)', color: 'var(--c-brand-deep)' }
      : tone === 'accent'
        ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' }
        : { background: 'var(--c-surface-sunken)', color: 'var(--c-ink-soft)' }
  return (
    <span className="pill" style={style}>
      {children}
    </span>
  )
}
