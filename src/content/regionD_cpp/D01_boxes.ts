/**
 * content/regionD_cpp/D01_boxes.ts
 * D 区「会变的盒子」（变量与表达式）· 6 关
 * 规格来源：docs/guides/04-MVP-12关内容规格.md Part 2
 */
import type { Chapter } from '../schema'

export const D01: Chapter = {
  id: 'D01',
  region: 'D',
  title: '会变的盒子',
  subtitle: '名字不变，里面装的东西可以换',
  levels: [
    {
      id: 'D01-01',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '会变的盒子',
      type: 'math-manip',
      life: {
        scene: '柜台上有个贴着名字的小盒子，里面能放东西，也能换成别的东西。',
        action: '把数字 5 拖进盒子 a，再把盒子里的数字换成 8。',
        bridge: '盒子的名字不变，里面装的东西可以变——这就是变量。',
        backToCpp: '在 C++ 里写 a=5; 就是「把 5 放进叫 a 的盒子」。',
      },
      statement: '把盒子 a 里先放上 5，再换成 8。盒子的名字要不要跟着变？',
      payload: {
        canvas: 'varBox',
        goal: '把盒子 a 从 5 换成 8',
        init: { name: 'a', value: 5 },
        checkpoints: 2,
      },
      answer: { name: 'a', value: 8 },
      explanation: '盒子名字（变量名）不变，里面装的值可以从 5 变成 8。',
      hints: ['盒子的名字要不要跟着变？', '只是把里面的东西换掉了，对不对？'],
      stars: { two: 2, three: 2 },
      source: { kind: 'original' },
      difficulty: 1,
    },
    {
      id: 'D01-02',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '盒子叫什么名字',
      type: 'math-choice',
      life: {
        scene: '给盒子起名字也有规矩，不然电脑会认错。',
        action: '看看下面几个名字，哪个能被电脑接受？',
        bridge: '名字要以字母开头，中间不能有空格，可以用字母、数字、下划线。',
        backToCpp: '这些规矩就是 C++ 的变量命名规则。',
      },
      statement: '下面哪个盒子名字，电脑会点头说「可以」？',
      payload: {
        options: [
          { key: 'A', text: '2box' },
          { key: 'B', text: 'my box' },
          { key: 'C', text: 'a1' },
          { key: 'D', text: '小明的盒子' },
        ],
      },
      answer: 'C',
      explanation: 'a1 以字母开头、不含空格，合法。2box 数字开头、my box 有空格、中文名也不被接受。',
      hints: ['名字能拿数字开头吗？', '名字里可以有空格吗？'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 2,
    },
    {
      id: 'D01-03',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '分糖果',
      type: 'math-manip',
      life: {
        scene: '妈妈买了 20 颗糖，要平均分给 3 个小朋友。',
        action: '转着圈一颗一颗发糖，发不动了停下来，看看每个小朋友拿到几颗。',
        bridge: '每个小朋友拿到 6 颗，整份分掉 18 颗——用 20 ÷ 3 = 6 表示。',
        backToCpp: 'cout << 20 / 3; 屏幕上就是 6（只算能整份分出去的）。',
      },
      statement: '20 颗糖平均分给 3 个小朋友，每人能整份拿到几颗？',
      payload: {
        canvas: 'candy',
        goal: '把 20 颗糖平均分给 3 个盘子',
        init: { total: 20, groups: 3 },
        checkpoints: 1,
      },
      answer: 6,
      explanation: '20 ÷ 3 每人分到 6 颗（整份），一共分掉 18 颗，还剩 2 颗。',
      hints: ['先每人发 1 颗，转圈发下去，发不动了是多少？', '18 颗发完之后还剩几颗？'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 2,
    },
    {
      id: 'D01-04',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '剩下几颗糖',
      type: 'math-choice',
      life: {
        scene: '糖分完以后，盘子里还剩几颗没分出去？',
        action: '数一数分不动的剩糖。',
        bridge: '剩下 2 颗——这个「剩下的」用 20 % 3 = 2 表示。',
        backToCpp: '% 读作「取余」，就是分完剩下没分掉的那几个。',
      },
      statement: '20 颗糖平均分给 3 个小朋友，分完以后还剩几颗？',
      payload: {
        options: [
          { key: 'A', text: '1 颗' },
          { key: 'B', text: '2 颗' },
          { key: 'C', text: '3 颗' },
          { key: 'D', text: '6 颗' },
        ],
      },
      answer: 'B',
      explanation: '20 % 3 = 2，分完 3 个一份共 18 颗后，还剩 2 颗分不动。',
      hints: ['先算 3 × 6 = 18，再看看 20 比 18 多几', '多出来的就是「剩下没分完的」'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 2,
    },
    {
      id: 'D01-05',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '念出来看看',
      type: 'code-read',
      life: {
        scene: '程序会把它算出来的东西「念」到屏幕上。',
        action: '读这一行 cout，看看屏幕上会出现什么。',
        bridge: '先念 20 / 3，再念一个空格，最后念 20 % 3。',
        backToCpp: 'cout 就像对着话筒念话，中间的空格决定两个数怎么隔开。',
      },
      statement: '读一读下面这段程序，屏幕上会显示什么？',
      payload: {
        code: `#include <iostream>
using namespace std;
int main(){
  cout << 20 / 3 << " " << 20 % 3;
  return 0;
}`,
        testInput: [],
        expectedStdout: '6 2',
        showRunner: true,
        allowRunner: true,
      },
      answer: '6 2',
      explanation: '20 / 3 得 6，中间印一个空格，20 % 3 得 2，所以屏幕上是 6 2。',
      hints: ['先分别算出两个式子的值', '中间那个 " " 会印出什么？'],
      stars: { two: 1, three: 1 },
      source: { kind: 'original' },
      difficulty: 3,
    },
    {
      id: 'D01-06',
      region: 'D',
      chapter: 'D01',
      chapterTitle: '会变的盒子',
      title: '填上运算符号',
      type: 'code-fill',
      life: {
        scene: '程序缺了两个符号，念出来的结果就不对了。',
        action: '从底下把 / 或 % 拖进两个空格，让屏幕出现 6 2。',
        bridge: '第一个位置要「整份分掉」，第二个位置要「剩下没分完的」。',
        backToCpp: '补完就是 cout << 20 / 3 << " " << 20 % 3;',
      },
      statement: '把两个空格填上运算符号，让程序念出 6 2。',
      payload: {
        skeleton: 'cout << 20 ___ 3 << " " << 20 ___ 3;',
        slots: [
          { id: 's1', accept: ['op'], answer: '/' },
          { id: 's2', accept: ['op'], answer: '%' },
        ],
        tray: [
          { id: 'b1', label: '/', kind: 'op' },
          { id: 'b2', label: '%', kind: 'op' },
          { id: 'b3', label: '*', kind: 'op' },
          { id: 'b4', label: '-', kind: 'op' },
        ],
        demo: {
          head: `#include <iostream>
using namespace std;
int main(){
  `,
          tail: `
  return 0;
}`,
          testInput: [],
          expectedStdout: '6 2',
        },
      },
      answer: { s1: '/', s2: '%' },
      explanation: '前面要 20 / 3 得 6，后面要 20 % 3 得 2，正好念出 6 2。',
      hints: ['想让屏幕先出现 6，20 和 3 中间放什么？', '想要剩下的 2，又该放什么？'],
      stars: { two: 2, three: 2 },
      source: { kind: 'original' },
      difficulty: 3,
    },
  ],
}
