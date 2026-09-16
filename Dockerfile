# =============================================================================
# 信息学闯关 · 生产镜像
# 多阶段构建：Node 里做 tsc + vite build，产物交给 nginx:alpine 单容器托管。
# 依据：主方案 §9、docs/guides/02-部署指南（群晖NAS）.md、AGENTS §2.8
# =============================================================================

# ---------- 阶段 1：构建 ----------
FROM node:22-alpine AS build
WORKDIR /app

# 依赖单独一层，改源码不必重装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 源码与配置
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src

# 构建期强校验：题库（Zod + 引擎真跑）不过就构建失败，绝不把坏题发上线
RUN npm run validate:content && npx tsc -p tsconfig.app.json --noEmit && npx vite build

# ---------- 阶段 2：运行 ----------
FROM nginx:alpine AS runtime

# 只保留一个入口：80。容器对外映射固定 127.0.0.1:8081（见 docker-compose.yml）
# 00- 前缀保证限流 zone 先于 default.conf 被加载（两者同处 http 上下文）
COPY nginx-limit-zone.conf /etc/nginx/conf.d/00-limit-zone.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# 访问口令（可选）：把 htpasswd 文件放在构建上下文同级目录并取消下面的注释。
# 生成方式见 docs/guides/02-部署指南（群晖NAS）.md。
# COPY .htpasswd /etc/nginx/.htpasswd

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
