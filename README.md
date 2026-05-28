# 托福备考助手 (TOEFL Mini-App)

一款面向托福考生的智能备考平台，覆盖阅读、听力、口语、写作四大科目，集成 AI 题目解析、智能陪练、自适应学习规划与后台数据分析。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [API 文档](#api-文档)
- [商业化设计](#商业化设计)
- [后续迭代计划](#后续迭代计划)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 功能特性

### 四科练习

- **阅读**：文章阅读 + 题目练习 + 计时 + 结果分析
- **听力**：音频播放 + 题目练习 + 倍速播放
- **口语**：录音答题 + AI 评分（预留）
- **写作**：在线编辑器 + 计时 + AI 批改（预留）

### 智能学习

- **AI 陪练**：口语对话 / 听力沉浸模式，实时评分反馈
- **自适应学习计划**：基于目标分数和考试日期，自动生成分阶段学习计划
- **遗忘曲线复习**：改进版 SM-2 算法，智能推送错题复习
- **全真模拟**：四科连考模式，还原真实考试流程

### 商业化（预留）

- **会员体系**：免费用户 / 付费会员，功能分级
- **支付系统**：微信支付接入（预留），支持月卡/季卡/年卡
- **广告系统**：首页 Banner、练习完成页、错题本广告位
- **数据看板**：管理后台用户增长、活跃度、付费转化统计

---

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 小程序前端 | 微信小程序原生 (WXML/WXSS/JS) | 原生性能，直接调用微信 API |
| Web 前端 | Vue 3 + Vite + Element Plus | 响应式设计，适配移动端 |
| 管理后台 | Vue 3 + ECharts + Element Plus | 数据可视化 |
| 后端 | Node.js + Express | RESTful API，JWT 鉴权 |
| 数据库 | PostgreSQL 16 | 关系型 + JSONB，适合题库存储 |
| 缓存 | Redis | 会话管理 + 限流 |
| AI 服务 | OpenAI API（预留） | AI 评分 + 陪练对话 |
| 部署 | Render.com + GitHub Pages | 后端免费托管 + 前端静态部署 |

---

## 项目结构

```
toefl-miniapp/
├── miniprogram/          # 微信小程序前端
│   ├── pages/            # 小程序页面
│   ├── components/       # 通用组件（ad-banner 等）
│   └── utils/            # 工具函数
│
├── web/                  # Web 前端（Vue 3）
│   ├── src/views/        # 页面组件
│   ├── src/components/   # Vue 组件
│   └── src/stores/      # 状态管理
│
├── admin/                # 管理后台前端
│   └── src/views/admin/  # 管理页面
│
├── server/               # Node.js 后端
│   ├── src/routes/       # API 路由
│   ├── src/services/     # 业务逻辑层
│   ├── src/models/       # 数据库模型
│   └── src/middleware/   # 鉴权/日志/限流
│
├── docs/                 # 项目文档
│   ├── deployment.md     # 部署文档
│   ├── project-summary.md # 项目总结
│   └── api-spec.md      # API 接口文档
│
├── render.yaml           # Render.com 部署配置
├── .gitignore
└── README.md
```

---

## 快速开始

### 前置条件

- Node.js >= 18.0.0
- PostgreSQL >= 16.0
- npm >= 9.0

### 1. 克隆项目

```bash
git clone https://github.com/huieric/toefl-miniapp.git
cd toefl-miniapp
```

### 2. 启动后端

```bash
cd server

# 安装依赖
npm install

# 配置环境变量（创建 .env 文件）
cat > .env << EOF
NODE_ENV=development
PORT=10000
DATABASE_URL=postgresql://user:password@localhost:5432/toefl_db
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-xxx  # 可选
EOF

# 初始化数据库
psql "$DATABASE_URL" -f src/models/db-init.sql

# 启动开发服务器（自动重载）
npm run dev
```

后端启动后访问 `http://localhost:10000/api/v1/health` 验证。

### 3. 启动 Web 前端

```bash
cd web

npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

### 4. 启动管理后台

```bash
cd admin

npm install

npm run dev
```

### 5. 小程序预览

1. 打开 **微信开发者工具**
2. 导入项目，选择 `miniprogram/` 目录
3. 填入自己的 `AppID`（测试可使用测试号）
4. 修改 `miniprogram/utils/config.js` 中的 API 地址为本地后端地址

---

## 部署指南

详细部署步骤请参考 [docs/deployment.md](./docs/deployment.md)。

### 后端（Render.com 一键部署）

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Fork 本仓库到自己的 GitHub
2. 登录 [Render.com](https://render.com) → **New +** → **Blueprint**
3. 连接仓库，Render 自动读取 `render.yaml` 创建服务
4. 等待部署完成，获取后端域名

### Web 前端（GitHub Pages）

```bash
cd web
npm install
npm run build

# 推送到 gh-pages 分支
npx gh-pages -d dist --repo https://github.com/yourname/toefl-miniapp.git --branch gh-pages
```

访问：`https://yourname.github.io/toefl-miniapp/web/`

### 小程序

1. 在 [微信公众平台](https://mp.weixin.qq.com) 注册小程序，获取 `AppID`
2. 配置服务器域名：`https://your-backend.onrender.com`
3. 在微信开发者工具中点击 **上传**
4. 提交审核，审核通过后发布

---

## API 文档

详细 API 接口说明请参考 [docs/api-spec.md](./docs/api-spec.md)。

**基础路径**：`/api/v1`

| 模块 | 主要接口 |
|------|---------|
| 认证 | `POST /auth/login` |
| 用户 | `GET /user/profile`、`GET /user/usage-limit` |
| 题库 | `GET /questions`、`GET /practice-sets` |
| 考试 | `POST /exam/start`、`POST /exam/:id/submit` |
| 错题 | `GET /wrong-questions`、`POST /wrong-questions/:id/redo` |
| AI 陪练 | `POST /ai-talk/start`、`POST /ai-talk/:id/message` |
| 学习计划 | `POST /plan/create`、`GET /plan/daily/:date` |
| 会员 | `GET /membership/plans`、`POST /membership/create-order` |
| 管理后台 | `GET /admin/dashboard/overview`（需 admin 权限） |

---

## 商业化设计

### 会员套餐

| 套餐 | 价格 | 说明 |
|------|------|------|
| 月卡 | ¥29.9/月 | 按月订阅 |
| 季卡 | ¥79.9/季 | 相当于 ¥26.6/月 |
| 年卡 | ¥299/年 | 相当于 ¥24.9/月，最优惠 |

### 免费 vs 付费

| 功能 | 免费用户 | 付费会员 |
|------|---------|---------|
| 每日做题量 | 限 20 题 | 无限制 |
| AI 陪练时长 | 限 10 分钟/天 | 无限制 |
| 全真模拟 | 限 1 次/天 | 无限制 |
| 学习计划 | 基础版 | 完整功能 |

### 广告位

- **首页 Banner**：今日任务卡片下方
- **练习完成页**：成绩展示后
- **错题本**：错题列表下方

---

## 后续迭代计划

| 版本 | 重点 | 状态 |
|------|------|------|
| v1.0 | MVP：阅读+听力基础练习、错题集、PDF 上传解析 | ✅ 当前 |
| v1.1 | AI 陪练：口语对话 + 听力沉浸模式 | 🔲 进行中 |
| v1.2 | 全科覆盖：口语题、写作题 + AI 评分 | 🔲 待开发 |
| v1.3 | 全真模拟：四科连考模式 | 🔲 待开发 |
| v1.4 | AI 导师：学习计划自动生成 + 动态调节 | 🔲 待开发 |
| v1.5 | 后台管理：数据监控 + 反馈管理 | 🔲 待开发 |
| v2.0 | 商业化：付费会员完整支付流程 + 广告上线 | 🔲 待开发 |

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发规范

1. Fork 本仓库并创建功能分支 (`git checkout -b feature/xxx`)
2. 提交代码 (`git commit -m 'feat: add xxx'`)
3. 推送到分支 (`git push origin feature/xxx`)
4. 创建 Pull Request

### 代码风格

- 后端：使用 ESLint + Prettier
- 前端：Vue 3 `<script setup>` 语法
- 小程序：遵循微信小程序官方规范
- 提交信息：遵循 [Conventional Commits](https://www.conventionalcommits.org/)

---

## 许可证

本项目采用 **MIT 许可证**，详见 [LICENSE](./LICENSE) 文件。

---

## 联系方式

- 问题反馈：[GitHub Issues](https://github.com/huieric/toefl-miniapp/issues)
- 邮箱：<your-email@example.com>

---

*最后更新：2026-05-28*
