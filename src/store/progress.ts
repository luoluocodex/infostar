/**
 * store/progress.ts · 进度 / 星级 / 连击（Zustand + 本地存档）
 * 规则来源：主方案 §4.2、engine/grade.ts。
 */
import { create } from 'zustand'
import { CHAPTER_META, ORDERED_LEVEL_IDS } from '@/content'
import {
  MAX_STARS_PER_LEVEL,
  computeStars,
  evaluateUnlock,
  mergeStars,
  type LevelOutcome,
  type StarResult,
  type StarThresholds,
  type UnlockState,
} from '@/engine/grade'
import { createPersistence, type LevelRecord, type Persistence } from './db'

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

export interface ProgressState {
  ready: boolean
  storageKind: Persistence['kind']
  levels: Record<string, LevelRecord>
  nickname: string
  streakDays: number
  lastPlayedDate: string | null
  /** 刚刚完成的关卡（用于地图上播放星星飞入与节点弹跳） */
  lastCompletedLevelId: string | null

  init: () => Promise<void>
  recordOutcome: (
    levelId: string,
    outcome: LevelOutcome,
    thresholds: StarThresholds,
  ) => Promise<StarResult>
  setNickname: (name: string) => Promise<void>
  exportArchive: () => Promise<string | null>
  importArchive: (json: string) => Promise<boolean>
  resetAll: () => Promise<void>

  levelStars: (levelId: string) => number
  totalStars: () => number
  maxStars: () => number
  completedCount: () => number
  chapterEarned: (chapterId: string) => number
  chapterUnlock: (chapterId: string) => UnlockState
  isLevelUnlocked: (levelId: string) => boolean
  clearJustCompleted: () => void
}

let persistence: Persistence | null = null

export const useProgress = create<ProgressState>()((set, get) => ({
  ready: false,
  storageKind: 'indexeddb',
  levels: {},
  nickname: '',
  streakDays: 0,
  lastPlayedDate: null,
  lastCompletedLevelId: null,

  async init() {
    if (!persistence) persistence = await createPersistence()
    const archive = await persistence.load()
    const levels: Record<string, LevelRecord> = {}
    archive.levels.forEach((l) => {
      levels[l.levelId] = l
    })
    set({
      ready: true,
      storageKind: persistence.kind,
      levels,
      nickname: typeof archive.meta.nickname === 'string' ? archive.meta.nickname : '',
      streakDays: typeof archive.meta.streakDays === 'number' ? archive.meta.streakDays : 0,
      lastPlayedDate:
        typeof archive.meta.lastPlayedDate === 'string' ? archive.meta.lastPlayedDate : null,
    })
  },

  async recordOutcome(levelId, outcome, thresholds) {
    const result = computeStars(thresholds, outcome)
    const prev = get().levels[levelId]
    const now = Date.now()
    const prevStars = prev?.stars ?? 0
    // 只有本轮成绩不差于历史最好时，才刷新「作答快照」。
    // 这样 record.stars 与 last* 字段永远来自同一次作答，
    // 结算页不会出现「标题三颗星、清单说一颗都没拿到」这种自相矛盾。
    const refreshSnapshot = result.stars >= prevStars
    const record: LevelRecord = {
      levelId,
      stars: mergeStars(prevStars, result.stars),
      attempts: (prev?.attempts ?? 0) + 1,
      lastFirstTryCorrect: refreshSnapshot ? result.correctCount : (prev?.lastFirstTryCorrect ?? 0),
      lastTotal: refreshSnapshot ? result.total : (prev?.lastTotal ?? result.total),
      hintsUsed: refreshSnapshot ? outcome.hintsUsed : (prev?.hintsUsed ?? 0),
      lastAllCorrect: refreshSnapshot ? result.stars > 0 : (prev?.lastAllCorrect ?? prevStars > 0),
      completedAt: result.stars > 0 ? now : (prev?.completedAt ?? 0),
      updatedAt: now,
    }

    // 连击：中断不显示「清零」，只温和地重新开始
    const today = dateKey(new Date())
    let streak = get().streakDays
    const last = get().lastPlayedDate
    if (last !== today) {
      streak = last === yesterdayKey() ? streak + 1 : 1
    } else if (streak === 0) {
      streak = 1
    }

    set((s) => ({
      levels: { ...s.levels, [levelId]: record },
      streakDays: streak,
      lastPlayedDate: today,
      lastCompletedLevelId: levelId,
    }))

    if (persistence) {
      await persistence.saveLevel(record)
      await persistence.saveMeta('streakDays', streak)
      await persistence.saveMeta('lastPlayedDate', today)
    }
    return result
  },

  async setNickname(name) {
    set({ nickname: name })
    if (persistence) await persistence.saveMeta('nickname', name)
  },

  async exportArchive() {
    if (!persistence) return null
    const archive = await persistence.load()
    archive.exportedAt = new Date().toISOString()
    return JSON.stringify(archive, null, 2)
  },

  async importArchive(json) {
    if (!persistence) return false
    try {
      const parsed = JSON.parse(json) as { levels?: LevelRecord[]; meta?: Record<string, unknown> }
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.levels)) return false
      const levels = parsed.levels.filter((l) => l && typeof l.levelId === 'string')
      await persistence.replace({
        app: 'infostar',
        version: 1,
        exportedAt: new Date().toISOString(),
        levels,
        meta: parsed.meta ?? {},
      })
      const map: Record<string, LevelRecord> = {}
      levels.forEach((l) => {
        map[l.levelId] = l
      })
      set({
        levels: map,
        nickname: typeof parsed.meta?.nickname === 'string' ? parsed.meta.nickname : '',
        streakDays:
          typeof parsed.meta?.streakDays === 'number' ? parsed.meta.streakDays : 0,
        lastPlayedDate:
          typeof parsed.meta?.lastPlayedDate === 'string' ? parsed.meta.lastPlayedDate : null,
      })
      return true
    } catch {
      return false
    }
  },

  async resetAll() {
    if (persistence) await persistence.clear()
    set({ levels: {}, streakDays: 0, lastPlayedDate: null, lastCompletedLevelId: null })
  },

  levelStars(levelId) {
    return get().levels[levelId]?.stars ?? 0
  },
  totalStars() {
    return Object.values(get().levels).reduce((sum, l) => sum + (l.stars ?? 0), 0)
  },
  maxStars() {
    return ORDERED_LEVEL_IDS.length * MAX_STARS_PER_LEVEL
  },
  completedCount() {
    return ORDERED_LEVEL_IDS.filter((id) => (get().levels[id]?.stars ?? 0) > 0).length
  },
  chapterEarned(chapterId) {
    const chapter = CHAPTER_META.find((c) => c.id === chapterId)
    if (!chapter) return 0
    const levels = get().levels
    return chapter.levels.reduce((sum, l) => sum + (levels[l.id]?.stars ?? 0), 0)
  },
  chapterUnlock(chapterId) {
    const index = CHAPTER_META.findIndex((c) => c.id === chapterId)
    const counts = CHAPTER_META.map((c) => c.levels.length)
    const earned = CHAPTER_META.map((c) => get().chapterEarned(c.id))
    return evaluateUnlock(index, counts, earned)
  },
  isLevelUnlocked(levelId) {
    const chapter = CHAPTER_META.find((c) => c.levels.some((l) => l.id === levelId))
    if (!chapter) return false
    if (!get().chapterUnlock(chapter.id).unlocked) return false
    const idx = chapter.levels.findIndex((l) => l.id === levelId)
    if (idx <= 0) return true
    const prev = chapter.levels[idx - 1]!
    return (get().levels[prev.id]?.stars ?? 0) > 0
  },
  clearJustCompleted() {
    set({ lastCompletedLevelId: null })
  },
}))
