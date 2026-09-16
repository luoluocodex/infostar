/**
 * content/regionC_thinking/C01_recursion.ts
 * C 区「爬楼梯的秘密」（递推入门）· 6 关
 * 规格来源：docs/guides/04-MVP-12关内容规格.md Part 1
 * 答案已按规格人工核对；code-* 题的输出由构建期交叉验证保证。
 */
import type { Chapter } from '../schema'

export const C01: Chapter = {
  id: 'C01',
  region: 'C',
  title: '爬楼梯的秘密',
  subtitle: '一步一步往上数，后面的数靠前面推出来',
  levels: [
    {
      id: 'C01-01',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '小明上楼梯',
      type: 'math-manip',
      life: {
        scene: '小明每次上楼梯，可以一次跨 1 级，也可以一次跨 2 级。',
        action: '在屏幕上点台阶，把上 3 级楼梯的每一种走法都摆一遍。',
        bridge: '走法可以记成 111（1+1+1）、12（1+2）、21（2+1）——一共 3 种。',
        backToCpp: '这种「一步一步往上数」的问题，就是后面程序里的递推。',
      },
      statement: '小明要上 3 级楼梯，每次可以跨 1 级或 2 级。一共有几种走法？把每一种都摆出来。',
      payload: {
        canvas: 'stairs',
        goal: '摆出上 3 级楼梯的全部走法',
        init: { steps: 3 },
        checkpoints: 3,
      },
      answer: 3,
      explanation: '3 级楼梯有三种走法：一级一级走、先 1 后 2、先 2 后 1。',
      hints: ['先想想最后一步是跨 1 级还是 2 级？', '比一比三种走法哪里不一样？'],
      stars: { two: 2, three: 3 },
      source: {
        kind: 'adapted',
        from: '2024 选拔卷 数学计算 第 11 题',
        note: '数值与原题一致，改为拖拽动手版，并补上「摆出全部走法」的过程',
      },
      difficulty: 1,
    },
    {
      id: 'C01-02',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '楼梯走法变多了',
      type: 'math-choice',
      life: {
        scene: '楼梯从 3 级变成 4 级、5 级，走法好像一下子变多了。',
        action: '先摆一遍 4 级，再摆一遍 5 级，把每种走法的个数记下来。',
        bridge: '3 级有 3 种，4 级有 5 种，5 级有 8 种——每个数都等于前两个数相加。',
        backToCpp: '5 = 2 + 3、8 = 3 + 5，这就是 a[i] = a[i-1] + a[i-2] 的来历。',
      },
      statement: '小红要上 5 级楼梯，每次可以跨 1 级或 2 级。一共有几种走法？',
      payload: {
        options: [
          { key: 'A', text: '6 种' },
          { key: 'B', text: '7 种' },
          { key: 'C', text: '8 种' },
          { key: 'D', text: '9 种' },
        ],
      },
      answer: 'C',
      explanation: '上 5 级楼梯共有 8 种走法。规律是「后一个数 = 前两个数之和」：3、5、8……',
      hints: ['把 3 级、4 级的走法个数先写出来排成一排', '看看每个数是不是等于前两个数相加？'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 2,
    },
    {
      id: 'C01-03',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '斐波那契的兔子',
      type: 'math-fill',
      life: {
        scene: '院子里的兔子每月生一窝小兔，兔子的对数越变越多。',
        action: '数一数第 1 个月到第 6 个月，每个月的兔子对数。',
        bridge: '1、1、2、3、5、8——和爬楼梯的规律一模一样。',
        backToCpp: '同一个递推规律，可以讲楼梯，也可以讲兔子。',
      },
      statement: '兔子第 1 个月有 1 对，第 2 个月还是 1 对，之后每月都等于前两个月之和。第 6 个月有几对兔子？',
      payload: { unit: '对' },
      answer: '8',
      explanation: '第 6 个月的兔子对数是 8（1、1、2、3、5、8）。',
      hints: ['第 3 个月的兔子数等于前两个月相加', '照这个规律再往下算两个月试试？'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 2,
    },
    {
      id: 'C01-04',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '让程序自己数',
      type: 'code-read',
      life: {
        scene: '数楼梯太慢了，能不能让电脑帮我们数？',
        action: '一行一行读下面这个程序，看看 a[6] 最后变成了几。',
        bridge: '程序用一排柜子 a 记住每一级的走法数，再用 for 一圈一圈往前推。',
        backToCpp: 'a[i] = a[i-1] + a[i-2] 就是刚才的规律，写进程序里就是这样。',
      },
      statement: '读一读下面这段程序，屏幕上最后会显示什么？',
      payload: {
        code: `#include <iostream>
using namespace std;
int main(){
  int a[10],i;
  a[1]=1; a[2]=1;
  for(i=3;i<=6;i++)
    a[i]=a[i-1]+a[i-2];
  cout<<a[6];
}`,
        testInput: [],
        expectedStdout: '8',
        showRunner: true,
        allowRunner: true,
      },
      answer: '8',
      explanation: 'a[1]=1、a[2]=1、a[3]=2、a[4]=3、a[5]=5、a[6]=8，所以屏幕上显示 8。',
      hints: ['先填出 a[1]、a[2]，再一格一格往右算', '点「看它跑」，让程序一格一格演给你看'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 3,
    },
    {
      id: 'C01-05',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '填上缺的那一句',
      type: 'code-fill',
      life: {
        scene: '程序里的一行被橡皮擦掉了，请你补回来。',
        action: '从底下把 i-1、i-2 和 + 拖进空格里。',
        bridge: '这一行要让「这一次的数」等于「前两次的数相加」。',
        backToCpp: '补完就是 a[i] = a[i-1] + a[i-2];',
      },
      statement: '把下面这一行补完整：让第 i 格等于它前面两格相加。',
      payload: {
        skeleton: 'a[i]=a[___]___a[___];',
        slots: [
          { id: 's1', accept: ['index'], answer: 'i-1' },
          { id: 's2', accept: ['op'], answer: '+' },
          { id: 's3', accept: ['index'], answer: 'i-2' },
        ],
        tray: [
          { id: 'b1', label: 'i-1', kind: 'index' },
          { id: 'b2', label: 'i-2', kind: 'index' },
          { id: 'b3', label: 'i+1', kind: 'index' },
          { id: 'b4', label: '+', kind: 'op' },
          { id: 'b5', label: '-', kind: 'op' },
        ],
        demo: {
          head: `#include <iostream>
using namespace std;
int main(){
  int a[10],i;
  a[1]=1; a[2]=1;
  for(i=3;i<=6;i++)
    `,
          tail: `
  cout<<a[6];
}`,
          testInput: [],
          expectedStdout: '8',
        },
      },
      answer: { s1: 'i-1', s2: '+', s3: 'i-2' },
      explanation: '要往前找前两次的结果，分别是 a[i-1] 和 a[i-2]，中间用加号连接。',
      hints: ['「前一次」是 i 减几？「再前一次」呢？', '两段结果中间应该拖一个什么符号？'],
      stars: { two: 2, three: 3 },
      source: { kind: 'original' },
      difficulty: 3,
    },
    {
      id: 'C01-06',
      region: 'C',
      chapter: 'C01',
      chapterTitle: '爬楼梯的秘密',
      title: '挑战：20 级楼梯',
      type: 'math-fill',
      life: {
        scene: '楼梯一下子变长到 20 级，一格格数太累了。',
        action: '用刚才的规律，从 1 级一直推到 20 级。',
        bridge: '把每级的结果写成一排，每个数都是前两个数之和。',
        backToCpp: '这正是程序能替我们做的那种「重复又规律的加法」。',
      },
      statement: '还是每次跨 1 级或 2 级。上 20 级楼梯一共有多少种走法？',
      payload: { unit: '种' },
      answer: '10946',
      explanation: '按 a[i] = a[i-1] + a[i-2] 推到第 20 级，得到 10946 种走法。',
      hints: ['先写 1、1 打头的那串数', '别跳着算，一级一级推，写完 10 个再往后'],
      stars: { two: 1, three: 1 },
      source: {
        kind: 'adapted',
        from: '2024 选拔卷第 11 题',
        note: '把原题的 8 级改成 20 级，考察同一规律的延伸计算',
      },
      difficulty: 4,
    },
  ],
}
