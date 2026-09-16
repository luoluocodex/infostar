# 信息学闯关 · 小学信息学十佳之星 Web App

> 为珠海市「**小学信息学十佳之星**」（小学五、六年级）赛事打造的游戏化学习 Web App。
> 用**生活化类比 + 可视化执行**，把 C++ 语句与数学思维讲成一部能玩的小剧——**以玩带练**。

<p>
<img alt="status" src="https://img.shields.io/badge/状态-MVP%20可玩-blue">
<img alt="stack" src="https://img.shields.io/badge/技术栈-React%2018%20%2B%20Vite%20%2B%20TS-green">
<img alt="deploy" src="https://img.shields.io/badge/部署-群晖%20Docker%20%2B%20HTTPS-orange">
</p>

---

## 这是什么

一个跑在**手机浏览器**里的「算法可视化剧场」：

- **学生端**：竖屏、单手可玩，闯关地图 + 星级，把「爬楼梯 / 分糖果 / 排队伍」对应成递推 / 取余 / 排序；
- **教学内核**：每关强制绑定一个生活化类比，按「**场景 → 动手 → 抽象 → 回到 C++**」四步讲透；
- **技术内核**：自研 **C++ 子集解释器**（Lexer → Parser → Interpreter → Frame Trace），把程序执行变成可播放的动画；
- **部署形态**：**纯前端 SPA + nginx 静态容器**，跑在自有群晖 NAS 上，HTTPS + PWA 可安装可离线，无后端、无数据库。

> 当前进度：**Phase 0 地基 + Phase 1 MVP 已落地**——2 章 12 关的完整闭环可玩可存档，
> 题库通过构建期校验（Zod + 引擎真跑），引擎有单元测试，界面有真实浏览器验证。

## 快速导航

| 想看什么 | 去哪里 |
|---|---|
| **协作规约（改本仓库前必读）** | [`AGENTS.md`](AGENTS.md) |
| **开发方案（唯一权威蓝图）** | [`docs/plan/小学信息学十佳之星-WebApp开发方案.md`](docs/plan/小学信息学十佳之星-WebApp开发方案.md) |
| 文档总索引 | [`docs/README.md`](docs/README.md) |
| 项目结构与目录说明 | [`docs/guides/01-项目结构与目录说明.md`](docs/guides/01-项目结构与目录说明.md) |
| 部署指南（群晖 NAS） | [`docs/guides/02-部署指南（群晖NAS）.md`](docs/guides/02-部署指南（群晖NAS）.md) |
| 内容与题库规范 | [`docs/guides/03-内容与题库规范.md`](docs/guides/03-内容与题库规范.md) |
| MVP 12 关内容规格 | [`docs/guides/04-MVP-12关内容规格.md`](docs/guides/04-MVP-12关内容规格.md) |
| 术语勘误与小学化对照 | [`docs/guides/05-术语勘误与小学化对照表.md`](docs/guides/05-术语勘误与小学化对照表.md) |
| 原始资料（考纲 / 真题） | [`docs/reference/`](docs/reference/)（见其 [README](docs/reference/README.md)） |
| 版本记录 | [`CHANGELOG.md`](CHANGELOG.md) |

## 核心决策（已锁定，开发须遵守）

| # | 决策 |
|---|---|
| 1 | **纯前端「可视化执行」**，不做后端真实 C++ 编译判题 |
| 2 | 题库按考纲**改编/扩充/原创**，每题标注来源 `pastpaper` / `adapted` / `original` |
| 3 | 游戏化 = **闯关地图 + 星级**（线性）；不做宠物养成、排行榜、社交、多人对战 |
| 4 | **单个孩子自学**：无登录、无账号、无云同步；进度存本地（IndexedDB），可导出备份 |
| 5 | 部署：群晖 NAS + Docker（x86_64），**自有域名 + Let's Encrypt**，容器只绑 `127.0.0.1:8081`，只转发 80/443，**绝不暴露 DSM 5000/5001** |
| 6 | 代码输入 = **拖拽拼积木**（自研轻量引擎，不引入 Blockly） |
| 7 | 技术栈：React 18 + Vite + TS(strict) + Tailwind + Zustand + Framer Motion + Dexie + Zod + vite-plugin-pwa；部署用 nginx:alpine 单容器 |
| 8 | 界面**简体中文**，术语换成小学语言（见 [指南 05](docs/guides/05-术语勘误与小学化对照表.md)） |

## 内容边界（考纲 = 唯一依据）

- **数学**：小学 1–6 年级基础 + 培优难度（对标名校小升初自主招生命题）
- **C++**：主程序框架、表达式（**注意整数/实数差异**）、`int/long/float`、变量与 `++/--`、`cin/cout`、条件式与 `! && ||`、`if-else`、`for`、一维/二维数组、`if`+`for` 复合
- **算法**：顺序/二分查找；选择/插入/冒泡排序；枚举；递推；队列；栈
- **考试结构**：初试笔试 = 数学思考题 **70%** + 程序阅读/填空 **30%**；复试 = 笔试 + 机试
  → 产品内容取「**数学为主线（约占六成）**」

**内容规模**：6 大区域、约 **400** 题（数学 A/B/C = 240，程序算法 D/E = 140，真题 F = 20）。

## 路线图

| 阶段 | 目标 | 里程碑 | 状态 |
|---|---|---|---|
| **Phase 0** | 地基与规范（工程骨架 + 部署链路 + 内容规范） | M0 | ✅ 已完成 |
| **Phase 1** | **MVP：2 主题 12 关，跑通完整闭环** | **M1** | ✅ 已完成 |
| Phase 2 | 引擎覆盖全部 C++ 考纲；题库 150 题 | M2 | 待开始 |
| Phase 3 | 6 大算法剧场；题库 280 题；错题本 | M3 | 待开始 |
| Phase 4 | 400 题全量 + 学习报告 + 真题擂台 | M4 | 待开始 |

## MVP 里已经能玩到什么

| 能力 | 落地位置 |
|---|---|
| 蜿蜒小路闯关地图（12 关 / 2 区域 / 星级 / 逐关解锁） | `src/routes/MapPage.tsx` |
| 关卡五段式：情境 → 讲一讲 → 动手 → 反馈 → 结算 | `src/routes/LevelPage.tsx` |
| 五种题型：数学选择 / 数学填空 / 数学动手 / 读程序 / 程序填空 | `src/components/question/` |
| 拖拽积木 v1（L1 填空式，长按拖动 + 点选双路径） | `src/components/blocks/`、`src/engine/blocks/` |
| C++ 子集解释器 → 执行帧 → 可视化回放 | `src/engine/cpp/`、`src/components/viz/`、`src/components/runner/` |
| 星级 / 存档 / 导出导入 | `src/engine/grade.ts`、`src/store/` |
| PWA（可安装、离线可进地图与关卡） | `vite.config.ts`、`src/main.tsx` |
| 群晖 Docker 部署三件套 | `Dockerfile`、`docker-compose.yml`、`nginx.conf` |

## 本地开始

```bash
npm install
npm run dev              # 本地开发（http://127.0.0.1:5173）
```

质量门禁（提交前建议全绿）：

```bash
npm run lint             # 应用类型检查（TypeScript strict）
npm run lint:e2e         # e2e 用例类型检查
npm run validate:content # 题库校验：Zod + 把程序题真跑一遍
npm run test             # 引擎单元测试（解释器 / 判分 / 积木，91 个用例）
npm run build            # 产出 dist/ 与 PWA 资源
npm run verify           # 上面五步串起来
npm run e2e              # 真实浏览器验证（Playwright，自动构建 + 起 preview）
npm run verify:full      # verify + e2e
```

## 部署到群晖 NAS

```bash
docker compose build
docker compose up -d     # 容器只监听 127.0.0.1:8081
```

公网访问经群晖**反向代理**转发 80/443 进来，TLS 由 Let's Encrypt 终止；
容器**绝不**绑定 `0.0.0.0`，**绝不**暴露 DSM `5000/5001`。
完整步骤与安全清单见 [部署指南](docs/guides/02-部署指南（群晖NAS）.md)。

## 目录速览

```
infostar/
├─ README.md          CHANGELOG.md         AGENTS.md         .gitignore
├─ docs/
│  ├─ plan/           主方案（唯一权威蓝图）
│  ├─ reference/      原始资料（考纲 / 真题 / 训练题）
│  └─ guides/         01 结构 · 02 部署 · 03 题库规范 · 04 MVP 规格 · 05 术语
├─ src/
│  ├─ engine/         cpp/ 子集解释器 · blocks/ 积木引擎 · grade.ts 判分
│  ├─ content/        题库数据（按区域拆包 + Zod Schema + 交叉校验）
│  ├─ components/     viz/ 可视化 · runner/ 播放器 · blocks/ 积木 · question/ 题型
│  ├─ routes/         地图 / 关卡 / 结算 / 设置
│  ├─ store/          进度（Zustand + Dexie）与设置
│  ├─ i18n/zh.ts      全部中文文案（组件里不硬编码文案）
│  └─ styles/         tokens.css 设计令牌 + index.css 全局样式
├─ e2e/               Playwright 真实浏览器验证用例
├─ scripts/           题库校验 / 图标生成 / 字体抓取
├─ public/            PWA 图标、自托管字体、favicon
└─ Dockerfile  docker-compose.yml  nginx.conf  nginx-limit-zone.conf
```
详见 [项目结构与目录说明](docs/guides/01-项目结构与目录说明.md)。

---

> ⚠️ **版权**：`docs/reference/` 中的考纲与真题原卷仅供内部研读与题库改编，**不得原样照录进产品**。详见 [reference/README](docs/reference/README.md)。
