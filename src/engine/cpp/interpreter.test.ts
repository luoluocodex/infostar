/**
 * engine/cpp/interpreter.test.ts · C++ 子集解释器单测
 * 依据 AGENTS §2.6 分层铁律 1：engine 必须在 Node 下可单测（不依赖任何 UI / DOM）。
 * 覆盖面：考纲语法子集 —— 表达式（整数/实数差异）、cin/cout、if-else、for、
 * 一维/二维数组、++/--、逻辑短路、儿童化错误消息。
 */
import { describe, expect, it } from 'vitest'
import { checkCode, countInputReads, formatNumber, parse, runCpp } from './index'

/** 把代码包进 main，减少测试里的样板 */
const wrap = (body: string) => `int main() {\n${body}\n}`

describe('表达式与类型', () => {
  it('整数除法要截断小数（7/2 = 3），不是 3.5', () => {
    const r = runCpp(wrap('int a = 7 / 2; cout << a;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('3')
  })

  it('只要有一边是实数，就是实数除法（7.0/2 = 3.5）', () => {
    const r = runCpp(wrap('double a = 7.0 / 2; cout << a;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('3.5')
  })

  it('取余运算只对整数有意义（7%3 = 1）', () => {
    const r = runCpp(wrap('int a = 7 % 3; cout << a;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('1')
  })

  it('运算优先级：先乘除后加减', () => {
    const r = runCpp(wrap('cout << 2 + 3 * 4;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('14')
  })

  it('负数的整数除法向 0 截断（-7/2 = -3）', () => {
    const r = runCpp(wrap('int a = -7 / 2; cout << a;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('-3')
  })

  it('formatNumber 对 int 取整、对实数保留 6 位有效数字并去尾零', () => {
    expect(formatNumber('int', 3.9)).toBe('3')
    expect(formatNumber('long', 12345.6)).toBe('12345')
    expect(formatNumber('double', 0.5)).toBe('0.5')
    expect(formatNumber('float', 1 / 3)).toBe('0.333333')
  })
})

describe('cin / cout', () => {
  it('cin 从题目预置的 testInput 依次取数（约定 G1：不弹输入框）', () => {
    const r = runCpp(wrap('int n; cin >> n; cout << n * 2;'), [21])
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('42')
  })

  it('cin 一次读多个变量，按出现顺序分配', () => {
    const r = runCpp(wrap('int a; int b; cin >> a >> b; cout << a - b;'), [10, 4])
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('6')
  })

  it('数字用完了要给儿童化提示，而不是崩掉', () => {
    const r = runCpp(wrap('int a; cin >> a; cout << a;'), [])
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('数字已经用完')
  })

  it('cout 可以连着念字符串、变量和 endl', () => {
    const r = runCpp(wrap('int a = 3; cout << "a=" << a << endl << "ok";'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('a=3\nok')
  })

  it('countInputReads 是静态统计：循环体里的 cin 只数一次（构建期粗筛用）', () => {
    const p = parse(wrap('int a; int b; cin >> a >> b; for (int i = 0; i < 3; i++) { cin >> a; }'))
    expect(countInputReads(p.program)).toBe(3)
  })

  it('checkCode 用的是「真跑一遍」的实际读入数：循环里 cin 3 次要 5 个数', () => {
    const code = wrap('int a; int b; cin >> a >> b; for (int i = 0; i < 3; i++) { cin >> a; } cout << a;')
    expect(checkCode(code, [1, 2, 3, 4, 5], '5').inputCount).toBe(5)
    // 少给一个数 → 必须报出来（约定 G1：testInput 不多不少）
    expect(checkCode(code, [1, 2, 3, 4], '5').ok).toBe(false)
  })
})

describe('if / else 与逻辑运算', () => {
  it('条件成立走里面那条路', () => {
    const r = runCpp(wrap('int a = 9; if (a > 5) { cout << "big"; } else { cout << "small"; }'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('big')
  })

  it('条件不成立就走 else', () => {
    const r = runCpp(wrap('int a = 2; if (a > 5) { cout << "big"; } else { cout << "small"; }'))
    expect(r.stdout).toBe('small')
  })

  it('&& 会短路：左边已经为假，右边不再算（所以 1/0 不会报错）', () => {
    const r = runCpp(wrap('int a = 0; if (a != 0 && 10 / a > 1) { cout << "yes"; } else { cout << "no"; }'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('no')
  })

  it('|| 会短路：左边已经为真，右边不再算', () => {
    const r = runCpp(wrap('int a = 5; if (a > 1 || 10 / 0 > 1) { cout << "yes"; }'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('yes')
  })

  it('真的除以 0 时会给出儿童化提示', () => {
    const r = runCpp(wrap('int a = 10 / 0; cout << a;'))
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('0 不能当除数')
  })

  it('! 取反', () => {
    const r = runCpp(wrap('int a = 0; if (!a) { cout << "zero"; }'))
    expect(r.stdout).toBe('zero')
  })
})

describe('for 循环', () => {
  it('1 加到 5 等于 15', () => {
    const r = runCpp(wrap('int s = 0; for (int i = 1; i <= 5; i++) { s = s + i; } cout << s;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('15')
  })

  it('循环变量能在里面被读到', () => {
    const r = runCpp(wrap('for (int i = 0; i < 3; i++) { cout << i; }'))
    expect(r.stdout).toBe('012')
  })

  it('两层嵌套循环跑对次数', () => {
    const r = runCpp(
      wrap('int c = 0; for (int i = 0; i < 3; i++) { for (int j = 0; j < 4; j++) { c++; } } cout << c;'),
    )
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('12')
  })

  it('循环里每一步都会产生执行帧（可视化回放的数据源）', () => {
    const r = runCpp(wrap('int s = 0; for (int i = 1; i <= 3; i++) { s = s + i; }'))
    expect(r.ok).toBe(true)
    // 至少：声明 s + 声明 i + 三次「判断/累加/自增」+ 最后一次判断
    expect(r.frames.length).toBeGreaterThanOrEqual(10)
    expect(r.steps).toBe(r.frames.length)
  })

  it('循环体里能改外层变量（嵌套深度记录在 loopStack 里）', () => {
    const r = runCpp(
      wrap('int t = 0; for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) { t++; } } cout << t;'),
    )
    const deep = r.frames.some((f) => f.loopStack.some((l) => l.depth === 2))
    expect(deep).toBe(true)
    expect(r.stdout).toBe('4')
  })
})

describe('数组', () => {
  it('一维数组按编号存取', () => {
    const r = runCpp(wrap('int a[3]; a[0] = 5; a[1] = 6; a[2] = 7; cout << a[1];'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('6')
  })

  it('一维数组可以用循环累加（经典求和）', () => {
    const r = runCpp(
      wrap('int a[4]; a[0]=1; a[1]=2; a[2]=3; a[3]=4; int s=0; for (int i=0;i<4;i++){ s=s+a[i]; } cout << s;'),
    )
    expect(r.stdout).toBe('10')
  })

  it('二维数组用两个编号定位', () => {
    const r = runCpp(wrap('int g[2][3]; g[1][2] = 9; cout << g[1][2] << g[0][0];'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('90')
  })

  it('越界访问给出「第几号柜子不存在」的提示', () => {
    const r = runCpp(wrap('int a[3]; a[5] = 1;'))
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('柜子不存在')
  })

  it('数组写操作会产生 array-write 帧，带下标信息', () => {
    const r = runCpp(wrap('int a[2]; a[1] = 8;'))
    const f = r.frames.find((x) => x.action === 'array-write')
    expect(f).toBeTruthy()
    expect(f?.highlight?.arrayIndex).toEqual([1])
  })
})

describe('++ / --', () => {
  it('后置 i++ 在表达式里取旧值', () => {
    const r = runCpp(wrap('int i = 3; int a = i++; cout << a << i;'))
    expect(r.stdout).toBe('34')
  })

  it('前置 ++i 在表达式里取新值', () => {
    const r = runCpp(wrap('int i = 3; int a = ++i; cout << a << i;'))
    expect(r.stdout).toBe('44')
  })

  it('-- 能用在数组元素上（a[0]--）', () => {
    const r = runCpp(wrap('int a[2]; a[0] = 3; a[0]--; cout << a[0];'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('2')
  })
})

describe('儿童化报错（UI 直接展示，不能出现黑话）', () => {
  it('少分号会说「少了一个分号」', () => {
    const r = runCpp('int main() { int a = 1 cout << a; }')
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('分号')
  })

  it('少了 main 会说「少了 int main( ) { } 这个大门」', () => {
    const r = runCpp('int a = 1;')
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('大门')
  })

  it('用还没学到的 while 会提示换成 for', () => {
    const r = runCpp(wrap('int i = 0; while (i < 3) { i++; }'))
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('for')
  })

  it('注释（含中文注释）不影响解析', () => {
    const r = runCpp('// 这是注释\n/* 多行\n注释 */\n' + wrap('cout << 1; // 行尾注释'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('1')
  })

  it('预处理指令被安全忽略', () => {
    const r = runCpp('#include <iostream>\nusing namespace std;\n' + wrap('cout << 7;'))
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('7')
  })
})

describe('执行帧（可视化组件的唯一数据源）', () => {
  it('每帧都带行号、动作和当时的变量快照', () => {
    const r = runCpp(wrap('int a = 1;\na = 2;'))
    expect(r.ok).toBe(true)
    for (const f of r.frames) {
      expect(typeof f.line).toBe('number')
      expect(f.line).toBeGreaterThan(0)
      expect(typeof f.note).toBe('string')
      expect(f.vars).toBeTypeOf('object')
    }
    const last = r.frames[r.frames.length - 1]!
    expect(last.vars.a?.value).toBe(2)
  })

  it('变量变化会打上 changed 标记，驱动盒子抖动', () => {
    const r = runCpp(wrap('int a = 1; a = 5;'))
    const changedFrame = r.frames.find((f) => f.vars.a?.changed)
    expect(changedFrame).toBeTruthy()
  })

  it('数组快照带 array / array2d 类型标签（供柜子组件切换布局）', () => {
    const r = runCpp(wrap('int a[3]; int g[2][2];'))
    const last = r.frames[r.frames.length - 1]!
    expect(last.vars.a?.type).toBe('array')
    expect(last.vars.g?.type).toBe('array2d')
  })

  it('stdout 逐帧累积，播放器可直接消费', () => {
    const r = runCpp(wrap('cout << "a"; cout << "b";'))
    expect(r.frames.some((f) => f.stdout === 'a')).toBe(true)
    expect(r.frames[r.frames.length - 1]?.stdout).toBe('ab')
  })
})

describe('安全阀', () => {
  it('跑不完的循环会被 step 上限拦住，给出提示而不是卡死', () => {
    const r = runCpp(wrap('int i = 0; for (i = 0; i < 100000; i++) { i = i - 1; }'))
    expect(r.ok).toBe(false)
    expect(r.error?.message).toContain('好像跑不完')
  })
})
