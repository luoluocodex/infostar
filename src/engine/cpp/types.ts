/**
 * engine/cpp/types.ts · 执行帧与变量快照的数据契约
 * 供可视化组件（components/viz/*）与播放器（components/runner/*）只读消费。
 * 本文件不得 import 任何 UI 代码（AGENTS §2.6 分层铁律 1）。
 */

/** C++ 数值类型子集（对齐考纲） */
export type CppScalarType = 'int' | 'long' | 'float' | 'double'

/** 快照里出现的类型标签（数组用 array / array2d 标记） */
export type VarSnapshotType = CppScalarType | 'array' | 'array2d'

/** 变量值：标量 / 一维数组 / 二维数组（扁平化前的矩阵） */
export type VarValue = number | number[] | number[][]

export interface VarSnapshot {
  name: string
  type: VarSnapshotType
  value: VarValue
  /** 本帧是否发生变化（驱动抖动/闪烁动画） */
  changed: boolean
  /** 盒子尺寸：long / double / 数组用大盒，int / float 用小盒 */
  boxSize: 'small' | 'big'
}

export type FrameAction =
  | 'declare'
  | 'assign'
  | 'input'
  | 'output'
  | 'cond'
  | 'loop-init'
  | 'loop-test'
  | 'loop-step'
  | 'array-write'
  | 'array-read'
  | 'return'
  | 'note'

export interface LoopInfo {
  /** 该层 for 的源码行 */
  line: number
  /** 已完整跑过的圈数（进入第 1 圈时为 0） */
  round: number
  /** 嵌套深度，从 1 开始 */
  depth: number
  /** 循环变量的当前文本，如 "i=3" */
  counter?: string
}

export interface FrameHighlight {
  varName?: string
  arrayIndex?: number[]
  /** 条件判定结果，用于「岔路口」组件 */
  compare?: { expr: string; value: boolean }
}

export interface Frame {
  step: number
  /** 当前执行到源码第几行（1 起，用于高亮） */
  line: number
  action: FrameAction
  /** 这一步之后的全部变量快照 */
  vars: Record<string, VarSnapshot>
  /** 到这一步为止的累计输出 */
  stdout: string
  /** for 嵌套栈 */
  loopStack: LoopInfo[]
  /** 中文人话解释，如「i 变成 4 了」 */
  note: string
  highlight?: FrameHighlight
}

/** 儿童化错误（引擎不抛原始异常给 UI） */
export interface CppError {
  line: number
  /** 给孩子看的一句话，如「第 3 行好像少了一个分号「;」」 */
  message: string
  /** 给大人看的原始信息（可折叠展示） */
  detail?: string
}

export interface RunResult {
  ok: boolean
  frames: Frame[]
  /** 最终输出 */
  stdout: string
  error?: CppError
  /** 实际执行的帧数 */
  steps: number
  /** 实际从 testInput 里取走了几个数（循环里的 cin 也算得准，用于校验约定 G1） */
  inputsUsed: number
}
