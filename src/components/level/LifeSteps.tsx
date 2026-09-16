/**
 * components/level/LifeSteps.tsx · 「讲一讲」四步法
 * 场景 → 动手 → 抽象 → 回到 C++（主方案 §4.4，教学核心）
 */
import { motion } from 'framer-motion'
import type { Level } from '@/content/schema'
import { zh } from '@/i18n/zh'
import { useAnimated } from '../common/primitives'

export function LifeSteps({ life }: { life: Level['life'] }) {
  const animated = useAnimated()
  /**
   * 编号徽标是 14px 白字，底色必须用 -deep 变体才够对比度：
   * --c-sun / --c-accent 这类亮色直接配白字只有 1.9 / 3.4，读不清。
   */
  const steps = [
    { key: 'scene', label: zh.level.lifeScene, text: life.scene, tone: 'var(--c-brand-deep)' },
    { key: 'action', label: zh.level.lifeAction, text: life.action, tone: 'var(--c-accent-deep)' },
    { key: 'bridge', label: zh.level.lifeBridge, text: life.bridge, tone: 'var(--c-sun-deep)' },
    { key: 'backToCpp', label: zh.level.lifeBackToCpp, text: life.backToCpp, tone: 'var(--c-leaf-deep)' },
  ]

  return (
    <ol className="relative space-y-2.5" data-testid="life-steps">
      {steps.map((s, i) => (
        <motion.li
          key={s.key}
          initial={animated ? { opacity: 0, x: -10 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: animated ? i * 0.07 : 0, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex gap-3"
        >
          <div className="flex flex-col items-center">
            <span
              className="num grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white"
              style={{ background: s.tone }}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span
                className="mt-1 w-[2px] flex-1 rounded-full"
                style={{ background: 'var(--c-line-strong)', minHeight: 14 }}
              />
            )}
          </div>
          <div className="min-w-0 pb-1">
            <div className="text-[12px] font-bold" style={{ color: 'var(--c-ink-faint)' }}>
              {s.label}
            </div>
            <p className="text-[16px] leading-relaxed">{s.text}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
