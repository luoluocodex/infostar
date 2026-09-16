# 02 · 部署指南（群晖 NAS）

> 配套主方案 §9。目标：把前端构建产物以**单个 nginx 静态容器**跑在群晖 NAS 上，经**群晖反向代理 + Let's Encrypt** 提供 HTTPS，实现局域网与公网统一入口、PWA 可安装可离线。

---

## 0. 前置条件

| 项 | 要求 |
|---|---|
| NAS | 群晖，**x86_64**，DSM 7.x，内存 ≥ 2 GB（纯静态托管，实际压力极小） |
| 套件 | **Container Manager**（原 Docker）、**控制面板 → 登录门户**、**安全性 → 证书** |
| 域名 | 一个自有域名（A 记录可指向家庭公网 IP） |
| 网络 | 路由器可做端口转发；家宽未被运营商封 80/443（否则走 DNS-01 或非标端口） |
| 可选 | 群晖 **DNS Server**（解决内网访问域名的 NAT 回环问题） |

---

## 1. 构建产物

### 1.1 多阶段 Dockerfile

```dockerfile
# ---------- 构建阶段 ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run validate:content && npm run build

# ---------- 运行阶段 ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 可选：访问口令（见第 6 节）
# COPY .htpasswd /etc/nginx/.htpasswd
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
```

### 1.2 docker-compose.yml

```yaml
services:
  infostar:
    build: .
    image: infostar:latest
    container_name: infostar
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:80"      # 只绑回环，外部一律经群晖反向代理
    environment:
      - TZ=Asia/Shanghai
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
```

> **为什么不直接开 `8081:80`？** 绑回环后该端口不会暴露到局域网/公网，攻击面只剩群晖反向代理那一个入口，规则最简、最安全。若确实需要 `http://NAS_IP:8081` 直连，可改成 `"8081:80"`，但**此时 PWA 离线会失效**（非 https 不注册 SW），且若做了端口转发就会暴露到公网。

---

## 2. 容器内 nginx 配置

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    server_tokens off;
    autoindex off;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;

    location / { try_files $uri $uri/ /index.html; }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /sw.js { add_header Cache-Control "no-cache"; }
    location = /manifest.webmanifest { add_header Cache-Control "no-cache"; }

    location ~ /\. { deny all; return 404; }
}
```

> `robots.txt` 放在 `public/`，内容：
> ```
> User-agent: *
> Disallow: /
> ```

---

## 3. 部署步骤

### 第一步 · 域名与网络

1. 域名商处加 A 记录 → 家庭宽带公网 IP。
2. 群晖 **控制面板 → 外部访问 → DDNS** 绑定，保持动态 IP 同步（或用域名商 API）。
3. 路由器**只转发 80 与 443** 到 NAS，其余端口一律不开；关闭 UPnP。
4. 确认运营商未封 80/443。

### 第二步 · 部署容器

5. 在项目根目录构建镜像（可在 NAS 上构建，或本机构建后导出 `infostar.tar` 再导入）。
6. 群晖 **Container Manager → 项目 → 新增** → 选择含 `docker-compose.yml` 的目录 → 启动。
7. 在 NAS 上验证：`curl -I http://127.0.0.1:8081` 返回 200。

### 第三步 · 反向代理与证书

8. 群晖 **控制面板 → 登录门户 → 高级 → 反向代理 → 新增**：

   | 项 | 值 |
   |---|---|
   | 来源 | `HTTPS` / `你的域名` / `443` |
   | 目的地 | `HTTP` / `127.0.0.1` / `8081` |
   | 自定义标头 | `X-Forwarded-Proto: https` |

9. 群晖 **控制面板 → 安全性 → 证书 → 新增 → 从 Let's Encrypt 获取证书**，填域名：
   - 80 公网可达 → **HTTP-01**，一键完成；
   - 80 被封 → **DNS-01**（需域名商 API Key）；不支持的用 acme.sh 签发后手动导入。
10. **安全性 → 证书 → 设置**：把证书绑定到该反向代理条目。

### 第四步 · 验证与安装

11. 手机访问 `https://域名` → 地址栏有锁。
12. 「添加到主屏幕」→ 从图标启动，`standalone` 模式正常。
13. Chrome DevTools → Application → Service Workers → 状态应为 `activated`。
14. 路由器为 NAS 保留固定内网 IP。

### 第五步 · 局域网访问优化（推荐）

15. 若路由器不支持 NAT 回环（hairpin），内网访问域名会失败或绕公网。用 **群晖 DNS Server** 或在路由器加「本地 DNS 覆盖」，把域名在内网解析到 NAS 内网 IP。
16. 之后内外统一走 `https://域名`，局域网直连最快，SW 与存档体验完全一致。

---

## 4. 验收清单

- [ ] `curl -I http://127.0.0.1:8081` → `200`
- [ ] `https://域名` 地址栏有锁；`http://域名` 自动跳转 HTTPS（如配置）
- [ ] DevTools 中 SW = `activated`
- [ ] 手机「添加到主屏幕」后图标、名称、启动页正常
- [ ] **飞行模式**下从桌面图标启动，已缓存关卡可打开并继续闯关
- [ ] 重启 NAS 后容器自动恢复（`restart: unless-stopped`）
- [ ] `https://域名/robots.txt` 返回 `Disallow: /`
- [ ] 响应头含 `X-Content-Type-Options` / `CSP` / `HSTS`
- [ ] 局域网与公网（手机关 WiFi 用流量）访问内容一致

---

## 5. 公网安全加固（必做）

**网络层**
- 只转发 80/443；**绝不为 DSM 5000/5001 做端口转发**
- 容器绑 `127.0.0.1:8081`
- 关闭路由器 UPnP
- NAS 管理员开**两步验证 + 强密码 + 自动封锁**

**应用层**
- nginx 安全头（见第 2 节）、`server_tokens off`、`autoindex off`
- 拒绝点文件、`robots.txt` 禁收录
- 反向代理层限流（`limit_req zone=... rate=20r/s`）
- 只允许 `GET` / `HEAD`

**运维层**
- 定期更新 `nginx:alpine`、重跑镜像扫描
- 群晖「通知」开启异常登录取证提醒
- 每季度查「日志中心 → 连接日志」

---

## 6. 访问口令（可选，推荐）

应用无登录，公网可达即为「拿到域名就能进」。**推荐加在容器 nginx 层**，随镜像版本化：

```bash
# 本地生成（首次）
htpasswd -c .htpasswd family        # 提示输入密码
# 之后追加用户
htpasswd .htpasswd kid
```

```nginx
location / {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

> `.htpasswd` 需在 `Dockerfile` 中 `COPY` 进镜像（示例已注释好该行）。
> ⚠️ `.htpasswd` **不要提交到 git**（已在 `.gitignore` 中忽略）。

---

## 7. 升级与回滚

**升级**
1. 改代码 → 本地 `npm run build` 冒烟 → 重新 `docker compose build` + `up -d`。
2. 若用镜像分发：`docker save infostar:latest -o infostar-$(date +%Y%m%d).tar`，NAS 端 `docker load`。

**回滚**
3. 保留上一个 tar 镜像，`docker load` 后 `docker compose up -d` 即可回到旧版。
4. 数据在用户手机本地（IndexedDB），**与容器无关**，升级/回滚不影响孩子进度。

**备份**
5. 镜像归档 + 项目目录纳入 Hyper Backup（见主方案 §9.5）。

---

## 8. 常见问题排查

| 现象 | 排查方向 |
|---|---|
| 域名打不开 | DNS 解析？端口转发？运营商封 80/443？DDNS 是否同步？ |
| 打开是 DSM 登录页 | 反向代理目的地配错，或误把 DSM 端口转发了 |
| 有页面但 SW 未注册 | 是否 https？响应头是否被反向代理破坏？`/sw.js` 是否 200？ |
| 刷新子路由 404 | 容器 nginx 缺少 `try_files ... /index.html` |
| 内网访问域名慢/失败 | NAT 回环问题 → 第 3 节第五步（本地 DNS 覆盖） |
| 页面样式错乱 | CSP 过严挡住内联样式；确认 `style-src 'self' 'unsafe-inline'` |
| 更新后仍是旧版 | `sw.js` / `index.html` 被缓存；确认二者为 `no-cache` |
