/**
 * components/common/Icon.tsx · 内联 SVG 图标集
 * 全部自绘、内联，无外部资源（主方案 §2.3：不依赖任何外部 CDN）。
 */
import type { SVGProps } from 'react'

type IconName =
  | 'star'
  | 'starOutline'
  | 'lock'
  | 'check'
  | 'close'
  | 'arrowLeft'
  | 'arrowRight'
  | 'play'
  | 'pause'
  | 'stepBack'
  | 'stepForward'
  | 'restart'
  | 'hint'
  | 'home'
  | 'gear'
  | 'download'
  | 'upload'
  | 'sparkle'
  | 'chevronDown'
  | 'chevronRight'
  | 'undo'
  | 'plus'
  | 'minus'
  | 'flag'
  | 'speaker'
  | 'box'

const PATHS: Record<IconName, { d?: string; node?: React.ReactNode }> = {
  star: { node: <polygon points="12 3 14.6 8.9 21 9.6 16.2 13.9 17.6 20.2 12 17 6.4 20.2 7.8 13.9 3 9.6 9.4 8.9" /> },
  starOutline: { node: <polygon points="12 3 14.6 8.9 21 9.6 16.2 13.9 17.6 20.2 12 17 6.4 20.2 7.8 13.9 3 9.6 9.4 8.9" /> },
  lock: { node: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.4" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></> },
  check: { d: 'M4.5 12.5 9.5 17.5 19.5 6.5' },
  close: { d: 'M6 6l12 12M18 6 6 18' },
  arrowLeft: { d: 'M14.5 5 8 12l6.5 7' },
  arrowRight: { d: 'M9.5 5 16 12l-6.5 7' },
  play: { node: <polygon points="8 5.5 19 12 8 18.5" /> },
  pause: { node: <><rect x="7" y="5.5" width="3.6" height="13" rx="1.2" /><rect x="13.4" y="5.5" width="3.6" height="13" rx="1.2" /></> },
  stepBack: { node: <><polygon points="18 6 10 12 18 18" /><rect x="5.2" y="6" width="2.6" height="12" rx="1.2" /></> },
  stepForward: { node: <><polygon points="6 6 14 12 6 18" /><rect x="16.2" y="6" width="2.6" height="12" rx="1.2" /></> },
  restart: { d: 'M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5' },
  hint: { node: <><path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3Z" /><path d="M9.5 20h5" /></> },
  home: { d: 'M4 11 12 4l8 7v8.5a1 1 0 0 1-1 1h-4.5V15h-5v5.5H5a1 1 0 0 1-1-1V11Z' },
  gear: { node: <><circle cx="12" cy="12" r="3.1" /><path d="M12 3.5v2.2M12 18.3v2.2M4.6 7.9l1.9 1.1M17.5 15l1.9 1.1M4.6 16.1l1.9-1.1M17.5 9l1.9-1.1" /></> },
  download: { d: 'M12 4v11m0 0 4-4m-4 4-4-4M5 19h14' },
  upload: { d: 'M12 20V9m0 0 4 4m-4-4-4 4M5 5h14' },
  sparkle: { d: 'M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5ZM18.5 16.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z' },
  chevronDown: { d: 'M6 9.5 12 15.5 18 9.5' },
  chevronRight: { d: 'M9.5 6 15.5 12 9.5 18' },
  undo: { d: 'M9 8H5V4M5.5 8.4A7.5 7.5 0 1 1 5 15' },
  plus: { d: 'M12 5.5v13M5.5 12h13' },
  minus: { d: 'M5.5 12h13' },
  flag: { node: <><path d="M6 21V4" /><path d="M6 5h11l-2.2 3.6L17 12H6" /></> },
  speaker: { node: <><path d="M6 9.5h3l4-3.2v11.4l-4-3.2H6z" /><path d="M16.5 9.2a4 4 0 0 1 0 5.6" /></> },
  box: { node: <><rect x="4" y="7.5" width="16" height="12" rx="2.2" /><path d="M4 11.5h16" /><path d="M9 4.5h6" /></> },
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** 实心（用于星星等） */
  filled?: boolean
  strokeWidth?: number
}

export function Icon({
  name,
  size = 20,
  filled = false,
  strokeWidth = 1.9,
  ...rest
}: IconProps) {
  const def = PATHS[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {def.d ? <path d={def.d} /> : def.node}
    </svg>
  )
}

export type { IconName }
