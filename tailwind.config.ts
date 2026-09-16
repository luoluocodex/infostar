/**
 * Tailwind 主题令牌
 * —— 颜色/圆角/阴影/字体全部指向 src/styles/tokens.css 中的 CSS 变量，保证单一数据源。
 * —— 注意：自定义色使用 var() 形式，不支持 Tailwind 的 `/透明度` 修饰符；
 *    需要半透明时在 CSS 中用 color-mix 或直接用 tokens.css 里的 --*-soft 变量。
 */
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--c-paper)',
        'paper-deep': 'var(--c-paper-deep)',
        surface: 'var(--c-surface)',
        'surface-sunken': 'var(--c-surface-sunken)',
        ink: 'var(--c-ink)',
        'ink-soft': 'var(--c-ink-soft)',
        'ink-faint': 'var(--c-ink-faint)',
        line: 'var(--c-line)',
        'line-strong': 'var(--c-line-strong)',
        brand: 'var(--c-brand)',
        'brand-deep': 'var(--c-brand-deep)',
        'brand-soft': 'var(--c-brand-soft)',
        accent: 'var(--c-accent)',
        'accent-deep': 'var(--c-accent-deep)',
        'accent-soft': 'var(--c-accent-soft)',
        sun: 'var(--c-sun)',
        leaf: 'var(--c-leaf)',
        danger: 'var(--c-danger)',
        regionC: 'var(--c-region-c)',
        'regionC-deep': 'var(--c-region-c-deep)',
        'regionC-soft': 'var(--c-region-c-soft)',
        regionD: 'var(--c-region-d)',
        'regionD-deep': 'var(--c-region-d-deep)',
        'regionD-soft': 'var(--c-region-d-soft)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        xl2: 'var(--r-lg)',
        pill: '999px',
      },
      boxShadow: {
        card: 'var(--sh-card)',
        lift: 'var(--sh-lift)',
        inset: 'var(--sh-inset)',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom, 0px)',
      },
      keyframes: {
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.06)', opacity: '0.88' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        'sheen': {
          '0%': { backgroundPosition: '-140% 0' },
          '100%': { backgroundPosition: '240% 0' },
        },
      },
      animation: {
        breathe: 'breathe 2.6s ease-in-out infinite',
        wiggle: 'wiggle 0.4s ease-in-out 1',
        sheen: 'sheen 2.4s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
