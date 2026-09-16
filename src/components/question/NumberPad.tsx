/**
 * components/question/NumberPad.tsx · 手机数字键盘
 * 不依赖系统输入法，避免键盘遮挡答题区；每个键命中区 ≥48px。
 */
import { zh } from '@/i18n/zh'
import { Icon } from '../common/Icon'
import { haptic } from '@/store/settings'

export interface PadExtra {
  label: string
  insert: string
}

export interface NumberPadProps {
  value: string
  onChange: (v: string) => void
  extras?: PadExtra[]
  maxLength?: number
  disabled?: boolean
  /** 允许小数点（如分数题） */
  allowDot?: boolean
}

export function NumberPad({
  value,
  onChange,
  extras = [],
  maxLength = 12,
  disabled = false,
  allowDot = false,
}: NumberPadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].concat(allowDot ? ['.'] : [])

  const push = (ch: string) => {
    if (disabled || value.length >= maxLength) return
    haptic(8)
    onChange(value + ch)
  }

  return (
    <div className="space-y-2" role="group" aria-label={zh.question.padGroup}>
      <div className="grid grid-cols-3 gap-2">
        {digits.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => push(k)}
            disabled={disabled}
            className="keycap"
            aria-label={zh.question.padKeyAria(k)}
            data-testid={`pad-${k}`}
          >
            {k}
          </button>
        ))}
      </div>

      {extras.length > 0 && (
        <div className="flex gap-2">
          {extras.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => push(e.insert)}
              disabled={disabled}
              className="keycap flex-1 text-[15px]"
              aria-label={zh.question.padKeyAria(e.label)}
              data-testid={`pad-${e.label}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => push('0')}
          disabled={disabled}
          className="keycap"
          aria-label={zh.question.padKeyAria('0')}
          data-testid="pad-0"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => {
            if (disabled) return
            haptic(10)
            onChange(value.slice(0, -1))
          }}
          disabled={disabled}
          className="keycap"
          aria-label={zh.question.padBackspaceAria}
          data-testid="pad-backspace"
        >
          <Icon name="close" size={20} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (disabled) return
            haptic(10)
            onChange('')
          }}
          disabled={disabled}
          className="keycap text-[15px] font-bold text-ink-soft"
          aria-label={zh.question.padClearLabel}
          data-testid="pad-clear"
        >
          {zh.question.padClearLabel}
        </button>
      </div>
    </div>
  )
}
