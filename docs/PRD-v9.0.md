# 托福备考助手 — PRD v9.0

> 版本: v8.0 → v9.0 | 日期: 2026-01 | 状态: 迭代中

---

## 一、项目概述

**托福备考助手**是一款面向托福考生的智能刷题工具。核心模式：用户导入PDF → AI解析题目 → 在线刷题 → 错题自动入库 → FSRS 科学排程复习。

### 1.1 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端（Web） | Vue 3 + Vite + Element Plus | 响应式，PWA 支持，**深色模式** |
| 管理后台 | Vue 3 + ECharts + Element Plus | 数据看板 + 用户/题目管理 |
| 后端 | Node.js + Express + JWT | 18+ 路由模块，RESTful API |
| 数据库 | PostgreSQL (端口5433) | 16张表，17个FSRS参数 |
| AI能力 | DeepSeek/OpenAI兼容 | PDF解析、口语写作打分、阅读标注、错题分析 |
| 图表 | ECharts 5.6.0 | 错题本AI分析可视化（横向柱状图+环形图） |
| 部署 | Vite build + 后端 dev | 前端已构建 dist/ 产物 |

---

## 二、当前完成状态（截至 v9.0）

### 2.1 已完成功能

| 模块 | 功能 | 状态 | 详情 |
|------|------|------|------|
| 认证 | 手机号 + 验证码登录 | ✅ 完成 | JWT认证 + 用户管理 |
| 题目导入 | PDF上传 → AI解析 → 自动入库 | ✅ 核心完成 | `pdf-parser.js` v5, 支持批量 |
| 阅读练习 | 篇章列表 → 做题 → 结果 + 解析 | ✅ 完成 | **651条阅读数据（13篇长篇章）** |
| **阅读AI标注** | **生词标注 + 长难句深度解析** | ✅ **完成** | 调用AI自动标注，前端展示 grammarType/mainClause/clauses/keyPoints |
| **听力练习** | **音频播放 + 题目练习** | ✅ **完成** | **28条听力** + TTS生成音频 |
| **听力TTS** | **文本转音频服务** | ✅ **完成** | Windows SAPI TTS，讲座女声(Zira)/对话男声(David)，WAV格式 |
| 错题本 | 答错收录 + FSRS 排程 | ✅ 完成 | 卡片式重做 + 四档评分 + 3D翻转效果 |
| **错题AI分析** | **薄弱点报告 + 可视化图表** | ✅ **完成** | **ECharts 图表**（横向柱状图显示各科薄弱度 + 环形图显示题型分布）+ 前端对话框 |
| 生词本 | 自动提取 + FSRS 复习 | ✅ 基本可用 | 词汇列表 + 复习功能 |
| 学习仪表盘 | 统计卡片 + 四科进度环 | ✅ 可用 | 数据可视化 |
| **口语练习** | **题库 + AI打分** | ✅ **完成** | **53条口语题**（独立20+综合20+新增13） + `/api/ai/grade` 评分 |
| **AI口语陪练** | **结构化对话练习 + 波形可视化** | ✅ **完成** | `SpeakingPractice.vue`（11.81 kB）+ `/api/ai-speak` API（自动出题→答题→计时→评分→下一题）+ **Canvas波形可视化 + 实时音量指示** |
| **写作精批** | **4维度AI批改 + 逐句点评** | ✅ **完成** | **50条写作题** + 4维度评分(DOS 30分制) + **逐句修改建议** + 亮点列表 + 改进建议 |
| 模拟题生成 | 内置模板 + AI生成 | 🟡 基础可用 | 需优化 |
| **PWA支持** | **manifest + service worker** | ✅ **完成** | 可安装为桌面/移动应用 |
| **移动端TabBar** | **手机底部导航栏** | ✅ **完成** | App.vue 响应式布局 |
| **答题交互优化** | **选项高亮 + 倒计时** | ✅ **完成** | 单选高亮 + 阅读倒计时组件 |
| **上传进度可视化** | **PDF解析进度面板** | ✅ **完成** | UploadProgressCard 集成到所有List页面 |
| **骨架屏加载** | **页面加载骨架屏** | ✅ **完成** | Skeleton.vue + v-loading 全局可用 |
| **个性化学习计划** | **创建/查看/任务管理** | ✅ **完成** | 三阶段计划（基础巩固→强化提升→冲刺模考）+ 每日任务跟踪 + 考试倒计时 |
| **深色模式** | **主题切换** | ✅ **完成** | CSS变量主题系统 + localStorage持久化 + 侧边栏切换按钮 |
| 管理后台 | 数据看板 + 用户/题目管理 | 🟡 基础可用 | 统计 + CRUD |

### 2.2 数据状态

| 科目 | 题目数 | 音频 | 长篇章 | 备注 |
|------|--------|------|--------|------|
| 阅读 | **651** | N/A | **13篇** | 科学/历史/艺术/生物/社会学/地质学/心理学/经济学/天文学/神经科学/**人类学/环境科学/数学史** |
| 听力 | **28** | TTS | N/A | **13对话 + 15讲座**（新增考古讲座+选题对话） |
| 口语 | **53** | N/A | N/A | 独立题29 + 综合题24（含新增13题） |
| 写作 | **50** | N/A | N/A | 独立写作20 + 综合写作20（含新增18题） |
| **总计** | **782** | | | |

#### 阅读长篇章清单

| 编号 | 主题 | 难度 | 题目数 |
|------|------|------|--------|
| sha-science-001 | Photosynthesis and Plant Energy Metabolism | hard | 6 |
| sha-history-001 | The Silk Road and Cross-Civilization Trade | medium | 6 |
| sha-art-001 | Renaissance Painting Techniques and Artistic Innovation | medium | 6 |
| bio-biology-001 | Symbiosis and Mutualistic Relationships in Nature | hard | 6 |
| soc-sociology-001 | Urbanization and Its Impact on Traditional Communities | medium | 6 |
| geo-geology-001 | Plate Tectonics and Earth's Dynamic Surface | hard | 6 |
| psy-psychology-001 | Cognitive Behavioral Therapy and the Psychology of Change | medium | 6 |
| eco-economics-001 | The Theory of Comparative Advantage and International Trade | hard | 6 |
| astro-astronomy-001 | Black Holes and the Structure of Galaxies | hard | 6 |
| neuro-neuroscience-001 | Neuroplasticity and the Adaptive Brain | hard | 6 |
| **anthro-anthropology-001** | **The Development of Early Agriculture and Its Social Consequences** | **hard** | **6** |
| **envsci-environmental-001** | **Ocean Pollution and the Great Pacific Garbage Patch** | **hard** | **6** |
| **math-history-001** | **The History of Zero: From Nothing to Everything** | **hard** | **6** |

---

## 三、v8.0 → v9.0 迭代完成项 ✅

### 方向一：🎯 题库持续扩充（P1 — 完成）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 1.3 | 更多阅读主题 | P1 | ✅ **新增 3 篇阅读长篇章**：<br>• **The Development of Early Agriculture and Its Social Consequences**（人类学）— 新石器革命起源、农业社会后果，6题<br>• **Ocean Pollution and the Great Pacific Garbage Patch**（环境科学）— 太平洋垃圾带形成机制与生态影响，6题<br>• **The History of Zero: From Nothing to Everything**（数学史）— 零从占位符到数字概念的历史演进，6题<br>• 数据库验证：reading 从 630 → **651**（10篇 → **13篇**） |
| 1.4 | 听力内容扩充 | P1 | ✅ **新增 2 套听力练习**：<br>• **Lecture: Archaeological Discoveries in the Indus Valley** — 印度河流域文明考古发现（城市布局/排水系统/衰落原因），6题<br>• **Conversation: Choosing a Research Paper Topic** — 学生与教授讨论环境科学论文选题，6题<br>• 数据库验证：listening 从 16 → **28**（对话 7→13，讲座 9→15） |

### 方向三：📱 前端体验升级（P2 — 部分完成）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 3.1 | **深色模式** | P2 | ✅ **前后端全面实现**：<br>**CSS 变量主题系统**（`style.css` 追加 dark 主题）：<br>• 覆盖 --bg, --card-bg, --text, --text-secondary, --border 等核心变量<br>• Element Plus 组件覆盖（el-table, el-dialog, el-input, el-menu, el-select 等）<br>**侧边栏主题切换按钮**（`App.vue`）：<br>• 紫色主题栏 + Moon/Sunny 图标切换<br>• localStorage 持久化用户偏好<br>**响应式暗色适配**：<br>• 侧边栏背景、TabBar、升级卡片、面包屑栏暗色适配<br>• 滚动条暗色适配 |

---

## 四、v9.0 → 下一轮待完成事项 & 优先级

### 方向一：🎯 题库持续扩充（P1）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 1.6 | 阅读考古学篇章 | P1 | 新增考古学阅读篇章（6题） | ⬜ 待开发 |
| 1.7 | 口语/写作题库补充 | P1 | 新增综合口语/独立写作各 10+ 题 | ⬜ 待开发 |

### 方向二：🤖 AI能力深化（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 2.7 | 智能题目推荐 | P2 | 根据薄弱知识点推荐练习题目 | ⬜ 待开发 |
| 2.8 | 错题自动归因 | P2 | AI分析错题根本原因（词汇/语法/逻辑/知识点） | ⬜ 待开发 |
| 2.9 | 写作AI辅助构思 | P2 | 独立写作时AI提供思路/论据 | ⬜ 待开发 |

### 方向三：📱 前端体验升级（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 3.2 | PWA离线缓存优化 | P2 | 增强SW缓存策略，支持离线刷题 | ⬜ 待开发 |
| 3.3 | 多语言支持 | P2 | 中文/英文界面切换 | ⬜ 待开发 |

### 方向四：🔧 工程化与运维（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 4.1 | CI/CD 自动化 | P2 | GitHub Actions 构建 + 部署 | ⬜ 待开发 |
| 4.2 | 自动化测试 | P2 | 单元测试 + E2E 测试 | ⬜ 待开发 |
| 4.3 | 数据库备份 | P2 | 定期备份策略 | ⬜ 待开发 |

---

## 五、Round 6-9 完成清单

### Round 6

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | PRD v7.0 待完成项系统性评估 | 确定 Round 7 优先级 | ✅ |

### Round 7

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 天文学阅读篇章入库 | `seed-reading-astronomy.js` + 数据库验证 616→630 | ✅ |
| 2 | WrongBook ECharts 可视化升级 | 横向柱状图 + 环形图，echarts 5.6.0 集成 | ✅ |
| 3 | 阅读长难句深度解析 | 后端 prompt 升级（grammarType/mainClause/clauses/keyPoints）+ 前端 UI 适配 | ✅ |
| 4 | 前端构建验证 | dist/ 构建成功（ReadingPassage 13.12 kB） | ✅ |
| 5 | 数据库最终验证 | reading=630, listening=16, speaking=53, writing=50, 总=749 | ✅ |

### Round 8

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 个性化学习计划完整实现 | 后端 planner.js + routes/plan.js + 前端 PlanIndex.vue（7.92 kB） | ✅ |
| 2 | API 对接完善 | planAPI 更新（create/current/daily/toggleTask） | ✅ |
| 3 | 前端构建验证 | dist/ 构建成功 | ✅ |
| 4 | PRD v8.0 生成 | 本文档的上一个版本 | ✅ |
| 5 | 数据库最终验证 | reading=630, listening=16, speaking=53, writing=50, 总=749 | ✅ |

### Round 9

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 人类学/环境科学/数学史阅读扩充 | `default-anthropology-environmental-math.js` + `seed-reading-anthropology.js`（3篇×6=18题） | ✅ |
| 2 | 听力扩充（讲座+对话） | `seed-listening-expansion.js`（考古讲座6题 + 选题对话6题 = 12题） | ✅ |
| 3 | 缺失 passage 行修复 | `add-passage-rows.js`（补充 3 篇 type='passage' 行） | ✅ |
| 4 | 前端深色模式 | `style.css` dark主题变量 + `App.vue` 切换按钮 + localStorage持久化 | ✅ |
| 5 | 前端构建验证 | dist/ 构建成功（4.82s） | ✅ |
| 6 | 数据库最终验证 | reading=**651**(13篇), listening=**28**(13对话+15讲座), speaking=53, writing=50, 总=**782** | ✅ |
| 7 | PRD v9.0 生成 | 本文档 | ✅ |

---

## 六、架构变更

### 6.1 新增后端文件

| 文件 | 用途 |
|------|------|
| `server/src/data/default-anthropology-environmental-math.js` | 人类学/环境科学/数学史阅读数据（3篇18题） |
| `server/src/data/seed-reading-anthropology.js` | 阅读种子脚本（幂等） |
| `server/src/data/seed-listening-expansion.js` | 听力种子脚本（考古讲座+选题对话） |
| `server/add-passage-rows.js` | passage 行修复脚本 |

### 6.2 修改后端文件

| 文件 | 变更内容 |
|------|----------|
| `server/verify-final.js` | SQL 修复（移除 SUM(COUNT) 嵌套） |

### 6.3 修改前端文件

| 文件 | 变更内容 |
|------|----------|
| `web/src/style.css` | 追加 dark 主题变量（--bg, --card-bg, --text 等）+ Element Plus 暗色适配 |
| `web/src/App.vue` | 深色模式切换（isDark 状态 + toggleTheme + localStorage）+ 侧边栏主题按钮 |

---

## 七、数据库表结构（核心字段）

### questions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| subject | VARCHAR | reading/listening/speaking/writing |
| type | VARCHAR | passage/choice/fill-in/essay 等 |
| difficulty | VARCHAR | easy/medium/hard |
| title | TEXT | 题目/篇章标题 |
| content | TEXT | 题目内容 |
| options | JSONB | 选项数组 |
| answer | TEXT | 答案 |
| analysis | TEXT | 解析/阅读摘要 |
| audio_url | TEXT | 听力音频路径 |
| passage_text | TEXT | 阅读文章内容 |
| source | VARCHAR | 来源 |
| status | VARCHAR | pending/approved/rejected |
| passage_id | VARCHAR | 关联篇章ID |
| question_order | INT | 题目顺序 |
| batch_id | VARCHAR | 导入批次 |
| batch_name | VARCHAR | 导入批次名称 |

### study_plans 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| user_id | INT | 用户ID |
| target_score | INT | 目标分数 |
| current_score | INT | 当前水平 |
| exam_date | DATE | 考试日期 |
| daily_minutes | INT | 每日学习时长 |
| weak_subjects | JSONB | 薄弱科目 |
| phases | JSONB | 三阶段计划 |
| status | VARCHAR | active/completed |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 八、技术约束与约定

### 8.1 阅读题库存储

- 阅读文章和题目均存 `questions` 表
- 通过 `type='passage'` + `passage_id` 分组
- 每篇阅读包含 1 条 passage 记录 + N 道题目记录
- **新增篇章必须包含 passage 行（type='passage', question_order=0）**

### 8.2 种子脚本模式

- `default-*.js` 数据文件 + `seed-*.js` 执行脚本
- 使用 `ON CONFLICT DO NOTHING` 保证幂等
- 数据迁移后必须运行数据库验证脚本

### 8.3 前端构建

- 前端构建产物位于 `dist/` 目录
- 构建命令：`cd web && npx vite build`
- 构建验证：检查 dist/ 是否存在 + 无错误输出

### 8.4 ECharts 集成

- ECharts 5.6.0 已作为 web 依赖
- 在 Vue 中使用：`import * as echarts from 'echarts'`
- 图表类型：bar chart（横向柱状图）+ pie chart（环形图）

### 8.5 深色模式约定

- 主题通过 `data-theme` 属性切换（`light` / `dark`）
- 所有颜色使用 CSS 变量，通过 `:root` 和 `[data-theme="dark"]` 定义
- 用户偏好存储在 `localStorage` 中，key 为 `toefl-dark-mode`
- 侧边栏主题切换按钮：`sidebar-theme-toggle` 类

---

## 九、PRD 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0-v3.0 | 早期 | 基础刷题 + 错题本 + FSRS |
| v4.0 | 早期 | PDF 导入 + AI 解析 |
| v5.0 | 早期 | 口语练习 + 写作精批 |
| v6.0 | 早期 | 生词本 + 学习仪表盘 |
| v7.0 | 2026-01 | PWA + 移动端TabBar + 口语陪练波形可视化 + 题库扩充(speaking 44→53, writing 32→50) |
| v8.0 | 2026-01 | 阅读扩充至10篇 + WrongBook ECharts + 长难句深度解析 + 个性化学习计划 |
| **v9.0** | **2026-01** | **阅读扩充至13篇(人类学/环境科学/数学史) + 听力扩充至28(考古讲座+选题对话) + 深色模式** |
