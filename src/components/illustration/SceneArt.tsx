/**
 * components/illustration/SceneArt.tsx · 生活化场景插画（全部内联 SVG，无外部请求）
 */
import type { Level } from '@/content/schema'
import { zh } from '@/i18n/zh'

export type SceneVariant = 'stairs' | 'rabbit' | 'box' | 'name' | 'candy' | 'code' | 'speaker'

export function sceneVariant(level: Level): SceneVariant {
  const { id, type } = level
  if (id.startsWith('C01')) {
    if (id === 'C01-03') return 'rabbit'
    if (type === 'code-read' || type === 'code-fill') return 'code'
    return 'stairs'
  }
  if (id === 'D01-01') return 'box'
  if (id === 'D01-02') return 'name'
  if (id === 'D01-03' || id === 'D01-04') return 'candy'
  return 'speaker'
}

const S = { ink: '#2C211A', line: 'rgba(44,33,26,0.18)' }

export function SceneArt({ variant, className = '' }: { variant: SceneVariant; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--r-md)] border ${className}`}
      style={{ borderColor: 'var(--c-line)', background: 'linear-gradient(160deg,#fffdf8,#f7e8d4)' }}
      role="img"
      aria-label={zh.app.sceneArtAria}
    >
      <svg viewBox="0 0 320 150" width="100%" height="auto" aria-hidden="true">
        <defs>
          <linearGradient id="sa-step" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F5B23C" />
            <stop offset="1" stopColor="#E9612F" />
          </linearGradient>
          <linearGradient id="sa-box" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCEcee" />
            <stop offset="1" stopColor="#9FD3D9" />
          </linearGradient>
        </defs>
        <circle cx="272" cy="30" r="16" fill="#F5B23C" opacity="0.55" />
        {variant === 'stairs' && (
          <>
            <rect x="40" y="96" width="52" height="34" rx="6" fill="url(#sa-step)" />
            <rect x="92" y="74" width="52" height="56" rx="6" fill="url(#sa-step)" />
            <rect x="144" y="52" width="52" height="78" rx="6" fill="url(#sa-step)" />
            <rect x="196" y="30" width="52" height="100" rx="6" fill="url(#sa-step)" />
            <path d="M206 22v-18" stroke={S.ink} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M206 6h20l-5 7 5 7h-20z" fill="#147D8A" />
            <circle cx="222" cy="72" r="7" fill="#FFFCF6" stroke={S.line} />
            <path d="M222 79c-8 0-13 5-13 12h26c0-7-5-12-13-12z" fill="#FFFCF6" stroke={S.line} />
          </>
        )}
        {variant === 'rabbit' && (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${46 + i * 78},0)`}>
                <ellipse cx="34" cy="112" rx="26" ry="20" fill="#FFFCF6" stroke={S.line} />
                <circle cx="34" cy="80" r="16" fill="#FFFCF6" stroke={S.line} />
                <ellipse cx="27" cy="60" rx="5" ry="13" fill="#FFFCF6" stroke={S.line} />
                <ellipse cx="41" cy="60" rx="5" ry="13" fill="#FFFCF6" stroke={S.line} />
                <circle cx="29" cy="79" r="2.4" fill={S.ink} />
                <circle cx="39" cy="79" r="2.4" fill={S.ink} />
                <path d="M30 86q4 4 8 0" stroke={S.ink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
            ))}
            <text x="272" y="46" fontSize="15" fontWeight="700" fill="#147D8A" textAnchor="middle">
              1 1 2 3 …
            </text>
          </>
        )}
        {variant === 'box' && (
          <>
            <rect x="52" y="52" width="96" height="72" rx="12" fill="url(#sa-box)" stroke={S.line} />
            <rect x="64" y="42" width="72" height="20" rx="8" fill="#147D8A" />
            <text x="100" y="57" fontSize="13" fontWeight="700" fill="#fff" textAnchor="middle">
              a
            </text>
            <text x="100" y="100" fontSize="30" fontWeight="700" fill={S.ink} textAnchor="middle">
              5
            </text>
            <path d="M160 88h34" stroke={S.ink} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M188 82l8 6-8 6" fill="none" stroke={S.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="204" y="52" width="96" height="72" rx="12" fill="#FBE4D7" stroke={S.line} />
            <rect x="216" y="42" width="72" height="20" rx="8" fill="#BC4820" />
            <text x="252" y="57" fontSize="13" fontWeight="700" fill="#fff" textAnchor="middle">
              a
            </text>
            <text x="252" y="100" fontSize="30" fontWeight="700" fill={S.ink} textAnchor="middle">
              8
            </text>
          </>
        )}
        {variant === 'name' && (
          <>
            <rect x="96" y="46" width="128" height="80" rx="14" fill="#FFFCF6" stroke={S.line} />
            <rect x="110" y="34" width="100" height="22" rx="9" fill="#F5B23C" />
            <text x="160" y="50" fontSize="13" fontWeight="700" fill={S.ink} textAnchor="middle">
              a1 ✓
            </text>
            <g opacity="0.5">
              <rect x="18" y="70" width="52" height="34" rx="9" fill="#F3E5D2" stroke={S.line} transform="rotate(-8 44 87)" />
              <text x="40" y="92" fontSize="12" fill={S.ink} textAnchor="middle" transform="rotate(-8 44 87)">
                2box
              </text>
              <rect x="250" y="70" width="56" height="34" rx="9" fill="#F3E5D2" stroke={S.line} transform="rotate(8 278 87)" />
              <text x="276" y="92" fontSize="12" fill={S.ink} textAnchor="middle" transform="rotate(8 278 87)">
                my box
              </text>
            </g>
          </>
        )}
        {variant === 'candy' && (
          <>
            <circle cx="36" cy="86" r="24" fill="#FBE4D7" stroke={S.line} />
            <text x="36" y="92" fontSize="14" fontWeight="700" fill="#BC4820" textAnchor="middle">
              20
            </text>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${104 + i * 62},0)`}>
                <ellipse cx="26" cy="106" rx="26" ry="9" fill="#DCEcee" stroke={S.line} />
                {Array.from({ length: i + 1 }, (_, k) => (
                  <circle key={k} cx={14 + k * 12} cy={96 - k * 2} r="8" fill="#E9612F" />
                ))}
              </g>
            ))}
            <text x="272" y="42" fontSize="15" fontWeight="700" fill="#147D8A" textAnchor="middle">
              20 ÷ 3
            </text>
          </>
        )}
        {variant === 'code' && (
          <>
            <rect x="34" y="26" width="252" height="98" rx="12" fill="#2F2620" />
            <circle cx="52" cy="44" r="4" fill="#E9612F" />
            <circle cx="66" cy="44" r="4" fill="#F5B23C" />
            <circle cx="80" cy="44" r="4" fill="#3F8F5B" />
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={52 + (i % 2 === 0 ? 0 : 12)}
                y={62 + i * 15}
                width={[140, 96, 168, 72][i]!}
                height="7"
                rx="3.5"
                fill={['#F5B23C', '#8FD2A6', '#7FD3DD', '#F6EAD9'][i]}
                opacity="0.85"
              />
            ))}
          </>
        )}
        {variant === 'speaker' && (
          <>
            <path d="M64 56h34l38-26v78l-38-26H64z" fill="#147D8A" />
            <rect x="48" y="56" width="20" height="26" rx="6" fill="#0B5762" />
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${146 + i * 18} ${60 - i * 6}a${26 + i * 16} ${30 + i * 18} 0 0 1 0 ${58 + i * 12}`}
                fill="none"
                stroke="#F5B23C"
                strokeWidth="5"
                strokeLinecap="round"
                opacity={0.9 - i * 0.22}
              />
            ))}
            <text x="212" y="96" fontSize="24" fontWeight="700" fill={S.ink}>
              6 2
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
