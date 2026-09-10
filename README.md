# 托福备考助手 (TOEFL Mini-App)

一款面向托福考生的备考工具：**自导题目 + 多端同步 + 错题/生词 FSRS 科学复习 + AI 打分**。核心理念是「用户自带真题资源，我们提供好用的考试系统」——上传 PDF/音频即可开始练习，不做版权内容分发。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [部署与访问](#部署与访问)
- [API 文档](#api-文档)
- [商业化设计](#商业化设计)
- [测试](#测试)
- [路线图](#路线图)
- [许可证](#许可证)

---

## 功能特性

### 核心（已实现）

- **PDF 题目自导入**：上传托福阅读/听力/口语/写作 PDF，自动解析文章、题目、选项、答案（带文字层的秒级解析；扫描图片型自动走本地 OCR）。
- **多端同步**：Web 端为主，数据在服务端 PostgreSQL，多设备共享。
- **错题本 + FSRS 科学复习**：答错自动入错题本，按 FSRS-4.5 遗忘曲线安排复习（忘记/模糊/认识/轻松 四键自评）。
- **生词本 + 划词加词**：阅读/听力原文点击单词自动查释义（音标+英文释义+例句）加入生词本，FSRS 安排背诵。
- **AI 打分（口语/写作）**：用户自带 AI Key（DeepSeek/OpenAI/自定义），对口语回答/作文给出 0-30 分 + 分维度评分 + 改进建议 + 参考回答/范文。
- **听力**：支持上传音频+题目，无音频时可用浏览器 TTS 朗读原文。

### 布局/体验

- 阅读总览**两级结构**：题集（一次上传=一个题集，带文件名）→ 每篇阅读。
- 移动端适配，阅读页「文章/答题」一键切换。

### 商业化（预留）

- 会员体系（免费/付费分级）、支付（微信支付，预留）、广告位。

---

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| Web 前端 | Vue 3 + Vite + Element Plus | 响应式，移动端优先 |
| 后端 | Node.js + Express | RESTful API，JWT 鉴权 |
| 数据库 | PostgreSQL 16 (Docker) | 关系型 + JSONB |
| 记忆算法 | FSRS-4.5（自研实现） | 错题/生词复习排期 |
| PDF 解析 | pdf-parse + 坐标布局分段 + tesseract.js + poppler | 文字版/扫描版都能解析 |
| AI 打分 | DeepSeek / OpenAI / 自定义（用户自带 Key） | 口语/写作评分 |
| 局域网/外网访问 | Tailscale / cpolar | 自托管暴露 |

---

## 项目结构

```
toefl-miniapp/
├── web/                  # Web 前端（Vue 3）
│   └── src/views/        # 页面（阅读/听力/口语/写作/生词本/错题本/AI设置…）
├── server/               # Node.js 后端
│   ├── src/routes/       # API 路由（questions/practice/vocab/wrong/ai…）
│   ├── src/services/     # 业务（fsrs / ai-scoring / pdf-parser / ocr / pdf-layout）
│   ├── src/models/       # 数据库初始化 SQL
│   ├── scripts/          # 调试/回归脚本
│   └── test/             # 单元测试
├── docs/                 # 文档
├── pdf/                  # 测试用 PDF（用户自己下载的真实 TPO）
└── README.md
```

---

## 快速开始

### 前置

- Node.js >= 18
- Docker（运行本地 PostgreSQL）

### 1. 数据库（Docker）

```bash
docker run -d --name toefl-postgres -p 5433:5432 \
  -e POSTGRES_USER=toefl -e POSTGRES_PASSWORD=toefl123 -e POSTGRES_DB=toefl_db \
  postgres:16
```

### 2. 后端

```bash
cd server
npm install
# server/.env 里配置：
#   PORT=10000  DATABASE_URL=postgresql://toefl:toefl123@localhost:5433/toefl_db  JWT_SECRET=xxx
npm start
```

首次启动自动建表 + 种子数据 + 回填题集。访问 `http://localhost:10000/api/health` 验证。

### 3. 前端（构建后由后端托管，单域名）

```bash
cd web
npm install
$env:VITE_BASE='/'; $env:VITE_API_BASE='/api'; npm run build   # Windows
# Linux/Mac: VITE_BASE=/ VITE_API_BASE=/api npm run build
```

然后访问 `http://localhost:10000/` 即是完整应用（前端 + API 同源）。

登录验证码固定为 `123456`（`server/.env` 可改 `AUTH_FIXED_CODE`）。

---

## 部署与访问

- **本机**：`http://localhost:10000/`（后端托管前端+API，单域名）。
- **局域网/外网**：Tailscale（本机 IP:10000）或 cpolar 隧道（公网 https 域名）。
- 开机自启：`autostart.ps1`（Docker → Postgres → 后端 → cpolar）。

---

## API 文档

基础路径：**`/api`**（非 `/api/v1`）。

| 模块 | 主要接口 |
|------|---------|
| 认证 | `POST /api/auth/login` |
| 题目 | `GET /api/questions?groupBy=passage|set`、`POST /api/questions/upload`（PDF+音频+subject） |
| 练习 | `POST /api/practice/submit`（阅读/听力判分，口语/写作 AI 打分） |
| 错题 | `GET /api/wrong`、`GET /api/wrong/review-plan`、`POST /api/wrong/:id/redo`（FSRS） |
| 生词 | `GET/POST /api/vocab`、`GET /api/vocab/review`、`GET /api/vocab/lookup` |
| AI 打分 | `POST /api/ai/grade` |
| 听力音频 | `GET /uploads/:file` |

---

## 商业化设计

- 会员套餐：月卡/季卡/年卡（预留支付接入）。
- 免费用户限每日做题量 / AI 次数；会员全解锁。
- 广告位：首页/练习完成页/错题本。

---

## 测试

### 后端测试

```bash
cd server
node test/sm2.test.js          # SM-2
node test/fsrs.test.js         # FSRS
node test/pdf-parser.test.js   # 答案/题型解析
node test/parser-metadata.test.js  # 中文边界/元数据剥离/真实PDF段落
node test/ai-scoring.test.js   # AI 打分
node scripts/regression.js     # 全量回归（pdf/ 下 222 个测试 PDF）
```

当前 **26/26** 后端单元测试通过，PDF 全量回归 **222/222**。

### 前端测试（Round 19 新增）

```bash
cd web
npx vitest run                 # Vitest 单元测试（51 测试点）
npx vitest run --coverage      # 覆盖率报告
npx playwright test            # Playwright E2E 测试（需前端服务运行中）
```

- **Vitest**: 覆盖 FSRS 算法 / i18n 语言检测 / 智能推荐算法
- **Playwright**: 前端 E2E 自动化测试（Chromium）
- **CI 集成**: GitHub Actions 自动运行 `vitest run --reporter=verbose`

---

## 路线图

| 状态 | 内容 |
|------|------|
| ✅ | PDF 自导入（文字版+OCR）、FSRS 错题/生词复习、AI 打分、题集两级浏览、Tailscale/cpolar 访问 |
| ✅ | 阅读/听力/口语/写作完整题库（908 题）、AI 阅读标注、听力 TTS、错题 AI 分析/归因、智能推荐 |
| ✅ | AI 写作构思面板、AI 口语模拟对话、错题智能复习推送、PWA 离线缓存、多语言 i18n |
| ✅ | 错题本移动端适配（响应式卡片列表）、CI/CD 自动化（GitHub Actions）、自动化测试（Vitest + Playwright） |
| ✅ | AI 写作润色（逐句优化 + 词汇升级 + 结构建议 + 一键应用全文） |
| 🔄 | AI 口语实时反馈 / AI 自适应学习路径 / AI 模考模拟 |
| 🔲 | 小程序/原生 App、学习报告、游戏化互动、会员支付 |

---

## 许可证

MIT

---

*最后更新：2026-01*
