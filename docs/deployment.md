# 托福备考助手 - 部署文档

> 版本：v1.0 | 日期：2026-05-28

---

## 一、项目结构说明

```
toefl-miniapp/
├── miniprogram/      # 微信小程序前端（原生 WXML/WXSS/JS）
├── web/              # Web 前端（Vue 3 + Vite + Element Plus）
├── admin/            # 管理后台前端（Vue 3 + ECharts）
├── server/           # Node.js 后端（Express + PostgreSQL + Redis）
├── docs/             # 项目文档
├── render.yaml       # Render.com 部署配置
└── README.md
```

- **GitHub 仓库**：https://github.com/huieric/toefl-miniapp
- **Web 前端部署地址**：https://huieric.github.io/toefl-miniapp/web/
- **后端 API 部署地址**：https://toefl-api-m1ue.onrender.com

---

## 二、环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 后端运行环境 |
| PostgreSQL | >= 16.0 | 主数据库 |
| Redis | >= 6.0（可选） | 缓存 / 会话管理 |
| 微信开发者工具 | 最新版 | 小程序开发 / 预览 / 上传 |
| npm | >= 9.0 | 依赖管理 |

---

## 三、本地开发部署

### 3.1 克隆项目

```bash
git clone https://github.com/huieric/toefl-miniapp.git
cd toefl-miniapp
```

### 3.2 后端本地启动

```bash
cd server

# 安装依赖
npm install

# 配置环境变量（创建 .env 文件）
cp .env.example .env   # 如无可手动创建，参考下方环境变量说明

# 初始化数据库
psql "$DATABASE_URL" -f src/models/db-init.sql

# 启动开发服务器（自动重载）
npm run dev

# 生产模式启动
npm start
```

后端默认监听端口：`10000`（可通过 `PORT` 环境变量覆盖）

### 3.3 Web 前端本地启动

```bash
cd web

# 安装依赖（包含 echarts）
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建产物输出到 `web/dist/`，部署时将该目录内容推送到 `gh-pages` 分支。

### 3.4 管理后台本地启动

```bash
cd admin

npm install

npm run dev
```

---

## 四、后端部署（Render.com）

项目已包含 `render.yaml` 配置文件，支持一键部署。

### 4.1 自动部署步骤

1. 登录 [Render.com](https://render.com)，点击 **New +** → **Blueprint**
2. 连接 GitHub 仓库 `huieric/toefl-miniapp`
3. Render 自动读取 `render.yaml`，创建以下资源：
   - **PostgreSQL 数据库**（`toefl-db`，免费版）
   - **Web 服务**（`toefl-api`，免费版）
4. 等待部署完成，获取后端域名（如 `https://toefl-api-m1ue.onrender.com`）

### 4.2 环境变量配置

部署后在 Render 控制台 → 服务 → **Environment** 中确认/补充以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `10000` |
| `DATABASE_URL` | PostgreSQL 连接字符串（由 Render 自动注入） | 自动生成 |
| `JWT_SECRET` | JWT 签名密钥（Render 自动生成） | 自动生成 |
| `JWT_EXPIRE` | JWT 有效期 | `7d` |
| `REDIS_URL` | Redis 连接字符串（可选） | 留空则禁用缓存 |
| `OPENAI_API_KEY` | OpenAI API 密钥（可选，用于 AI 陪练/评分） | `sk-...` |
| `OPENAI_BASE_URL` | OpenAI API 基础地址 | `https://api.openai.com/v1` |

> **注意**：免费版 Render 服务在闲置一段时间后会自动休眠，首次请求会有数秒冷启动延迟，属正常现象。

### 4.3 数据库初始化

Render 部署完成后，在本地执行以下命令初始化数据库表结构：

```bash
# 使用 Render 提供的 DATABASE_URL
psql "<DATABASE_URL>" -f server/src/models/db-init.sql
```

或在 Render 控制台的 **Shell** 标签页中直接执行：

```bash
cd server && npm run db:init
```

默认管理员账号：`admin` / `admin123`，登录后请立即修改密码。

---

## 五、Web 前端部署（GitHub Pages）

### 5.1 构建配置

`web/vite.config.js` 中已配置 `base: '/toefl-miniapp/web/'`，确保资源路径正确。

### 5.2 手动部署

```bash
cd web

# 安装依赖
npm install

# 构建
npm run build

# 将 dist 目录内容推送到 gh-pages 分支
# 方式一：使用 gh-pages 工具
npx gh-pages -d dist --repo https://github.com/huieric/toefl-miniapp.git --branch gh-pages

# 方式二：手动推送
cp -r dist/* ../docs/web/   # 若仓库配置了 docs/ 目录发布
```

### 5.3 GitHub Actions 自动部署（推荐）

在项目根目录创建 `.github/workflows/deploy-web.yml`：

```yaml
name: Deploy Web Frontend

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - '.github/workflows/deploy-web.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: cd web && npm install

      - run: cd web && npm run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./web/dist
          publish_branch: gh-pages
```

推送后访问：https://huieric.github.io/toefl-miniapp/web/

---

## 六、小程序部署

### 6.1 开发预览

1. 打开 **微信开发者工具**
2. 导入项目，选择 `miniprogram/` 目录
3. 填入自己的 `AppID`（测试号可使用测试号 AppID）
4. 修改 `miniprogram/utils/api.js` 中的 `BASE_URL` 为后端地址

### 6.2 服务器域名配置

登录 [微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 → **服务器域名**：

```
request 合法域名：
https://toefl-api-m1ue.onrender.com

socket 合法域名：（如未使用 WebSocket 可不填）

uploadFile 合法域名：
https://toefl-api-m1ue.onrender.com

downloadFile 合法域名：
https://toefl-api-m1ue.onrender.com
```

### 6.3 业务域名配置

微信公众平台 → 开发 → 开发管理 → 开发设置 → **业务域名**：

```
https://huieric.github.io
```

### 6.4 上传与发布

1. 在微信开发者工具中点击 **上传**
2. 填写版本号和项目备注
3. 登录微信公众平台 → 版本管理 → 提交审核
4. 审核通过后发布上线

> **注意**：小程序 `appid` 需要在 [微信公众平台](https://mp.weixin.qq.com) 注册获取，个人主体无法使用微信支付功能。

---

## 七、环境变量完整示例

### 7.1 后端 `.env` 示例

```env
# 服务器
NODE_ENV=production
PORT=10000

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/toefl_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Redis（可选）
REDIS_URL=redis://localhost:6379

# OpenAI（可选，用于 AI 陪练）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1

# 微信登录（小程序）
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 前端地址（CORS 配置）
CORS_ORIGIN=https://huieric.github.io
```

### 7.2 小程序 `config.js` 示例

在 `miniprogram/utils/config.js` 中：

```javascript
module.exports = {
  // 后端 API 地址
  API_BASE_URL: 'https://toefl-api-m1ue.onrender.com/api/v1',
  // 微信登录相关
  APPID: 'your-wechat-appid'
}
```

---

## 八、数据库初始化详解

### 8.1 执行初始化脚本

```bash
psql "<DATABASE_URL>" -f server/src/models/db-init.sql
```

脚本包含以下内容：

| 表名 | 说明 |
|------|------|
| `users` | 用户表（含 membership 字段） |
| `user_stats` | 用户学习统计 |
| `questions` | 题库表 |
| `practice_sets` | 套题表 |
| `exam_records` | 考试/练习记录 |
| `wrong_questions` | 错题本 |
| `ai_conversations` | AI 陪练对话记录 |
| `study_plans` | 学习计划 |
| `daily_tasks` | 每日任务 |
| `user_feedback` | 用户反馈 |
| `usage_events` | 用户行为埋点 |
| `orders` | 订单表（商业化） |
| `subscriptions` | 订阅表（商业化） |
| `ad_impressions` | 广告展示记录 |
| `admin_users` | 管理员用户 |
| `admin_logs` | 管理员操作日志 |

### 8.2 默认数据

初始化脚本会自动创建：
- 默认管理员：`admin` / `密码哈希（需配合后端注册接口或手动设置）`
- 示例题库数据（阅读/听力/口语/写作各若干题）
- 示例练习套题

---

## 九、故障排除

### 9.1 后端启动失败

**问题**：`error: password authentication failed for user "postgres"`

**解决**：检查 `DATABASE_URL` 是否正确，确认 PostgreSQL 服务已启动。

---

**问题**：`listen EADDRINUSE: address already in use`

**解决**：更换 `PORT` 或关闭占用端口的进程：
```bash
# Windows
netstat -ano | findstr :10000
taskkill /PID <PID> /F

# macOS / Linux
lsof -i :10000
kill -9 <PID>
```

---

### 9.2 数据库迁移

目前使用手动执行 SQL 脚本的方式。新增表或字段时，直接在 `db-init.sql` 中使用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 保证幂等性，然后重新执行：

```bash
psql "<DATABASE_URL>" -f server/src/models/db-init.sql
```

---

### 9.3 Web 前端页面空白

**问题**：部署后访问 GitHub Pages 显示空白页

**解决**：
1. 检查 `vite.config.js` 中 `base` 是否设置为 `/toefl-miniapp/web/`
2. 检查 `router/index.js` 是否使用 `createWebHistory(base)` 或改为 `createWebHashHistory()`
3. 确认 `dist/` 目录已正确推送到 `gh-pages` 分支

---

### 9.4 小程序网络请求失败

**问题**：`request:fail url not in domain list`

**解决**：
1. 确认服务器域名已在微信公众平台配置
2. 开发阶段可在微信开发者工具中开启「不校验合法域名」选项（仅限开发，不能用于生产）

---

### 9.5 Render 免费版休眠问题

**问题**：服务长时间无请求后访问超时

**解决**：属 Render 免费版正常行为。可使用定时 ping 服务（如 [UptimeRobot](https://uptimerobot.com)）保持服务活跃，或升级到付费版。

---

## 十、部署检查清单

- [ ] 后端已部署，`/api/v1/health` 可访问
- [ ] 数据库连接正常，`users` 表可查询
- [ ] JWT_SECRET 已设置且非零长度字符串
- [ ] Web 前端已构建并部署到 GitHub Pages
- [ ] 小程序服务器域名已配置且通过校验
- [ ] 小程序业务域名已配置
- [ ] 管理员账号可正常登录后台
- [ ] 微信登录流程可走通（小程序）
- [ ] OpenAI API Key 已配置（如需 AI 功能）
- [ ] 环境变量中无敏感信息泄露到代码仓库（已加入 `.gitignore`）

---

*文档结束。*
