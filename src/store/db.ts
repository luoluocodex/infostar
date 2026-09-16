/**
 * store/db.ts · 本地存档（Dexie / IndexedDB 为主，localStorage 兜底）
 * 数据不出手机（主方案 §2.3 决策 4）。提供统一的 Persistence 接口，
 * 便于「一键导出 / 导入存档」与单测替换。
 */
import Dexie, { type Table } from 'dexie'

export interface LevelRecord {
  levelId: string
  /** 历史最高星数（重玩只刷新，不降级） */
  stars: number
  attempts: number
  /**
   * 下面 4 个字段是「产出 stars 的那一次作答」的快照。
   * 只在成绩不差于历史最好时刷新，保证结算页的星星数与
   * 「怎么拿更多星星」描述的是同一次作答，不会互相矛盾。
   */
  lastFirstTryCorrect: number
  lastTotal: number
  hintsUsed: number
  /** 那一次是否最终把小题全做对（等价于 stars > 0） */
  lastAllCorrect?: boolean
  completedAt: number
  updatedAt: number
}

export interface MetaRecord {
  key: string
  value: unknown
}

export interface Archive {
  app: 'infostar'
  version: number
  exportedAt: string
  levels: LevelRecord[]
  meta: Record<string, unknown>
}

export const ARCHIVE_VERSION = 1

class InfoStarDB extends Dexie {
  levels!: Table<LevelRecord, string>
  meta!: Table<MetaRecord, string>

  constructor() {
    super('infostar')
    this.version(1).stores({
      levels: 'levelId, stars, updatedAt',
      meta: 'key',
    })
  }
}

export interface Persistence {
  kind: 'indexeddb' | 'localstorage'
  load(): Promise<Archive>
  saveLevel(record: LevelRecord): Promise<void>
  saveMeta(key: string, value: unknown): Promise<void>
  replace(archive: Archive): Promise<void>
  clear(): Promise<void>
}

export function emptyArchive(): Archive {
  return {
    app: 'infostar',
    version: ARCHIVE_VERSION,
    exportedAt: new Date().toISOString(),
    levels: [],
    meta: {},
  }
}

class DexiePersistence implements Persistence {
  readonly kind = 'indexeddb' as const
  private readonly db = new InfoStarDB()

  async load(): Promise<Archive> {
    const [levels, metas] = await Promise.all([
      this.db.levels.toArray(),
      this.db.meta.toArray(),
    ])
    const meta: Record<string, unknown> = {}
    metas.forEach((m) => {
      meta[m.key] = m.value
    })
    return { ...emptyArchive(), levels, meta }
  }

  async saveLevel(record: LevelRecord): Promise<void> {
    await this.db.levels.put(record)
  }

  async saveMeta(key: string, value: unknown): Promise<void> {
    await this.db.meta.put({ key, value })
  }

  async replace(archive: Archive): Promise<void> {
    await this.db.transaction('rw', this.db.levels, this.db.meta, async () => {
      await this.db.levels.clear()
      await this.db.meta.clear()
      if (archive.levels.length > 0) await this.db.levels.bulkPut(archive.levels)
      const metas = Object.entries(archive.meta).map(([key, value]) => ({ key, value }))
      if (metas.length > 0) await this.db.meta.bulkPut(metas)
    })
  }

  async clear(): Promise<void> {
    await this.db.transaction('rw', this.db.levels, this.db.meta, async () => {
      await this.db.levels.clear()
      await this.db.meta.clear()
    })
  }
}

const LS_KEY = 'infostar:archive'

/** 兜底实现：IndexedDB 不可用时（部分隐私模式 / 老旧 WebView）仍然能存档 */
class LocalPersistence implements Persistence {
  readonly kind = 'localstorage' as const

  private read(): Archive {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return emptyArchive()
      const parsed = JSON.parse(raw) as Archive
      return { ...emptyArchive(), ...parsed }
    } catch {
      return emptyArchive()
    }
  }

  private write(a: Archive): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(a))
    } catch {
      /* 存储不可用时静默降级，不阻断答题 */
    }
  }

  async load(): Promise<Archive> {
    return this.read()
  }

  async saveLevel(record: LevelRecord): Promise<void> {
    const a = this.read()
    const idx = a.levels.findIndex((l) => l.levelId === record.levelId)
    if (idx >= 0) a.levels[idx] = record
    else a.levels.push(record)
    this.write(a)
  }

  async saveMeta(key: string, value: unknown): Promise<void> {
    const a = this.read()
    a.meta[key] = value
    this.write(a)
  }

  async replace(archive: Archive): Promise<void> {
    this.write({ ...archive, app: 'infostar', version: ARCHIVE_VERSION })
  }

  async clear(): Promise<void> {
    this.write(emptyArchive())
  }
}

export function createLocalPersistence(): Persistence {
  return new LocalPersistence()
}

/** 优先 IndexedDB，打不开就退到 localStorage（渐进增强，不报错） */
export async function createPersistence(): Promise<Persistence> {
  if (typeof indexedDB === 'undefined') return new LocalPersistence()
  try {
    const p = new DexiePersistence()
    await p.load()
    return p
  } catch {
    return new LocalPersistence()
  }
}
