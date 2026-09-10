# 托福备考助手 — PRD v6.0

> 版本: v5.0 → v6.0 | 日期: 2026-01 | 状态: 迭代中

---

## 一、项目概述

**托福备考助手**是一款面向托福考生的智能刷题工具。核心模式：用户导入PDF → AI解析题目 → 在线刷题 → 错题自动入库 → FSRS 科学排程复习。

### 1.1 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端（Web） | Vue 3 + Vite + Element Plus | 响应式，PWA 支持 |
| 管理后台 | Vue 3 + ECharts + Element Plus | 数据看板 + 用户/题目管理 |
| 后端 | Node.js + Express + JWT | 18+ 路由模块，RESTful API |
| 数据库 | PostgreSQL (端口5433) | 16张表，17个FSRS参数 |
| AI能力 | DeepSeek/OpenAI兼容 | PDF解析、口语写作打分、阅读标注、错题分析 |
| 部署 | Vite build + 后端 dev | 前端已构建 dist/ 产物 |

---

## 二、当前完成状态（截至 v6.0）

### 2.1 已完成功能

| 模块 | 功能 | 状态 | 详情 |
|------|------|------|------|
| 认证 | 手机号 + 验证码登录 | ✅ 完成 | JWT认证 + 用户管理 |
| 题目导入 | PDF上传 → AI解析 → 自动入库 | ✅ 核心完成 | `pdf-parser.js` v5, 支持批量 |
| 阅读练习 | 篇章列表 → 做题 → 结果 + 解析 | ✅ 完成 | **616条阅读数据（8篇长篇章）** |
| **阅读AI标注** | **生词标注 + 长难句解析** | ✅ 完成 | 调用AI自动标注，前端面板展示 |
| **听力练习** | **音频播放 + 题目练习** | ✅ **完成** | 16条听力 + **16/16 真实WAV音频** |
| **听力TTS** | **文本转音频服务** | ✅ **完成** | Windows SAPI TTS，讲座女声(Zira)/对话男声(David)，WAV格式 |
| 错题本 | 答错收录 + FSRS 排程 | ✅ 完成 | 卡片式重做 + 四档评分 + 3D翻转效果 |
| **错题AI分析** | **薄弱点报告 + 建议** | ✅ **完成** | 后端API + 前端对话框 |
| 生词本 | 自动提取 + FSRS 复习 | ✅ 基本可用 | 词汇列表 + 复习功能 |
| 学习仪表盘 | 统计卡片 + 四科进度环 | ✅ 可用 | 数据可视化 |
| **口语练习** | **题库 + AI打分** | ✅ **完成** | **50条口语题**（独立20+综合20）+ `/api/ai/grade` 评分 |
| **AI口语陪练** | **结构化对话练习** | ✅ **新增** | `SpeakingPractice.vue` + `/api/ai-speak` API（自动出题→答题→计时→评分→下一题） |
| **写作精批** | **4维度AI批改 + 逐句点评** | ✅ **完成** | **50条写作题** + 4维度评分(DOS 30分制) + **逐句修改建议** + 亮点列表 + 改进建议 |
| 模拟题生成 | 内置模板 + AI生成 | 🟡 基础可用 | 需优化 |
| **PWA支持** | **manifest + service worker** | ✅ **新增** | 可安装为桌面/移动应用 |
| **移动端TabBar** | **手机底部导航栏** | ✅ **新增** | App.vue 响应式布局 |
| **答题交互优化** | **选项高亮 + 倒计时** | ✅ **新增** | 单选高亮 + 阅读倒计时组件 |
| **上传进度可视化** | **PDF解析进度面板** | ✅ **新增** | UploadProgressCard 集成到所有List页面 |
| **骨架屏加载** | **页面加载骨架屏** | ✅ **新增** | Skeleton.vue + v-loading 全局可用 |
| 管理后台 | 数据看板 + 用户/题目管理 | 🟡 基础可用 | 统计 + CRUD |

### 2.2 数据状态

| 科目 | 题目数 | 音频 | 长篇章 | 备注 |
|------|--------|------|--------|------|
| 阅读 | **616** | N/A | **8篇** | 科学/历史/艺术/生物/社会学/地质学/心理学/经济学 |
| 听力 | 16 | 16/16 (真实WAV) | N/A | TTS生成，讲座女声/对话男声 |
| 口语 | **50** | N/A | N/A | 独立题20 + 综合题20 |
| 写作 | **50** | N/A | N/A | 独立写作20 + 综合写作20 |

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

---

## 三、v5.0 → v6.0 迭代完成项 ✅

### 方向一：📚 阅读文章持续扩充（P1 — 完结）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 1.2.1 | 地质学篇章 | P1 | ✅ **新增 `Plate Tectonics and Earth's Dynamic Surface`**（板块构造与地球动态表面）6题，hard难度，涵盖板块边界/俯冲/大陆碰撞/转换断层/地质预测 |
| 1.2.2 | 心理学篇章 | P1 | ✅ **新增 `Cognitive Behavioral Therapy and the Psychology of Change`**（认知行为疗法）6题，medium难度，涵盖CBT原理/三原则/疗效证据/结构化治疗/局限性 |
| 1.2.3 | 经济学篇章 | P1 | ✅ **新增 `The Theory of Comparative Advantage and International Trade`**（比较优势理论）6题，hard难度，涵盖绝对vs比较优势/机会成本/国际贸易/产业内贸易/分配不均 |

### 方向二：🤖 AI口语陪练功能（P1 — 新增）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 2.1 | AI口语陪练 | P1 | ✅ **前后端全面开发**：<br>**后端**：`routes/ai-speak.js` 提供 `/api/ai-speak/start`（随机出题5道）、`/api/ai-speak/grade`（AI评分返回score/delivery/languageUse/topicDevelopment/feedback/suggestions/highlights/sampleAnswer）、`/api/ai-speak/progress`（7日统计）<br>**前端**：`SpeakingPractice.vue`（10.19 kB）结构化练习流程：准备15s→回答45s→录音/文字输入→AI评分→下一题→总结果弹窗<br>**交互**：倒计时进度条、录音波形指示、三维度评分可视化、亮点/建议/参考回答<br>**路由**：`/speaking/practice` 会员专享 + SpeakingList导航按钮<br>**练习记录**：自动保存到 practice_records 表 |

### 方向三：🔧 工程化改进

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 4.6 | 数据一致性修复 | P3 | ✅ **统一 passages 存储方式**：修正 economics passage 从 `passsages` 表迁移至 `questions` 表（type='passage'），确保阅读列表API正确获取 |

---

## 四、v6.0 → v7.0 待完成事项 & 优先级

### 方向一：🎯 阅读持续扩充（P1 — 持续）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 1.2 | 更多阅读主题 | P1 | 天文学/神经科学/人类学/环境科学/数学史 | ⬜ 待开发 |

### 方向二：🤖 AI能力深化（P1 — 2周）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 2.2 | AI口语陪练录音优化 | P1 | 波形可视化、实时音量反馈、语音转文字 | ⬜ 待开发 |
| 2.3 | 个性化学习计划 | P2 | 基于错题数据和FSRS排程生成个性化方案 | ⬜ 待开发 |
| 2.4 | 智能题目推荐 | P2 | 根据薄弱知识点推荐练习题目 | ⬜ 待开发 |
| 2.5 | 阅读长难句深度解析 | P2 | AI自动识别长难句，提供结构拆解、语法分析、翻译 | ⬜ 待开发 |

### 方向三：📱 前端体验升级（P2 — 持续）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 3.1 | 深色模式 | P2 | Element Plus 主题切换 | ⬜ 待开发 |
| 3.2 | PWA离线缓存优化 | P2 | 增强SW缓存策略，支持离线刷题 | ⬜ 待开发 |
| 3.3 | 多语言支持 | P2 | 中文/英文界面切换 | ⬜ 待开发 |

### 方向四：🔧 工程化与运维（P2 — 1月）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| 4.1 | CI/CD 自动化 | P2 | GitHub Actions 构建 + 部署 | ⬜ 待开发 |
| 4.2 | 自动化测试 | P2 | 单元测试 + E2E 测试 | ⬜ 待开发 |

---

## 五、Round 4 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 阅读经济学篇章 | `default-economics.js` + 6题 | ✅ |
| 2 | 数据库入库验证 | reading=616(8篇), speaking=50, writing=50 | ✅ |
| 3 | AI口语陪练后端API | `routes/ai-speak.js`（3端点） | ✅ |
| 4 | AI口语陪练前端 | `SpeakingPractice.vue`（10.19 kB） | ✅ |
| 5 | 路由注册 + 导航入口 | `/speaking/practice` 会员页 + SpeakingList按钮 | ✅ |
| 6 | 前端构建验证 | dist/ 构建成功 | ✅ |
| 7 | 数据一致性修复 | economics passage 迁移至正确表 | ✅ |

---

## 六、架构变更

### 6.1 新增后端文件

| 文件 | 用途 |
|------|------|
| `server/src/routes/ai-speak.js` | AI口语陪练API（start/grade/progress） |
| `server/fix-economics-passage.js` | 数据迁移修复脚本 |

### 6.2 新增前端文件

| 文件 | 用途 | 大小 |
|------|------|------|
| `web/src/views/SpeakingPractice.vue` | AI口语陪练主界面 | 10.19 kB |

### 6.3 修改文件

| 文件 | 变更内容 |
|------|----------|
| `server/src/app.js` | 注册 aiSpeakRoutes 路由 |
| `web/src/router/index.js` | 添加 /speaking/practice 路由 + 会员检查 |
| `web/src/api/index.js` | 添加 aiSpeakAPI（start/grade/progress） |
| `web/src/views/SpeakingList.vue` | 添加 AI口语陪练导航按钮 |

---

## 七、下一步迭代（Round 5 建议）

1. **AI口语陪练录音优化** — 波形可视化 + 实时音量反馈
2. **听力内容扩充** — 新增2-4套听力练习（对话+讲座）
3. **错题AI分析可视化** — 将分析结果以图表形式展示
4. **阅读篇章再扩充** — 天文学/神经科学/人类学主题
