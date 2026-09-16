/**
 * content/index.ts · 章节注册表与懒加载入口
 * 地图页只需要「轻量目录」（CHAPTER_META），完整 payload 按章节 A/B 懒加载，
 * 避免首屏把整本「书」都装进包里（主方案 §6.4）。
 */
import type { Chapter, LevelType, Region } from './schema'

export interface LevelSummary {
  id: string
  title: string
  type: LevelType
  difficulty: number
}

export interface ChapterMeta {
  id: string
  region: Region
  title: string
  subtitle: string
  /** 地图配色使用的语义名 */
  accent: 'c' | 'd'
  levels: LevelSummary[]
}

export const CHAPTER_META: ChapterMeta[] = [
  {
    id: 'C01',
    region: 'C',
    title: '爬楼梯的秘密',
    subtitle: '一步一步往上数，后面的数靠前面推出来',
    accent: 'c',
    levels: [
      { id: 'C01-01', title: '小明上楼梯', type: 'math-manip', difficulty: 1 },
      { id: 'C01-02', title: '楼梯走法变多了', type: 'math-choice', difficulty: 2 },
      { id: 'C01-03', title: '斐波那契的兔子', type: 'math-fill', difficulty: 2 },
      { id: 'C01-04', title: '让程序自己数', type: 'code-read', difficulty: 3 },
      { id: 'C01-05', title: '填上缺的那一句', type: 'code-fill', difficulty: 3 },
      { id: 'C01-06', title: '挑战：20 级楼梯', type: 'math-fill', difficulty: 4 },
    ],
  },
  {
    id: 'D01',
    region: 'D',
    title: '会变的盒子',
    subtitle: '名字不变，里面装的东西可以换',
    accent: 'd',
    levels: [
      { id: 'D01-01', title: '会变的盒子', type: 'math-manip', difficulty: 1 },
      { id: 'D01-02', title: '盒子叫什么名字', type: 'math-choice', difficulty: 2 },
      { id: 'D01-03', title: '分糖果', type: 'math-manip', difficulty: 2 },
      { id: 'D01-04', title: '剩下几颗糖', type: 'math-choice', difficulty: 2 },
      { id: 'D01-05', title: '念出来看看', type: 'code-read', difficulty: 3 },
      { id: 'D01-06', title: '填上运算符号', type: 'code-fill', difficulty: 3 },
    ],
  },
]

const LOADERS: Record<string, () => Promise<Chapter>> = {
  C01: () => import('./regionC_thinking/C01_recursion').then((m) => m.C01),
  D01: () => import('./regionD_cpp/D01_boxes').then((m) => m.D01),
}

const cache = new Map<string, Chapter>()

export async function loadChapter(chapterId: string): Promise<Chapter> {
  const cached = cache.get(chapterId)
  if (cached) return cached
  const loader = LOADERS[chapterId]
  if (!loader) throw new Error(`未知章节：${chapterId}`)
  const chapter = await loader()
  cache.set(chapterId, chapter)
  return chapter
}

/** 构建期校验用：把所有章节都读进来 */
export async function loadAllChapters(): Promise<Chapter[]> {
  return Promise.all(CHAPTER_META.map((m) => loadChapter(m.id)))
}

/** 关卡在整条闯关路径上的线性顺序 */
export const ORDERED_LEVEL_IDS: string[] = CHAPTER_META.flatMap((c) => c.levels.map((l) => l.id))

export function chapterOfLevel(levelId: string): ChapterMeta | undefined {
  return CHAPTER_META.find((c) => c.levels.some((l) => l.id === levelId))
}

export function levelIndexInChapter(levelId: string): number {
  const chapter = chapterOfLevel(levelId)
  if (!chapter) return -1
  return chapter.levels.findIndex((l) => l.id === levelId)
}

export interface Neighbour {
  prev?: string
  next?: string
}

export function neighbours(levelId: string): Neighbour {
  const i = ORDERED_LEVEL_IDS.indexOf(levelId)
  if (i < 0) return {}
  return {
    ...(i > 0 ? { prev: ORDERED_LEVEL_IDS[i - 1]! } : {}),
    ...(i < ORDERED_LEVEL_IDS.length - 1 ? { next: ORDERED_LEVEL_IDS[i + 1]! } : {}),
  }
}

export function totalLevelCount(): number {
  return ORDERED_LEVEL_IDS.length
}
