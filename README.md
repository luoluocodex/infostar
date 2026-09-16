# 信息学闯关 · 小学信息学十佳之星 Web App

> 为珠海市「**小学信息学十佳之星**」（小学五、六年级）赛事打造的游戏化学习 Web App。
> 用**生活化类比 + 可视化执行**，把 C++ 语句与数学思维讲成一部能玩的小剧——**以玩带练**。

<p>
<img alt="status" src="https://img.shields.io/badge/状态-方案阶段-blue">
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

> 本仓库当前处于 **文档阶段**：方案、指南、原始资料已就位；代码将按 Phase 0 → MVP 逐步落地。

## 快速导航

| 想看什么 | 去哪里 |
|---|---|
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

| 阶段 | 目标 | 里程碑 |
|---|---|---|
| **Phase 0** | 地基与规范（工程骨架 + 部署链路 + 内容规范） | M0 |
| **Phase 1** | **MVP：2 主题 12 关，跑通完整闭环** | **M1** |
| Phase 2 | 引擎覆盖全部 C++ 考纲；题库 150 题 | M2 |
| Phase 3 | 6 大算法剧场；题库 280 题；错题本 | M3 |
| Phase 4 | 400 题全量 + 学习报告 + 真题擂台 | M4 |

## 本地开始（文档阶段）

本阶段无需构建，直接阅读文档即可：

```bash
git clone <repo-url> infostar
cd infostar
# 从 docs/plan/ 开始读方案，再按 docs/guides/ 施工
```

代码阶段（Phase 0 起）将提供：

```bash
npm install
npm run dev              # 本地开发
npm run validate:content # 题库校验（构建前必跑）
npm run build            # 产出 dist/
docker compose up -d     # NAS 上起容器
```

## 目录速览

```
infostar/
├─ README.md          CHANGELOG.md         .gitignore
├─ docs/
│  ├─ plan/           主方案（唯一权威蓝图）
│  ├─ reference/      原始资料（考纲 / 真题 / 训练题）
│  └─ guides/         01 结构 · 02 部署 · 03 题库规范 · 04 MVP 规格 · 05 术语
├─ src/               （Phase 0 起：routes / engine / components / content / store）
├─ public/            （PWA 图标、插画 SVG）
└─ Dockerfile  docker-compose.yml  nginx.conf  vite.config.ts  package.json
```

详见 [项目结构与目录说明](docs/guides/01-项目结构与目录说明.md)。

---

> ⚠️ **版权**：`docs/reference/` 中的考纲与真题原卷仅供内部研读与题库改编，**不得原样照录进产品**。详见 [reference/README](docs/reference/README.md)。
