# 版本记录

本项目采用「方案版本」与「代码版本」合流的记录方式；文档阶段按方案版本号推进。

## [v0.1.0] - 2026-09-16 · Phase 0 地基 + Phase 1 MVP

### 新增（工程骨架）
- `package.json` / `tsconfig*.json` / `vite.config.ts` / `tailwind.config.ts` / `postcss.config.js` / `index.html`。
- 技术栈落地：React 18 + Vite 5 + TypeScript(strict) + Tailwind 3 + Zustand + Framer Motion + Dexie + Zod + vite-plugin-pwa。
- `src/styles/tokens.css`（设计令牌唯一数据源）与 `src/styles/index.css`（全局 + 氛围层 + 组件类）。

### 新增（引擎，纯逻辑、可在 Node 下单测）
- `src/engine/cpp/`：`lexer` → `parser`（递归下降）→ `interpreter`（生成执行帧）→ `index`（`runCpp` / `countInputReads` / `checkCode`）。
  覆盖表达式（整数/实数除法差异）、`cin`/`cout`、`if-else`、`for`、一维/二维数组、`++`/`--`（含前置自增作为表达式）、逻辑短路；上限 20000 步防死循环。
- `src/engine/cpp/errors.ts`：儿童化报错，不出现「expected ';'」这类黑话。
- `src/engine/blocks/`：L1 填空式拖拽积木模型、槽位类型校验、语法白名单、骨架渲染与逐槽判分（约定 G2）。
- `src/engine/grade.ts`：星级、逐章解锁（前序 ≥60%）、答案宽容比对（全角数字 / 中文单位 / 等值小数）。

### 新增（内容）
- `src/content/schema.ts`（Zod Schema + `superRefine` 跨字段校验）、`src/content/validate.ts`（交叉校验）、`src/content/index.ts`（地图轻量目录 + 动态 import）。
- 12 关题库：`regionC_thinking/C01_recursion.ts`（爬楼梯的递推，6 关）、`regionD_cpp/D01_boxes.ts`（变量与运算，6 关）。
- `scripts/validate-content.ts`：构建期校验——Zod + 引擎真跑 + `CHAPTER_META` 一致性 + MVP=12 关断言。

### 新增（界面）
- 路由：地图 / 关卡（五段式）/ 结算 / 设置。
- 题型组件：数学选择、数学填空、数学动手（爬楼梯、分糖果、会变的盒子）、读程序、程序填空。
- 可视化组件：变量盒子、数组柜、话筒打字机、循环轮盘、条件岔路；播放器支持播放/暂停/单步/回退/变速。
- 拖拽积木：长按 150ms 触发 + 点选后再点空格（无障碍备选路径）。
- 设计系统：暖奶油纸感背景（非纯白纯灰）+ 径向光斑 + 噪点、自托管 Baloo 2 显示字体、统一 `i18n/zh.ts` 文案（组件内零硬编码中文）。

### 新增（部署与验证）
- 部署三件套：`Dockerfile`（多阶段构建，构建期强校验题库）、`docker-compose.yml`（只绑 `127.0.0.1:8081`、只读根文件系统）、`nginx.conf` + `nginx-limit-zone.conf`（安全响应头、CSP、限流、SPA 兜底、SW 不缓存）。
- 单元测试：`src/engine/cpp/interpreter.test.ts`、`src/engine/grade.test.ts`、`src/engine/blocks/blocks.test.ts`（83 个用例）。
- 真实浏览器验证：`playwright.config.ts` + `e2e/`（smoke / layout / journey / pwa，覆盖 360·390·430·桌面四档视口）。

### 修复（由上述验证发现）
- **前置自增不能当表达式**（`int a = ++i;` 解析失败）→ 新增 `ExprPrefix` 节点与求值，`i++` 与 `++i` 的考点现在都能演示。
- **循环内 `cin` 的输入个数被静态低估** → `RunResult` 增加 `inputsUsed`，`checkCode` 改用「真跑一遍的实际读入数」校验约定 G1。
- **极快点按时拖拽监听来不及挂载**，会残留「拖拽中」幽灵 → 拖拽监听改为在 `pointerdown` 时同步挂载（`CodeFill` 与 `useLongPressDrag` 同步修复）。
- **7 处文字对比度不达标**（辅助文字 12px、点缀色白字、区域色浅底文字、叶绿白字）→ 调整 `--c-ink-faint` / `--c-accent-deep` / `--c-leaf`，新增 `--c-region-c-deep` / `--c-region-d-deep`；全部达到 ≥4.5:1。
- **缺少 `<main>` 地标** → `App.tsx` 补上；键盘输入备选按钮命中区从 ~20px 提到 ≥44px。
- **首屏单一 562 kB 巨块** → 按 `vendor-react` / `vendor-motion` / `vendor-data` 分包，最大块降到 162 kB（gzip 52.9 kB）。
- `parser.ts` 未使用方法、`MathChoice` 未使用导入、`CodeSkeleton` 的 `fills` 类型过严等编译期问题。

### 修复（第二轮真实浏览器验证追加）
- **结算页自相矛盾**：`ResultPage` 反推「怎么拿更多星星」时写死 `allCorrect: true` 且不传 `correctCount` —— 答错时第 1 颗星会错误地显示为「已获得」，拿满 3 星时第 2/3 颗星又错误地显示为「未获得」。
  → 存档新增 `lastAllCorrect`，且**只在本轮成绩不差于历史最好时刷新作答快照**，保证 `stars` 与说明来自同一次作答；并为三档说明加 `data-got` 与「已拿到 / 再努力」文字标签（图标+颜色对读屏不可读）。
- **「讲一讲」编号徽标对比度严重不足**：14px 白字配 `--c-accent`（3.38:1）与 `--c-sun`（**1.9:1**），远低于 4.5:1。→ 新增 `--c-sun-deep`，四步徽标统一改用 `-deep` 变体；对比度用例扩到「地图 / 讲一讲 / 动手段 / 结算页」四个界面（此前只在首页量，才漏掉了它）。
- **`/settings` 两个触摸目标低于 44px**：震动开关 56×32 且 `role="switch"` **没有可访问名字**；「清空所有进度」仅 320×24。→ 开关改为 68×48 命中区（开关本体保持小巧）+ `aria-label`；清空按钮补足 48px 高。
- **硬编码文案漏网**：`SettingsPage` 的导出文件名写死了中文，未走 `i18n/zh.ts`（违反 AGENTS §2.6 铁律 3）→ 改用 `zh.settings.exportFilePrefix`。
- **`@media (print)` 写法非法**（应为 `@media print`），导致打印时隐藏舞台装饰的规则从未生效。
- **`MapPage` 把总关卡数写死为 12** → 改用 `totalLevelCount()`，避免题库扩容后文案漂移。

### 验证基建修复（同样由真实浏览器验证发现）
- **线性闯关使多数用例无法直接打开目标关卡**（第 N 关要求 N-1 关有星）→ 新增 `seedProgress` / `unlockUpTo` / `openLevel`：先让首页把 IndexedDB 建好，再用原生 IndexedDB 写入进度（**不能指定版本号：Dexie 会把 schema 版本乘 10，真实库版本是 10**），最后 reload 让应用读到。
- **`getByText('动手')` 命中两个元素**：顶部进度条圆点与四步法标题重名 → 给 `LifeSteps` 加 `data-testid="life-steps"` 并把断言限定在四步法内。
- **用例内的重复流程**：五段式用例先点了 `go-play`，`playStairs` 又走了一遍前两段 → 拆出 `answerStairs`（只作答）。
- **Windows 下并发 worker 落盘 trace/截图互锁（EPERM）** → worker 固定为 4（CI 为 2）。
- **收工后卡在 `worker process did not exit within 300000ms`** → `webServer.command` 不再套一层 `npm`（改为直接起 `vite preview`），并显式声明 `gracefulShutdown`。
- **e2e 用例此前不在类型检查范围内** → 新增 `tsconfig.e2e.json` 与 `npm run lint:e2e`，纳入 `npm run verify`。

### 说明
- 仍为**纯前端**：无后端、无账号、无云同步；进度只存本机 IndexedDB（降级 localStorage）。
- `AGENTS.md` §2.1 八条锁定决策全部遵守；`cin` 取值只来自题目预置 `testInput`，不弹输入框。

## [v2.0] - 2026-09-16

### 新增
- 文档目录重组为三层：`docs/plan/`（方案）、`docs/reference/`（原始资料）、`docs/guides/`（操作指南）。
- 新增项目级文档：`README.md`、`CHANGELOG.md`、`docs/README.md`、`docs/reference/README.md`。
- 新增指南：`01-项目结构与目录说明`、`02-部署指南（群晖NAS）`、`03-内容与题库规范`、`04-MVP-12关内容规格`、`05-术语勘误与小学化对照表`。
- 主方案新增「§0 版本历史与本次修订摘要」「§1.4 术语勘误说明」「约定 G1（cin 预置）」「约定 G2（语法白名单 / 积木解耦）」。

### 变更（一致性修订 C1–C9）
- **C1** 内容配比口径由「数学 70%:程序 30%」改为「**数学为主线**」：数学类 240 题 : 程序算法类 140 题（约 6:4）；70/30 仅作为初试笔试权重的事实陈述。
- **C2**「五大内容区」更正为「**六大内容区**」（A–F）。
- **C3** 重排题量分配，主方案 §5.1 与 §14.1 **逐条对齐、合计均为 400**；「递推」不再被 C/E 重复计数。
- **C4**「不做」清单去重精炼为 7 条。
- **C5** 新增术语勘误：`cin` = 输入语句；「选大排序」→「选择排序」。
- **C6** 明确 `cin` 语义：取值来自题目预置用例 `testInput`，不弹交互输入框。
- **C7** MVP 积木限 L1；`C01-05` 降级为「填下标/运算符」；完整表达式积木推迟到 Phase 2。
- **C8** Basic Auth 明确推荐落在容器 nginx 层（`.htpasswd` 打进镜像）。
- **C9** 重建 `.gitignore` 为标准前端忽略规则（补 `node_modules/`、`dist/`、`.env`、`.htpasswd` 等）。

### 说明
- 本版仍为**纯文档**：`src/`、构建配置与 Docker 相关文件将在 Phase 0 创建。

## [v1.0] - 2026-09-16

### 新增
- 首版开发方案：需求确认纪要、内容分析（考纲范围 / 参考资料盘点 / 真题能力地图）、产品与游戏化设计、内容体系（A–F 六区）、纯前端技术方案（C++ 子集解释器 / 拖拽积木 / 题库引擎 / 存档 / PWA）、部署方案（群晖 Docker + 反向代理 + Let's Encrypt + 安全加固）、内容生产规范、风险对策、测试验收、里程碑与附录。
- 锁定 8 条需求决策与 MVP 定义（2 主题 12 关，闭环必须完整）。
