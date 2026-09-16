/**
 * content/schema.ts · 题库 Schema（Zod）
 * 与 docs/guides/03-内容与题库规范.md §1.1 / §2 一一对应。
 * 本文件不 import 任何 UI 代码（AGENTS §2.6 分层铁律 2）。
 */
import { z } from 'zod'

export const REGIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export type Region = (typeof REGIONS)[number]

export const LEVEL_TYPES = [
  'math-choice',
  'math-fill',
  'math-step',
  'math-manip',
  'code-read',
  'code-fill',
  'code-order',
  'code-fix',
  'code-build',
  'algo-demo',
  'match',
] as const
export type LevelType = (typeof LEVEL_TYPES)[number]

/** MVP 阶段实际落地的题型 */
export const MVP_LEVEL_TYPES: LevelType[] = [
  'math-choice',
  'math-fill',
  'math-manip',
  'code-read',
  'code-fill',
]

export const RegionSchema = z.enum(REGIONS)
export const LevelTypeSchema = z.enum(LEVEL_TYPES)

/** 生活化讲解：四段式，缺一不可（教学核心） */
export const LifeSchema = z.object({
  scene: z.string().min(4), // 1 场景：孩子熟悉的事
  action: z.string().min(4), // 2 动手：在屏幕上做什么
  bridge: z.string().min(4), // 3 抽象：映射成符号 / 表达式
  backToCpp: z.string().min(4), // 4 迁移：回到 C++ 或数学本身
})

export const SourceSchema = z.object({
  kind: z.enum(['original', 'adapted', 'pastpaper']),
  from: z.string().optional(),
  note: z.string().optional(),
})

// ---------- 各题型 payload / answer ----------

export const ChoiceOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
})

export const MathChoicePayloadSchema = z.object({
  options: z.array(ChoiceOptionSchema).min(2),
  multi: z.boolean().optional(),
})

export const MathFillPayloadSchema = z.object({
  unit: z.string().optional(),
  allowFraction: z.boolean().optional(),
  placeholder: z.string().optional(),
})

export const ManipCanvasSchema = z.enum(['stairs', 'candy', 'varBox'])

export const MathManipPayloadSchema = z.object({
  canvas: ManipCanvasSchema,
  goal: z.string().min(2),
  init: z.record(z.unknown()),
  /** 这一关有几个「小题」（影响星级门槛）；缺省为 1 */
  checkpoints: z.number().int().min(1).max(10).optional(),
})

export const SlotKindSchema = z.enum(['num', 'op', 'index', 'var'])

export const SlotDefSchema = z.object({
  id: z.string().min(1),
  accept: z.array(SlotKindSchema).min(1),
  answer: z.string().min(1),
})

export const BlockDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: SlotKindSchema,
})

export const CodeReadPayloadSchema = z.object({
  code: z.string().min(10),
  /** 约定 G1：cin 的取值只从这里按顺序读取，不弹输入框 */
  testInput: z.array(z.number()),
  expectedStdout: z.string(),
  showRunner: z.boolean().optional(),
  /** 是否允许学生展开「看它跑」 */
  allowRunner: z.boolean().optional(),
})

export const CodeFillPayloadSchema = z.object({
  skeleton: z.string().min(3),
  slots: z.array(SlotDefSchema).min(1),
  /** 底部托盘；缺省时由引擎按答案自动推导 */
  tray: z.array(BlockDefSchema).optional(),
  /**
   * 「填完看它跑」用的可运行外壳：
   * 完整程序 = demo.head + 填好答案的那一行 + demo.tail
   */
  demo: z
    .object({
      head: z.string(),
      tail: z.string(),
      testInput: z.array(z.number()),
      expectedStdout: z.string(),
    })
    .optional(),
})

export const PAYLOAD_SCHEMAS: Partial<Record<LevelType, z.ZodTypeAny>> = {
  'math-choice': MathChoicePayloadSchema,
  'math-fill': MathFillPayloadSchema,
  'math-manip': MathManipPayloadSchema,
  'code-read': CodeReadPayloadSchema,
  'code-fill': CodeFillPayloadSchema,
}

export const ANSWER_SCHEMAS: Partial<Record<LevelType, z.ZodTypeAny>> = {
  'math-choice': z.string().min(1),
  'math-fill': z.string().min(1),
  'math-manip': z.unknown(),
  'code-read': z.string(),
  'code-fill': z.record(z.string()),
}

export const MAX_HINTS = 3

export const BaseLevelSchema = z.object({
  id: z.string().regex(/^[A-F]\d{2}-\d{2}$/, 'ID 需形如 C01-05'),
  region: RegionSchema,
  chapter: z.string().min(1),
  chapterTitle: z.string().min(1),
  title: z.string().min(1),
  type: LevelTypeSchema,
  life: LifeSchema,
  statement: z.string().min(4),
  payload: z.unknown(),
  answer: z.unknown(),
  explanation: z.string().min(4),
  hints: z.array(z.string().min(1)).max(MAX_HINTS),
  stars: z.object({
    two: z.number().int().min(0),
    three: z.number().int().min(1),
  }),
  source: SourceSchema,
  difficulty: z.number().int().min(1).max(5),
})

export type Level = z.infer<typeof BaseLevelSchema>
export type MathChoicePayload = z.infer<typeof MathChoicePayloadSchema>
export type MathFillPayload = z.infer<typeof MathFillPayloadSchema>
export type MathManipPayload = z.infer<typeof MathManipPayloadSchema>
export type CodeReadPayload = z.infer<typeof CodeReadPayloadSchema>
export type CodeFillPayload = z.infer<typeof CodeFillPayloadSchema>
export type SlotDef = z.infer<typeof SlotDefSchema>
export type BlockDef = z.infer<typeof BlockDefSchema>
export type ManipCanvas = z.infer<typeof ManipCanvasSchema>

/** 章节（一章 = 一个题库文件） */
export const ChapterSchema = z.object({
  id: z.string().regex(/^[A-F]\d{2}$/),
  region: RegionSchema,
  title: z.string().min(1),
  subtitle: z.string().min(1),
  levels: z.array(BaseLevelSchema).min(1),
})
export type Chapter = z.infer<typeof ChapterSchema>

/**
 * 带载荷校验的完整题库校验：BaseLevelSchema + 题型专属 payload/answer 结构 + 交叉一致性。
 */
export const LevelSchema = BaseLevelSchema.superRefine((level, ctx) => {
  const payloadSchema = PAYLOAD_SCHEMAS[level.type]
  if (payloadSchema) {
    const r = payloadSchema.safeParse(level.payload)
    if (!r.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: `payload 不符合 ${level.type} 的结构：${r.error.issues
          .map((i) => `${i.path.join('.')} ${i.message}`)
          .join('；')}`,
      })
    }
  } else {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['type'],
      message: `${level.type} 尚未在 MVP 中实现，不能入库`,
    })
  }

  const answerSchema = ANSWER_SCHEMAS[level.type]
  if (answerSchema) {
    const r = answerSchema.safeParse(level.answer)
    if (!r.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['answer'],
        message: `answer 不符合 ${level.type} 的结构`,
      })
    }
  }

  // 选择题：答案必须是选项之一
  if (level.type === 'math-choice') {
    const p = MathChoicePayloadSchema.safeParse(level.payload)
    if (p.success && typeof level.answer === 'string') {
      const keys = p.data.options.map((o) => o.key)
      if (!keys.includes(level.answer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answer'],
          message: `答案「${level.answer}」不在选项 ${keys.join('/')} 中`,
        })
      }
      if (new Set(keys).size !== keys.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['payload', 'options'], message: '选项 key 重复' })
      }
    }
  }

  // 星级门槛不能超过小题数上限（粗校验，精细校验在 validate.ts 里做）
  if (level.stars.two > level.stars.three) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stars'],
      message: 'stars.two 不能大于 stars.three',
    })
  }

  // 来源标注：adapted 必须写清出处与改编说明
  if (level.source.kind === 'adapted' && (!level.source.from || !level.source.note)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source'],
      message: 'adapted 题目必须同时提供 from 与 note',
    })
  }
})
