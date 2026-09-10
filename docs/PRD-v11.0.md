# 托福备考助手 — PRD v22.0

> 版本: v17.0 → v18.0 → v19.0 → v20.0 → v21.0 → **v22.0** | 日期: 2026-01 | 状态: 游戏化系统（成就/XP/配对游戏）

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

## 二、当前完成状态（截至 v11.0）

### 2.1 已完成功能

| 模块 | 功能 | 状态 | 详情 |
|------|------|------|------|
| 认证 | 手机号 + 验证码登录 | ✅ 完成 | JWT认证 + 用户管理 |
| 题目导入 | PDF上传 → AI解析 → 自动入库 | ✅ 核心完成 | `pdf-parser.js` v5, 支持批量 |
| 阅读练习 | 篇章列表 → 做题 → 结果 + 解析 | ✅ 完成 | **664条阅读数据（14篇长篇章）** |
| **阅读AI标注** | **生词标注 + 长难句深度解析** | ✅ **完成** | 调用AI自动标注，前端展示 grammarType/mainClause/clauses/keyPoints |
| **听力练习** | **音频播放 + 题目练习** | ✅ **完成** | **28条听力** + TTS生成音频 |
| **听力TTS** | **文本转音频服务** | ✅ **完成** | Windows SAPI TTS，讲座女声(Zira)/对话男声(David)，WAV格式 |
| 错题本 | 答错收录 + FSRS 排程 | ✅ 完成 | 卡片式重做 + 四档评分 + 3D翻转效果 |
| **错题AI分析** | **薄弱点报告 + 可视化图表** | ✅ **完成** | **ECharts 图表**（横向柱状图显示各科薄弱度 + 环形图显示题型分布）+ 前端对话框 |
| **错题自动归因** | **AI归因分析 + 可视化** | ✅ **新增** | 后端 `/api/analysis/attribution` 端点 + 前端 WrongBook 弹窗展示主要原因分布、高频错题、针对性建议、每道题归因明细 |
| 生词本 | 自动提取 + FSRS 复习 | ✅ 基本可用 | 词汇列表 + 复习功能 |
| 学习仪表盘 | 统计卡片 + 四科进度环 | ✅ 可用 | 数据可视化 |
| **智能题目推荐** | **基于薄弱知识点推荐练习** | ✅ **新增** | 后端 `/api/questions/recommend` 端点 + 前端 Dashboard 推荐卡片，支持60/20/20难度平衡 |
| **口语练习** | **题库 + AI打分** | ✅ **完成** | **86条口语题**（独立+综合） + `/api/ai/grade` 评分 |
| **AI口语陪练** | **结构化对话练习 + 波形可视化** | ✅ **完成** | `SpeakingPractice.vue`（11.81 kB）+ `/api/ai-speak` API（自动出题→答题→计时→评分→下一题）+ **Canvas波形可视化 + 实时音量指示** |
| **写作精批** | **4维度AI批改 + 逐句点评** | ✅ **完成** | **83条写作题** + 4维度评分(DOS 30分制) + **逐句修改建议** + 亮点列表 + 改进建议 |
| **写作AI辅助构思** | **独立写作AI思路生成** | ✅ **新增** | `POST /api/practice/brainstorm` API + WritingDetail 构思面板（核心论点/推荐结构/分论据+例证/范文参考/推荐词汇/写作建议） |
| 模拟题生成 | 内置模板 + AI生成 | 🟡 基础可用 | 需优化 |
| **PWA支持** | **manifest + service worker** | ✅ **完成** | 可安装为桌面/移动应用 |
| **移动端TabBar** | **手机底部导航栏** | ✅ **完成** | App.vue 响应式布局 |
| **答题交互优化** | **选项高亮 + 倒计时** | ✅ **完成** | 单选高亮 + 阅读倒计时组件 |
| **上传进度可视化** | **PDF解析进度面板** | ✅ **完成** | UploadProgressCard 集成到所有List页面 |
| **骨架屏加载** | **页面加载骨架屏** | ✅ **完成** | Skeleton.vue + v-loading 全局可用 |
| **个性化学习计划** | **创建/查看/任务管理** | ✅ **完成** | 三阶段计划（基础巩固→强化提升→冲刺模考）+ 每日任务跟踪 + 考试倒计时 |
| **深色模式** | **主题切换** | ✅ **完成** | CSS变量主题系统 + localStorage持久化 + 侧边栏切换按钮 |
| **🔥 每日打卡 Streak** | **连续学习天数 + 7天日历** | ✅ **新增** | Dashboard 🔥徽章 + 7天打卡日历 UI + `/api/user/streak` + `/api/user/update-study` |
| **FSRS 记忆强度** | **生词本 ●●● 可视化** | ✅ **新增** | VocabReview 记忆强度指示器 + VocabList 生词卡片 ●●●/●○○ + 后端返回 stability 字段 |
| **口语 6 维度评分** | **发音/流利度/语调/语法/词汇/任务** | ✅ **新增** | `/api/ai/grade` 扩展 6 维度 + SpeakingDetail 维度卡片 + 优点/弱点/建议 |
| **错题 ECharts 图表** | **饼图 + TOP5 薄弱点** | ✅ **新增** | WrongBook ECharts 环形图（科目分布）+ 横向柱状图 + 进度条 TOP5 薄弱点 |
| **成就徽章系统** | **21个成就，Duolingo 风格** | ✅ **新增** | `achievements.js` 路由 + `Achievements.vue` 页面 + 21个预设成就（学习/答题/正确率/复习/综合五类）+ 进度条 + XP奖励 + 解锁动画 |
| **XP积分系统** | **等级+经验值+进度条** | ✅ **新增** | user_stats.xp_points 字段 + 练习+3XP/答对+3XP/答题+1XP + 学习+5XP + 成就解锁XP奖励 + `/api/achievements/award` 自动检查解锁 + 等级公式 log2(xp/100+1)+1 |
| **Match Mode 配对游戏** | **Quizlet 风格左右配对** | ✅ **新增** | `MatchMode.vue` 页面 + 词库选择 + 左右洗牌排列 + 点击配对 + 计时器 + 错误统计 + 完成弹窗 + 奖励XP |
| 管理后台 | 数据看板 + 用户/题目管理 | 🟡 基础可用 | 统计 + CRUD |

### 2.2 数据状态

| 科目 | 题目数 | 音频 | 长篇章 | 备注 |
|------|--------|------|--------|------|
| 阅读 | **684** | N/A | **17篇** | 科学/历史/艺术/生物/社会学/地质学/心理学/经济学/天文学/神经科学/**人类学/环境科学/数学史/考古学/认知心理学/生态学** |
| 听力 | **55** | TTS | N/A | **lecture × 18 + conversation × 15 + detail × 9 + inference × 4 + negative × 4 + purpose × 5**（Round 11 新增 +27） |
| 口语 | **86** | N/A | N/A | 独立+综合（扩充v3：+18题） |
| 写作 | **83** | N/A | N/A | 独立+综合（扩充v3：+33题） |
| **总计** | **908** | | | |

#### 阅读长篇章清单（17篇）

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
| anthro-anthropology-001 | The Development of Early Agriculture and Its Social Consequences | hard | 6 |
| envsci-environmental-001 | Ocean Pollution and the Great Pacific Garbage Patch | hard | 6 |
| math-history-001 | The History of Zero: From Nothing to Everything | hard | 6 |
| **arch-archaeology-001** | **The Mystery of the Ancestral Puebloans' Departure from Mesa Verde** | **hard** | **6** |
| **psy-cognitive-001** | **Cognitive Dissonance and the Psychology of Belief** | **hard** | **6** |
| **astro-blackhole-001** | **Understanding Black Holes and Their Detection** | **hard** | **6** |
| **eco-ecosystem-001** | **Ecosystem Services and the Value of Biodiversity** | **hard** | **6** |

---

## 三、v9.0 → v10.0 迭代完成项 ✅

### 方向一：🎯 题库持续扩充（P1）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 1.6 | 阅读考古学篇章 | P1 | ✅ **新增 1 篇阅读长篇章**：<br>• **The Mystery of the Ancestral Puebloans' Departure from Mesa Verde** — 古普韦布洛人从梅萨维德遗址离开的神秘原因，涵盖气候干旱/资源短缺/社会动荡等多重假设<br>• 新增配套6道选择题 + 1条passage记录<br>• 数据库验证：reading 从 651 → **664**（13篇 → **14篇**） |
| 1.7 | 口语/写作题库补充 | P1 | ✅ **口语扩充v3**：新增18题（综合口语6题+独立口语12题），speaking 53 → **86**<br>✅ **写作扩充v3**：新增33题（综合写作15题+独立写作18题），writing 50 → **83**<br>• 修复种子脚本中 `time_limit` 列（不存在）和 integrated 题目缺少 answer 的问题<br>• 最终验证：总题数 782 → **861**（+79题） |

### 方向二：🤖 AI能力深化（P2）

| # | 需求 | 优先级 | 完成详情 |
|---|------|--------|----------|
| 2.7 | 智能题目推荐 | P2 | ✅ **前后端完整实现**：<br>**后端 API**：`GET /api/questions/recommend?limit=10`（内嵌于 `questions.js`），核心逻辑：<br>• 分析用户错题 → 找出薄弱科目/题型<br>• 使用子查询回退方案防 IN 列表过大<br>• `balanceDifficulty()` 按 60% medium / 20% easy / 20% hard 平衡难度<br>• `getRecommendationReason()` 生成推荐理由<br>**前端**：Dashboard 新增"智能推荐"卡片区域，含刷新按钮、推荐理由、题目列表，点击跳转至对应练习 |
| 2.8 | 错题自动归因 | P2 | ✅ **前后端完整实现**：<br>**后端 API**：`GET /api/analysis/attribution`（新建 `analysis.js` 路由模块），核心函数：<br>• `autoAttribute(question)` — 基于题目内容/analysis/title 的关键词匹配（vocabulary/grammar/logic/knowledge/carelessness），按题型推断（detail→knowledge, inference→logic）<br>• `getCategorySuggestion(category)` — 按归因类别返回学习建议<br>• `getAttributionExplanation(category)` — 归因原因说明<br>**前端**：WrongBook 页面新增"🧠 归因分析"按钮 + 弹窗对话框，展示：<br>• 总览统计（错题总数/平均错误次数/高频错题数）<br>• 主要原因排行（条形进度条 + 百分比）<br>• 高频错题列表（多次出错的题目）<br>• 针对性建议网格（按归因类别）<br>• 每道题归因明细表格（科目/题目/归因类别/原因/错误次数） |

---

## 四、v11.0 → 下一轮待完成事项 & 优先级

### 方向一：🎯 题库持续扩充（P1）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| ~~1.8~~ | ~~听力内容扩充~~ | ~~P1~~ | ✅ **已完成**：Round 11 新增 lecture × 3 + conversation × 2，listening 28→**55** | ✅ |
| ~~1.9~~ | ~~阅读科普类篇章~~ | ~~P1~~ | ✅ **已完成**：Round 11 新增 3 篇（心理学/天文学/生态学），reading 664→**684** | ✅ |

### 方向二：🤖 AI能力深化（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| ~~2.9~~ | ~~写作AI辅助构思~~ | ~~P2~~ | ✅ **已完成**：Round 12 新增 `POST /api/practice/brainstorm` API + WritingDetail 构思面板 | ✅ |
| ~~2.10~~ | ~~口语AI模拟对话~~ | ~~P2~~ | ✅ **已完成**：Round 13 新增 `POST /api/ai-conversation/*` API 套件 + SpeakingDetail 对话面板（多轮对话/实时评分/追问） | ✅ |
| 2.11 | 错题智能复习推送 | P2 | ✅ **已完成**：Round 14 新增 `POST /api/review/push` + `/api/review/complete` API + WrongBook 智能推送面板（薄弱类别TOP3/推荐题目清单/分类建议/AI导师建议） | ✅ |
| 2.12 | PWA离线缓存优化 | P2 | ✅ **已完成**：Round 15 增强 SW（多策略缓存：静态cache-first/API网络优先/错题IndexedDB）、`offline.html` 离线页、`useOnlineStatus` 在线状态指示器、API 拦截器自动缓存错题/练习/篇章数据 | ✅ |

### 方向三：📱 前端体验升级（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| ~~3.2~~ | ~~PWA离线缓存优化~~ | ~~P2~~ | ✅ **已完成**：Round 15 增强 SW（多策略缓存：静态cache-first/API网络优先/IndexedDB）、`offline.html` 离线页、`useOnlineStatus` 在线状态指示器、API 拦截器自动缓存 | ✅ |
| ~~3.3~~ | ~~多语言支持~~ | ~~P2~~ | ✅ **已完成**：Round 16 vue-i18n 集成、中英文双语（zh-CN/en）、App.vue 语言切换下拉、offline.html 双语 | ✅ |
| ~~3.4~~ | ~~错题本移动端适配~~ | ~~P2~~ | ✅ **已完成**：Round 17 响应式布局（桌面 el-table → 移动端卡片列表）、弹窗响应式宽度、安全区域适配、触摸反馈 | ✅ |

### 方向四：🔧 工程化与运维（P2）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| ~~4.1~~ | ~~CI/CD 自动化~~ | ~~P2~~ | ✅ **已完成**：Round 18 `.github/workflows/ci.yml`（前端构建/后端检查/DB schema 验证）、`.github/workflows/deploy.yml`（Docker 部署 + SSH 发布）、`.github/workflows/backup.yml`（定时备份）+ `scripts/backup-db.ps1`（Docker/直连双模式） | ✅ |
| ~~4.2~~ | ~~自动化测试~~ | ~~P2~~ | ✅ **已完成**：Round 19 Vitest 单元测试（51 测试点）、Playwright E2E 测试框架、CI 流水线集成前端测试 job | ✅ |
| ~~4.3~~ | ~~数据库备份~~ | ~~P2~~ | ✅ **已完成**：Round 18 `scripts/backup-db.ps1`（Docker/直连双模式）+ GitHub Actions 定时备份 | ✅ |

---

## 五、Round 10 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 阅读考古学篇章（Mesa Verde） | `seed-reading-archaeology.js` 数据文件 + 种子脚本 + 数据库验证 reading 651→664 | ✅ |
| 2 | 口语题库扩充v3（+18题） | `seed-speaking-v3.js` + 数据库验证 speaking 53→**86**（修复 time_limit 列问题） | ✅ |
| 3 | 写作题库扩充v3（+33题） | `seed-writing-v3.js`（修复 integrated 题目 answer 缺失问题） + 数据库验证 writing 50→**83** | ✅ |
| 4 | 智能题目推荐功能 | 后端 `GET /api/questions/recommend` 端点 + 前端 Dashboard 推荐卡片 + 难度平衡算法 | ✅ |
| 5 | 错题自动归因功能 | 后端 `GET /api/analysis/attribution` 端点（analysis.js） + 前端 WrongBook 归因弹窗 | ✅ |
| 6 | 前端构建验证 | `cd web && npx vite build` — 构建成功，2296 modules, 4.95s | ✅ |
| 7 | 数据库最终验证 | reading=**664**(14篇), listening=**28**, speaking=**86**, writing=**83**, 总=**861** | ✅ |

## 五、Round 11 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 听力内容扩充（+27题） | `seed-listening-round11.js` + 数据文件（lecture × 3 + conversation × 2，含详细 passage_text）+ 数据库验证 listening 28→**55** | ✅ |
| 2 | 阅读科普类篇章（+3篇/18题） | `seed-reading-round11.js` + 数据文件（心理学-认知失调/天文学-黑洞/生态学-生态系统服务）+ 数据库验证 reading 664→**684**（14篇→**17篇**） | ✅ |
| 3 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.07s | ✅ |
| 4 | 数据库最终验证 | reading=**684**(17篇), listening=**55**, speaking=**86**, writing=**83**, 总=**908** | ✅ |

## 五、Round 12 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 写作AI辅助构思 | `POST /api/practice/brainstorm` API（ai-scoring.js）+ WritingDetail 构思面板（论点生成/分论据/范文参考/词汇推荐） | ✅ |
| 2 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.13s | ✅ |

## 五、Round 13 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 口语AI模拟对话 | `server/src/routes/ai-conversation.js`（start/respond/finish 三端点）+ `app.js` 注册 `/api/ai-conversation` + SpeakingDetail 对话面板（多轮聊天UI/实时评分/追问/最终总结） | ✅ |
| 2 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.21s | ✅ |

## 五、Round 14 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 错题智能复习推送 API | `server/src/routes/review.js`（push/complete 端点）— 归因分析→薄弱类别TOP3→推荐题目→AI导师建议 | ✅ |
| 2 | 错题本智能推送面板 | WrongBook.vue 新增 💡 智能复习推送（薄弱类别分布/推荐题目清单/分类建议/AI导师建议） | ✅ |
| 3 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.07s | ✅ |

## 五、Round 15 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 增强 Service Worker | `sw.js` v2 — 多策略缓存（静态cache-first+stale-while-revalidate/API网络优先+IndexedDB降级/页面网络优先+cache fallback） | ✅ |
| 2 | 离线页面 | `offline.html` — 离线状态提示 + 已缓存数据数量显示 | ✅ |
| 3 | IndexedDB 离线数据层 | `src/utils/offline-db.js` — 错题/练习/篇章/同步队列 4 个 ObjectStore | ✅ |
| 4 | 在线状态指示器 | `src/composables/useOnlineStatus.js` — 网络状态检测 + 连接类型识别 + 联网恢复自动同步 | ✅ |
| 5 | App.vue 离线横幅 | 顶部离线提示横幅 + 弱网标识 | ✅ |
| 6 | API 拦截器自动缓存 | `api/index.js` 响应拦截器 — 自动缓存错题/练习/篇章数据到 IndexedDB | ✅ |
| 7 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.41s | ✅ |

---

## 六、架构变更（v11.0 新增）

### 6.1 新增后端文件（Round 11）

| 文件 | 用途 |
|------|------|
| `server/src/data/listening-round11-data.js` | 听力扩充v4数据（lecture × 3 + conversation × 2，含 passage_text） |
| `server/scripts/seed-listening-round11.js` | 听力扩充种子脚本 |
| `server/src/data/reading-round11-data.js` | 阅读扩充数据（心理学认知失调/天文学黑洞/生态学生态系统） |
| `server/scripts/seed-reading-round11.js` | 阅读扩充种子脚本 |

## 七、架构变更（v10.0 变更）

### 6.1 新增后端文件

| 文件 | 用途 |
|------|------|
| `server/src/routes/analysis.js` | 错题自动归因 API（/attribution 端点 + autoAttribute/getCategorySuggestion/getAttributionExplanation） |
| `server/src/data/seed-reading-archaeology.js` | 考古学阅读种子脚本（1篇×6题） |
| `server/src/data/seed-reading-archaeology-default.js` | 考古学阅读数据（Mesa Verde） |

## 八、架构变更（v14.0/v15.0 新增）

### 7.1 新增后端文件（Round 14）

| 文件 | 用途 |
|------|------|
| `server/src/routes/review.js` | 错题智能复习推送 API（/push /complete 端点） |

### 7.2 新增前端文件（Round 14/15）

| 文件 | 用途 |
|------|------|
| `src/utils/offline-db.js` | IndexedDB 离线数据层（错题/练习/篇章/同步队列） |
| `src/composables/useOnlineStatus.js` | 在线状态 composable（网络检测/连接类型/自动同步） |
| `public/offline.html` | 离线状态提示页面 |

### 7.3 新增前端文件（Round 16/17）

| 文件 | 用途 |
|------|------|
| `src/i18n.js` | vue-i18n 配置（自动语言检测 + localStorage 持久化） |
| `src/locales/zh-CN.js` | 简体中文语言包（700+ key） |
| `src/locales/en.js` | 英文语言包（完整对照） |
| `src/views/WrongBook.vue` | 错题本移动端适配（响应式卡片列表 + 弹窗响应式宽度） |

### 7.4 新增 CI/CD 文件（Round 18）

| 文件 | 用途 |
|------|------|
| `.github/workflows/ci.yml` | GitHub Actions CI 流水线（前端构建+后端检查+DB schema 验证） |
| `.github/workflows/deploy.yml` | GitHub Actions 部署流水线（SSH 部署 + Docker） |
| `.github/workflows/backup.yml` | GitHub Actions 定时数据库备份（cron + 手动触发） |
| `scripts/backup-db.ps1` | 本地 PowerShell 备份脚本（Docker/直连双模式） |
| `scripts/backup-db.sh` | 本地 Bash 备份脚本（直连 PostgreSQL） |

### 7.5 新增测试文件（Round 19）

| 文件 | 用途 |
|------|------|
| `tests/setup.js` | Vitest 全局测试配置（localStorage mock + navigator mock） |
| `tests/fsrs.test.js` | FSRS 算法单元测试（22 测试点） |
| `tests/language.test.js` | 语言检测 i18n 单元测试（8 测试点） |
| `tests/recommendations.test.js` | 推荐算法单元测试（21 测试点） |
| `tests/e2e/app.spec.js` | Playwright E2E 测试（骨架） |
| `vitest.config.js` | Vitest 配置（jsdom 环境 + 覆盖率） |
| `playwright.config.js` | Playwright 配置（Chromium + Vite webServer） |

### 7.6 新增工具文件（Round 19）

| 文件 | 用途 |
|------|------|
| `src/utils/fsrs.js` | FSRS 间隔重复算法实现 |
| `src/utils/language.js` | 语言检测工具函数 |
| `src/utils/recommendations.js` | 智能题目推荐算法 |
| `server/src/data/seed-speaking-v3.js` | 口语扩充v3种子脚本（+18题） |
| `server/src/data/seed-speaking-v3-default.js` | 口语扩充v3数据 |
| `server/src/data/seed-writing-v3.js` | 写作扩充v3种子脚本（+33题） |
| `server/src/data/seed-writing-v3-default.js` | 写作扩充v3数据 |

### 6.2 修改后端文件

| 文件 | 变更内容 |
|------|----------|
| `server/src/routes/questions.js` | 内嵌 `/api/questions/recommend` 端点（getUnseenQuestions + balanceDifficulty + getRecommendationReason） |
| `server/src/routes/recommend.js` | 已删除（功能内嵌至 questions.js） |

### 6.3 修改前端文件

| 文件 | 变更内容 |
|------|----------|
| `web/src/api/index.js` | 新增 `wrongAPI.attribution()` / `questionAPI.recommend(limit)` |
| `web/src/views/Dashboard.vue` | 新增"智能推荐"卡片区域（刷新按钮、推荐理由、题目列表）+ loadRecommendations()/goToQuestion() |
| `web/src/views/WrongBook.vue` | 新增"🧠 归因分析"按钮 + 弹窗对话框（总览/排行/高频错题/建议网格/明细表格）+ 归因分析样式 |

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

### wrong_questions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| user_id | INT | 用户ID |
| question_id | INT | 题目ID |
| wrong_count | INT | 错误次数 |
| last_wrong_at | TIMESTAMP | 最后错误时间 |
| created_at | TIMESTAMP | 创建时间 |

---

## 八、技术约束与约定

### 8.1 阅读题库存储

- 阅读文章和题目均存 `questions` 表
- 通过 `type='passage'` + `passage_id` 分组
- 每篇阅读包含 1 条 passage 记录 + N 道题目记录
- **新增篇章必须包含 passage 行（type='passage', question_order=0）**
- `answer` 列有 NOT NULL 约束，passage 行填 `'-'`

### 8.2 智能推荐算法

- `getUnseenQuestions()` — 使用子查询 UNION wrong_questions + practice_logs 防 IN 列表过大
- `balanceDifficulty(questions, limit)` — 按 60% medium / 20% easy / 20% hard 分配
- `getRecommendationReason(weakPoints, questions)` — 基于薄弱知识点生成推荐理由

### 8.3 错题归因算法

- **关键词匹配**：vocabulary（词汇/单词/含义）、grammar（语法/结构/搭配）、logic（推理/推断/逻辑）、knowledge（背景/事实/定义）、carelessness（粗心/看错）
- **题型推断**：detail→knowledge, inference→logic
- **难度递增**：按 error_rate 排序，取 top N

### 8.4 种子脚本模式

- `default-*.js` 数据文件 + `seed-*.js` 执行脚本
- 使用 `ON CONFLICT DO NOTHING` 保证幂等
- 数据迁移后必须运行数据库验证脚本
- 修复经验：`time_limit` 列不存在需移除；综合写作 integrated 题目需设默认 answer

### 8.5 前端构建

- 前端构建产物位于 `dist/` 目录
- 构建命令：`cd web && npx vite build`
- 构建验证：检查 dist/ 是否存在 + 无错误输出
- 本次构建耗时：4.95s（2296 modules）

---

## 八、PRD 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0-v3.0 | 早期 | 基础刷题 + 错题本 + FSRS |
| v4.0 | 早期 | PDF 导入 + AI 解析 |
| v5.0 | 早期 | 口语练习 + 写作精批 |
| v6.0 | 早期 | 生词本 + 学习仪表盘 |
| v7.0 | 2026-01 | PWA + 移动端TabBar + 口语陪练波形可视化 + 题库扩充(speaking 44→53, writing 32→50) |
| v8.0 | 2026-01 | 阅读扩充至10篇 + WrongBook ECharts + 长难句深度解析 + 个性化学习计划 |
| v9.0 | 2026-01 | 阅读扩充至13篇(人类学/环境科学/数学史) + 听力扩充至28(考古讲座+选题对话) + 深色模式 |
| **v10.0** | **2026-01** | **阅读扩充至14篇(考古学) + 口语扩充至86 + 写作扩充至83 + 智能题目推荐(P2) + 错题自动归因(P2)** |
| **v11.0** | **2026-01** | **题库 Round 11：听力 +27（lecture×3 + conversation×2），listening 28→55；阅读 +3篇（认知失调/黑洞检测/生态系统服务），reading 664→684（17篇）** |
| **v12.0** | **2026-01** | **AI 构思助手：POST /api/practice/brainstorm API + WritingDetail 构思面板（论点生成/分论据/范文参考/词汇推荐）** |
| **v13.0** | **2026-01** | **AI 模拟对话：server/src/routes/ai-conversation.js（start/respond/finish 三端点）+ SpeakingDetail 对话面板（多轮聊天/实时评分/追问/最终总结）** |
| **v14.0** | **2026-01** | **错题智能复习推送：POST /api/review/push + /api/review/complete API + WrongBook 智能推送面板（薄弱类别TOP3/推荐题目清单/分类建议/AI导师建议）** |
| **v15.0** | **2026-01** | **PWA离线缓存优化：增强 SW（cache-first/网络优先/IndexedDB）、offline.html 离线页、useOnlineStatus 在线状态指示器、API 拦截器自动缓存错题/练习/篇章数据** |
| **v16.0** | **2026-01** | **多语言支持（i18n）：vue-i18n 集成、中英文双语（zh-CN/en）、App.vue 语言切换下拉、offline.html 双语、main.js i18n 注册** |
| **v17.0** | **2026-01** | **错题本移动端适配：WrongBook 响应式布局（桌面 el-table → 移动端卡片列表）、弹窗响应式宽度（95vw/mobile）、安全区域适配（safe-area-inset）、触摸反馈（active 缩放）、TabBar 间距优化** |
| **v18.0** | **2026-01** | **CI/CD 自动化：GitHub Actions（ci.yml 前端构建+后端检查+DB schema / deploy.yml Docker 部署 / backup.yml 定时备份）+ scripts/backup-db.ps1（Docker/直连双模式备份）** |
| **v19.0** | **2026-01** | **自动化测试：Vitest 单元测试框架（51 测试点覆盖 FSRS 算法/i18n/推荐算法）+ Playwright E2E 测试框架 + CI 集成测试 job** |
| **v20.0** | **2026-01** | **AI 写作润色：逐句优化 + 词汇升级 + 结构建议 + 一键应用全文** |
| **v21.0** | **2026-01** | **竞品功能整合：①每日打卡 Streak + 🔥连续天数（Dashboard 7天日历）②FSRS 记忆强度可视化（生词本 ●●●/●○○ 指示器）③口语 6 维度评分（发音/流利度/语调/语法/词汇/任务完成）④错题 ECharts 饼图 + TOP5 薄弱点** |
| **v22.0** | **2026-01** | **游戏化系统：①成就徽章系统（21个成就，Duolingo 风格，分级解锁+进度条+XP奖励）②XP积分系统（答题/学习/复习获得XP，等级公式：log2(xp/100+1)+1，进度条可视化）③Quizlet Match Mode 配对游戏（左右拖拽配对，计时+错误统计，完成奖励XP）** |

## 五、Round 16-17 完成清单

### Round 16 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 安装 vue-i18n | `npm install vue-i18n@9 @intlify/unplugin-vue-i18n@5` | ✅ |
| 2 | 中英文语言包 | `src/locales/zh-CN.js`（700+ key）+ `src/locales/en.js`（完整对照） | ✅ |
| 3 | i18n 配置 | `src/i18n.js` — 自动检测浏览器语言，localStorage 持久化 | ✅ |
| 4 | main.js 注册 i18n | `app.use(i18n)` 全局注册 | ✅ |
| 5 | App.vue 语言切换 | 侧边栏语言选择下拉 + `changeLang()` 方法 + localStorage 持久化 | ✅ |
| 6 | 导航国际化 | navItems computed 使用 `t()` + 移动端 TabBar 国际化 | ✅ |
| 7 | 离线页面双语 | `public/offline.html` — JS 自动检测语言，中英双语显示 | ✅ |
| 8 | 前端构建验证 | `cd web && npx vite build` — 构建成功，5.37s | ✅ |
| **v16.0** | **2026-01** | **多语言支持（i18n）：vue-i18n 集成、中英文双语（zh-CN/en）、App.vue 语言切换、offline.html 双语、路由 meta 国际化** |

### Round 17 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | WrongBook 桌面端表格保留 | el-table（宽度 ≥768px） | ✅ |
| 2 | 移动端卡片列表 | wrong-card 组件（subject tag + 题目摘要 + 掌握度进度条） | ✅ |
| 3 | 响应式布局 | @media 768px breakpoint，统计卡片 flex-wrap，安全区域适配 | ✅ |
| 4 | 弹窗响应式宽度 | dialogWidth(desktop) → 95vw on mobile | ✅ |
| 5 | 弹窗移动端优化 | :deep() 覆盖 el-dialog/body/header/footer padding | ✅ |
| 6 | 归因分析弹窗适配 | 全宽网格、紧凑 bar 高度、卡片列表 | ✅ |
| 7 | 智能复习推送弹窗适配 | 全宽建议网格、移动端紧凑布局 | ✅ |
| 8 | 触摸反馈 | .wrong-card:active transform scale(0.98) | ✅ |
| 9 | 前端构建验证 | `npx vite build` — 5.35s 构建成功，WrongBook bundle 15.24 kB | ✅ |
| **v17.0** | **2026-01** | **错题本移动端适配：响应式布局 + 卡片列表 + 弹窗响应式 + 触摸反馈** |

### Round 18 完成清单

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | GitHub Actions CI 流水线 | `.github/workflows/ci.yml`（前端构建+后端检查+DB schema 验证+综合状态） | ✅ |
| 2 | GitHub Actions 部署流水线 | `.github/workflows/deploy.yml`（前端构建+后端打包+SSH 部署+健康检查） | ✅ |
| 3 | GitHub Actions 定时备份 | `.github/workflows/backup.yml`（cron 每日 02:00 UTC + 手动触发） | ✅ |
| 4 | 本地备份脚本（Docker） | `scripts/backup-db.ps1` — Docker 容器备份（Custom + SQL 双格式 + 轮转清理） | ✅ |
| 5 | 本地备份脚本（直连） | `scripts/backup-db.sh` — Bash 直连 PostgreSQL 备份 | ✅ |
| 6 | .gitignore 完善 | 排除 node_modules/.env/dist/logs/IDE 配置 | ✅ |
| **v18.0** | **2026-01** | **CI/CD 自动化：GitHub Actions 流水线 + Docker/直连双模式备份 + 完善 .gitignore** |

### Round 19 完成清单 — 自动化测试

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | Vitest 安装配置 | `vitest.config.js` + `tests/setup.js` + `package.json` 测试脚本 | ✅ |
| 2 | FSRS 单元测试 | `tests/fsrs.test.js` — 22 测试点（难度/稳定性/间隔/调度/可提取性） | ✅ |
| 3 | i18n 单元测试 | `tests/language.test.js` — 8 测试点（浏览器检测/持久化/优先級） | ✅ |
| 4 | 推荐算法测试 | `tests/recommendations.test.js` — 21 测试点（难度平衡/掌握度/复习时间） | ✅ |
| 5 | Playwright E2E 配置 | `playwright.config.js` + `tests/e2e/app.spec.js` | ✅ |
| 6 | CI 集成测试 | `ci.yml` 新增 `frontend-test` job + 测试结果 artifact | ✅ |
| 7 | 前端构建验证 | `npx vite build` — 5.37s 构建成功，所有 bundle 正常 | ✅ |
| **v19.0** | **2026-01** | **自动化测试：Vitest 51 测试点 + Playwright E2E + CI 集成** |

---

## 六、Round 20 完成清单 — AI 写作润色（5.1）

| # | 任务 | 产出 | 状态 |
|---|------|------|------|
| 1 | 润色服务函数 | `server/src/services/ai-scoring.js` 新增 `polishEssay()` — 逐句润色/词汇升级/结构建议/全文重写 | ✅ |
| 2 | 润色 API 端点 | `POST /api/practice/polish`（practice.js）— 接收题目+作文，返回逐句润色结果 | ✅ |
| 3 | 润色前端按钮 | WritingDetail.vue 新增 ✍️ AI 润色按钮 + 📋 应用润色全文 | ✅ |
| 4 | 润色结果展示 | polish-result 组件：评分环 + 维度进度条 + 优点/弱点 + 逐句对比卡片 + 词汇升级 + 结构建议 | ✅ |
| 5 | 润色样式 | CSS 渐变评分环 + 句子对比卡片 + 词汇升级标签 + 响应式布局 | ✅ |
| 6 | API 集成 | `src/api/index.js` 新增 `polish()` 方法 | ✅ |
| 7 | 构建验证 | `npx vite build` — 5.27s 构建成功，WritingDetail bundle 16.86 kB | ✅ |
| 8 | 测试验证 | Vitest 51/51 测试通过 | ✅ |
| **v20.0** | **2026-01** | **AI 写作润色：逐句优化 + 词汇升级 + 结构建议 + 一键应用** |

---

## 六、v22.0 迭代完成项 ✅（游戏化系统）

### Round 22：游戏化系统（Duolingo + Quizlet 风格）

| # | 需求 | 竞品参考 | 完成详情 |
|---|------|----------|----------|
| 22.1 | **成就徽章系统** | Duolingo | ✅ **前后端完整实现**：<br>**后端**：`achievements.js` 路由（3个端点：`POST /award` 检查并颁发成就、`GET /list` 获取列表+解锁状态、`GET /stats` 获取统计）+ 21个预设成就（学习/答题/正确率/复习/综合五类）+ `achievements` 表 + `user_achievements` 解锁记录表<br>**前端**：`Achievements.vue` 页面（XP 头部 + 等级进度条 + 分类筛选 + 成就卡片网格 + 进度条 + 解锁时间）+ 侧边栏/TabBar 入口<br>**数据**：16+ 成就定义（streak_3/7/30/100, questions_50/200/500/1000, accuracy_70/80/90, 科目首练, vocab_review_first, wrong_review_50, xp_500/2000/5000） |
| 22.2 | **XP积分系统** | Duolingo | ✅ **前后端完整实现**：<br>**后端**：`user_stats.xp_points` 字段 + 练习+1XP/答对+3XP + 学习+5XP + 成就解锁XP奖励 + 等级公式 `log2(xp/100+1)+1`<br>**前端**：Achievements 页面 XP 头部（头像+等级徽章+进度条）+ `/api/user/profile` 返回 xpPoints + level<br>**数据来源**：practice.js 提交练习时更新 XP，user.js update-study 更新 XP |
| 22.3 | **Match Mode 配对游戏** | Quizlet | ✅ **前后端完整实现**：<br>**前端**：`MatchMode.vue` 页面（词库选择 + 左右洗牌排列 + 点击配对 + 计时器 + 错误统计 + 完成弹窗 + 奖励XP）<br>**后端**：`/api/vocab/sets` 端点（获取用户词库列表）+ 从 vocabulary 表随机取词<br>**交互**：左侧单词 → 点击选中 → 右侧释义 → 点击匹配 → 正确消除/错误抖动动画<br>**奖励**：完成配对获得 XP（基础50XP - 用时 - 错误*2，最低10XP） |

---

## 七、v21.0 下一步方向（方向五进行中）

> 📋 **当前状态**：Round 11-20 已完成。方向五（AI 能力深化）5.1 已完成。
>
> 以下继续方向五剩余需求 + 其他方向建议。

### 方向五：🤖 AI 能力持续深化（P1）

| # | 需求 | 优先级 | 说明 | 状态 |
|---|------|--------|------|------|
| ~~5.1~~ | ~~AI 写作润色~~ | ~~P1~~ | ✅ **已完成**：Round 20 `polishEssay()` API + WritingDetail 润色面板（逐句对比/词汇升级/结构建议） | ✅ |
| 5.2 | AI 口语实时反馈 | P1 | SpeakingPractice 增加实时语音识别反馈（语音→文字→评分） | ⬜ 待开发 |
| 5.3 | AI 自适应学习路径 | P1 | 基于 FSRS + 错题分析，动态生成每日学习计划 | ⬜ 待开发 |
| 5.4 | AI 模考模拟 | P1 | 完整托福模考（阅读+听力+口语+写作），AI 综合评分 | ⬜ 待开发 |

### 方向六：📊 学习数据分析（P2）

| # | 需求 | 优先级 | 说明 |
|---|------|--------|------|
| 6.1 | 学习报告周报 | P2 | 每周自动生成学习报告（刷题量/掌握度变化/薄弱项趋势） |
| 6.2 | 目标追踪与预测 | P2 | 基于当前表现预测 TOEFL 总分，追踪目标进度 |
| 6.3 | 错题热力图 | P2 | 按知识点/难度/日期多维度的错题可视化 |
| 6.4 | ~~学习 streak 徽章~~ | P2 | ~~✅ **已完成**：Round 21 🔥Streak + Round 22 成就徽章系统~~ | ~~✅~~ |

### 方向七：🌐 多端扩展（P2）

| # | 需求 | 优先级 | 说明 |
|---|------|--------|------|
| 7.1 | 小程序刷题 | P2 | 微信小程序端，支持阅读/听力刷题 + FSRS 复习 |
| 7.2 | 移动端原生 App | P2 | React Native/Flutter 原生 App |
| 7.3 | 离线刷题 | P2 | 题目数据本地缓存，支持完全离线使用 |

### 方向八：🎮 游戏化互动（P3）

| # | 需求 | 优先级 | 说明 |
|---|------|--------|------|
| 8.1 | 学习排行榜 | P3 | 用户间学习量排名 |
| 8.2 | 随机 PK 模式 | P3 | 双人实时刷题 PK |
| 8.3 | 每日挑战 | P3 | 每日指定题目挑战，完成得积分 |
