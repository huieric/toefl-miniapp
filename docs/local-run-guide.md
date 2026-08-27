# 本地跑 + 内网穿透 指南

> 目的：不花钱、不绑卡，在自己电脑上把整套应用（后端 + 前端 + OCR）跑起来，手机/测试用户都能访问。
> 你机器已有：Node v24、Docker、Python 3.11 ✅（无需装 PostgreSQL 系统包，用 Docker）。

---

## 一、一次性初始化

在 PowerShell 里运行（在仓库根目录 `toefl-miniapp` 下）：

```powershell
.\setup-local.ps1
```

> ⚠️ 先启动 **Docker Desktop**（右下角图标变成「Engine running」），否则脚本会报「Docker daemon is NOT running」。

它会：
1. 用 Docker 启动 PostgreSQL（容器名 `toefl-postgres`，端口 `5433`，库 `toefl_db`，用户 `toefl`/密码 `toefl123`）；
2. `server` 和 `web` 各执行 `npm install`（含 tesseract.js）。

> 后端启动时会**自动建表 + 灌种子数据**（`initDatabase()` 跑 `db-init.sql`），不用手动建库。

---

## 二、启动（两个终端）

**终端 1 — 后端**（端口 10000）
```powershell
cd D:\TapTap游戏赛道调研\toefl-miniapp\server
npm start
```
看到 `[TOEFL-Server] 服务已启动: http://localhost:10000` 即成功。

**终端 2 — 前端**（端口 5173）
```powershell
cd D:\TapTap游戏赛道调研\toefl-miniapp\web
npm run dev
```
看到 Vite 输出即成功。**本机访问：`http://localhost:5173`**（验证码 `123456`，开发环境打印在终端1日志里）。

> 前端已通过 `web/.env.development` 把 API 指向 `http://localhost:10000/api`，所以联调的是本地后端，不是 Render。

---

## 三、让手机 / 别人也能访问

### 方式 A：同一 WiFi（最简单，免费）
1. 查你电脑的局域网 IP：`ipconfig` → 找 IPv4（如 `192.168.1.100`）；
2. 手机连同一个 WiFi，浏览器打开：`http://192.168.1.100:5173`；
3. ⚠️ 前端要能访问后端：把 `web/.env.development` 里的 `VITE_API_BASE` 改成 `http://<你的局域网IP>:10000/api`，然后**重启 `npm run dev`**。

### 方式 A-2：Tailscale（自己的设备，推荐，无需 cpolar）
如果你电脑装了 Tailscale：
1. 手机也装 **Tailscale App**，登录同一个账号，加入你的网络；
2. 电脑上 `tailscale ip` 查你的 Tailscale IP（形如 `100.x.y.z`）；
3. 手机浏览器打开：`http://100.x.y.z:5173`；
4. 同样把 `web/.env.development` 的 `VITE_API_BASE` 改成 `http://100.x.y.z:10000/api`，重启前端。
> 特点：只有你（和你授权的设备）能访问，安全私密；适合个人测试，不用装 cpolar。

### 方式 B：内网穿透（给 WiFi 外的用户/真实测试用户）
用 **cpolar**（国内友好，免费版有随机公网域名）：

1. 到 https://www.cpolar.com 下载安装，注册账号；
2. 命令行：
   ```powershell
   cpolar authtoken <你的token>      # 在 cpolar 后台拿
   cpolar http 5173                  # 暴露前端
   cpolar http 10000                 # 再开一个终端暴露后端
   ```
3. 得到两个公网地址（形如 `https://xxxx.cpolar.top`）：
   - 前端：`https://前端域名`
   - 后端：`https://后端域名`
4. 改 `web/.env.development`：
   ```
   VITE_API_BASE=https://后端域名/api
   ```
   重启 `npm run dev`，把**前端域名**发给别人即可访问。

> 替代品：ngrok（`ngrok http 5173`，需注册拿 token）；花生壳等。

---

## 四、OCR（可选，让扫描版 PDF 也能解析）

本机需要 **poppler**（提供 `pdftoppm`）。Windows 安装：

```powershell
winget install --id poppler.poppler
# 装完重新打开终端，验证：
pdftoppm -v
```

> 装好后**重启后端**，上传扫描版 PDF 就会自动走本地 OCR（tesseract.js 已随 `npm install` 装好）。
> 如果 `winget` 装不上，去 poppler 的 Windows 构建（GitHub releases）下载，解压后把 `bin` 加入 PATH。

---

## 五、常见问题

| 问题 | 解决 |
|---|---|
| 后端启动报数据库连接失败 | Docker 容器没起：`docker start toefl-postgres`；或确认 `server/.env` 的 `DATABASE_URL` 是 `localhost:5433` |
| 前端页面打不开/API 报错 | 确认前端 `.env.development` 的 `VITE_API_BASE` 指向本地后端（`http://localhost:10000/api`），且两个终端都开着 |
| 验证码不对 | 开发环境验证码是随机的，看**终端1日志** `[验证码] 手机号 → 123456`；或临时把 `auth.js` 里改成固定值 |
| OCR 报「需要 poppler」 | 装 poppler（见上），重启后端 |
| 手机访问白屏 | 手机和电脑必须同一 WiFi（方式A）；方式B 用 cpolar |

---

## 六、说明

- **Redis 未使用**：本地不用配。
- **AI（DeepSeek/OpenAI）**：本地不配 key → 走规则引擎解析，够用；要 AI 解析再在 `server/.env` 加 `DEEPSEEK_API_KEY`。
- **数据在本地 Docker 里**：`docker start/stop toefl-postgres` 控制；数据存在卷 `toefl_pgdata`，删容器不丢。
- 想彻底清空重来：`docker rm -f toefl-postgres` 后重跑 `setup-local.ps1`。

---

## 七、外网访问（cpolar 单域名，当前推荐）

**原理**：构建前端 → 后端（:10000）同时托管页面和 API → cpolar 暴露 10000 → 一个域名访问全部。

### 一次性准备
```powershell
# 1. 装 cpolar（已装好：C:\Users\hui\cpolar\cpolar，已加入 PATH）
# 2. 注册 cpolar 账号（https://dashboard.cpolar.com 免费注册）
# 3. 绑定密钥（cpolar 后台「验证」页面拿 authtoken）：
cpolar authtoken <你的token>
```

### 构建前端（每次改前端后）
```powershell
cd D:\TapTap游戏赛道调研\toefl-miniapp\web
$env:VITE_BASE = '/'
$env:VITE_API_BASE = '/api'
npm run build
```

### 启动（一条命令）
```powershell
cd D:\TapTap游戏赛道调研\toefl-miniapp
.\run.ps1     # 确保后端在跑 + 启动 cpolar 隧道到 10000
```
cpolar 输出里找 `Forwarding  https://xxxx.cpolar.io -> localhost:10000`，**手机/外网访问该 https 域名**即可（不再需要前端 5173）。

### 停止
- cpolar 隧道：Ctrl+C；
- 后端：`.\stop-backend.ps1`。

### DSH（52071）也要外网访问？
```powershell
cpolar http 52071
```
> 免费版隧道数量可能有限，TOEFL（10000）优先；且把 DSH 暴露公网有安全风险（等于公开 agent 控制面板），务必确认 DSH 有鉴权，不建议长期公开。
