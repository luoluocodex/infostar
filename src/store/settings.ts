/**
 * store/settings.ts · 轻量设置（localStorage 即可，不需要进 IndexedDB）
 */
import { create } from 'zustand'

const LS_KEY = 'infostar:settings'

export interface Settings {
  /** 震动反馈（Android 支持，iOS 自动降级为缩放动画） */
  haptics: boolean
  /** 是否播放动画与转场 */
  motion: boolean
}

function read(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { haptics: true, motion: true }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { haptics: parsed.haptics !== false, motion: parsed.motion !== false }
  } catch {
    return { haptics: true, motion: true }
  }
}

function write(s: Settings): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    /* 存储不可用时静默忽略 */
  }
}

export interface SettingsState extends Settings {
  init: () => void
  setHaptics: (on: boolean) => void
  setMotion: (on: boolean) => void
}

export const useSettings = create<SettingsState>()((set, get) => ({
  haptics: true,
  motion: true,
  init() {
    set(read())
  },
  setHaptics(on) {
    set({ haptics: on })
    const { haptics, motion } = get()
    write({ haptics, motion })
  },
  setMotion(on) {
    set({ motion: on })
    const { haptics, motion } = get()
    write({ haptics, motion })
  },
}))

/** 触觉反馈：不支持的设备静默忽略 */
export function haptic(ms = 12): void {
  if (!useSettings.getState().haptics) return
  const nav = navigator as Navigator & { vibrate?: (p: number) => boolean }
  try {
    nav.vibrate?.(ms)
  } catch {
    /* 忽略 */
  }
}
