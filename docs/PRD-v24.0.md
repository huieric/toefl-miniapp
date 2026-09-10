# 托福备考助手 — PRD v24.0

> 版本: v23.0 → **v24.0** | 日期: 2026-01 | 状态: 学习分析 + 游戏化闯关 + 卡片交互增强 + 专注计时 + 技能掌握 + 连续保护

---

## 一、项目概述

**托福备考助手**是一款面向托福考生的智能刷题工具。核心模式：用户导入PDF → AI解析题目 → 在线刷题 → 错题自动入库 → FSRS 科学排程复习。

### 1.1 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端（Web） | Vue 3 + Vite + Element Plus | 响应式，PWA 支持，**深色模式** |
| 管理后台 | Vue 3 + ECharts + Element Plus | 数据看板 + 用户/题目管理 |
| 后端 | Node.js + Express + JWT | **24+ 路由模块**，RESTful API |
| 数据库 | PostgreSQL (端口5433) | **18+张表**，FSRS 17个参数 |
| AI能力 | DeepSeek/OpenAI兼容 | PDF解析、口语写作打分、阅读标注、错题分析 |
| 图表 | ECharts 5.6.0 | 错题本AI分析可视化 + 周报图表 + **技能雷达图** |
| 部署 | Vite build + 后端 dev | 前端已构建 dist/ 产物 |

---

## 二、当前完成状态（截至 v24.0）

### 2.1 已完成功能

| 模块 | 功能 | 状态 | 详情 |
|------|------|------|------|
| 认证 | 手机号 + 验证码登录 | ✅ 完成 | JWT认证 + 用户管理 |
| 题目导入 | PDF上传 → AI解析 → 自动入库 | ✅ 核心完成 | `pdf-parser.js` v5, 支持批量 |
| 阅读练习 | 篇章列表 → 做题 → 结果 + 解析 | ✅ 完成 | **664条阅读数据（17篇长篇章）** |
| **阅读AI标注** | **生词标注 + 长难句深度解析** | ✅ **完成** | 调用AI自动标注，前端展示 grammarType/mainClause/clauses/keyPoints |
| **听力练习** | **音频播放 + 题目练习** | ✅ **完成** | **55条听力** + TTS生成音频 |
| **听力TTS** | **文本转音频服务** | ✅ **完成** | Windows SAPI TTS，讲座女声(Zira)/对话男声(David)，WAV格式 |
| 错题本 | 答错收录 + FSRS 排程 | ✅ 完成 | 卡片式重做 + 四档评分 + 3D翻转效果 |
| **错题AI分析** | **薄弱点报告 + 可视化图表** | ✅ **完成** | **ECharts 图表**（横向柱状图显示各科薄弱度 + 环形图显示题型分布）+ 前端对话框 |
| **错题自动归因** | **AI归因分析 + 可视化** | ✅ **新增** | 后端 `/api/analysis/attribution` 端点 + 前端 WrongBook 弹窗展示主要原因分布、高频错题、针对性建议、每道题归因明细 |
| 生词本 | 自动提取 + FSRS 复习 | ✅ 增强 | 词汇列表 + **翻转卡片复习 + 翻页滑动模式** |
| 学习仪表盘 | 统计卡片 + 四科进度环 | ✅ 可用 | 数据可视化 |
| **智能题目推荐** | **基于薄弱知识点推荐练习** | ✅ **新增** | 后端 `/api/questions/recommend` 端点 + 前端 Dashboard 推荐卡片，支持60/20/20难度平衡 |
| **口语练习** | **题库 + AI打分** | ✅ **完成** | **86条口语题**（独立+综合） + `/api/ai/grade` 评分 |
| **AI口语陪练** | **结构化对话练习 + 波形可视化** | ✅ **完成** | `SpeakingPractice.vue` + `/api/ai-speak` API + **Canvas波形可视化 + 实时音量指示** |
| **写作精批** | **4维度AI批改 + 逐句点评** | ✅ **完成** | **83条写作题** + 4维度评分(DOS 30分制) + **逐句修改建议** + 亮点列表 + 改进建议 |
| **写作AI辅助构思** | **独立写作AI思路生成** | ✅ **完成** | `POST /api/practice/brainstorm` API + WritingDetail 构思面板 |
| 模拟题生成 | 内置模板 + AI生成 | 🟡 基础可用 | 需优化 |
| **PWA支持** | **manifest + service worker** | ✅ **完成** | 可安装为桌面/移动应用 |
| **移动端TabBar** | **手机底部导航栏** | ✅ **完成** | App.vue 响应式布局 |
| **答题交互优化** | **选项高亮 + 倒计时** | ✅ **完成** | 单选高亮 + 阅读倒计时组件 |
| **连续打卡** | **Streak 连续天数** | ✅ **完成** | 每日打卡 + 7天日历 + 连续天数展示 |
| **成就系统** | **22种成就 + XP 经验值** | ✅ **完成** | Duolingo/Quizizz 风格，自动解锁成就 |
| **配对游戏** | **词汇配对挑战（Match Mode）** | ✅ **完成** | Quizlet 模式，限时内完成所有配对 |
| **学习周报** | **墨墨背单词 周报** | ✅ **完成** | ECharts 可视化：每日学习时长 + 做题统计 + 科目正确率 |
| **每日闯关** | **百词斩 闯关模式** | ✅ **完成** | 8种任务类型 + XP 奖励 + 进度追踪 |
| **单词卡片增强** | **3D翻转 + 触屏滑动** | ✅ **完成** | VocabReviewEnhanced.vue，两种交互模式 |

### 2.2 【v24.0 新增】Round 24 竞品功能

| 模块 | 竞品参考 | 功能 | 实现详情 |
|------|---------|------|---------|
| **专注森林** | **Forest / Pomodoro** | 🌳 **专注计时器** | **7种时长选择 (10-60min)，SVG 环形倒计时，树种升级系统（🌱→✨），XP 奖励，历史统计** |
| **技能掌握** | **Khan Academy** | 📊 **技能雷达图** | **4科×21技能掌握度分析，ECharts 雷达图可视化，6级掌握等级（入门→精通），最强/最弱技能识别** |
| **连续保护** | **Duolingo Streak Freeze** | 🛡️ **Streak Freeze** | **连续打卡保护道具，进度条追踪，手动/自动获取，历史记录追踪** |

---

## 三、v24.0 新增功能详细设计

### 3.1 🌳 专注森林（Forest / Pomodoro）

**竞品来源**：Forest（专注森林）、Pomodoro Timer

**核心功能**：
1. **时长选择**：10/15/20/25/30/45/60 分钟七档可选
2. **SVG 环形倒计时**：实时显示剩余时间，绿→黄→红渐变
3. **树种升级系统**：
   | 等级 | 树种 | 图标 | 所需专注次数 |
   |------|------|------|-------------|
   | 1 | 树苗 | 🌱 | 0 |
   | 2 | 小花 | 🌸 | 5 |
   | 3 | 小树 | 🌳 | 15 |
   | 4 | 桃树 | 🍑 | 30 |
   | 5 | 银杏 | 🌿 | 50 |
   | 6 | 樱花 | 🌺 | 100 |
   | 7 | 神树 | ✨ | 200 |
4. **XP 奖励**：每分钟 1.5 XP
5. **历史追踪**：最近 50 条记录，显示实际/计划时长
6. **放弃机制**：可以提前放弃（不影响连续打卡，但无 XP 奖励）

**数据库**：
- `focus_sessions` 表：user_id, duration, actual_minutes, completed, created_at, finished_at
- `user_stats` 新增字段：focus_minutes, total_focus_sessions

**API**：
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/focus-timer/options` | GET | 获取选项（时长 + 当前树类型） |
| `/api/focus-timer/start` | POST | 开始专注 |
| `/api/focus-timer/:id/complete` | POST | 完成专注 |
| `/api/focus-timer/:id/abort` | POST | 放弃专注 |
| `/api/focus-timer/history` | GET | 历史专注记录 |
| `/api/focus-timer/stats` | GET | 专注统计 |

**前端组件**：`FocusTimer.vue`

### 3.2 📊 技能掌握雷达（Khan Academy）

**竞品来源**：Khan Academy 技能掌握系统

**核心功能**：
1. **四科技能分解**：
   | 科目 | 技能数 | 技能示例 |
   |------|--------|---------|
   | 阅读 | 8 | 主旨题、细节题、推断题、词汇题、指代题、句子简化、文章总结、表格填空 |
   | 听力 | 7 | 主旨听力、细节听力、功能题、推断听力、态度题、组织结构、笔记填空 |
   | 口语 | 4 | 独立口语、阅读口语、听力口语、综合口语 |
   | 写作 | 2 | 独立写作、综合写作 |
2. **掌握度计算**：基于做题记录的正确率
   - `not_started`: 无记录
   - `learning`: < 3 题
   - `beginner`: 40-59%
   - `intermediate`: 60-74%
   - `proficient`: 75-89%
   - `master`: ≥90%
3. **ECharts 雷达图**：可视化各技能掌握度
4. **最强/最弱技能识别**：自动推荐优先提升方向

**API**：
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/skill-mastery` | GET | 获取单科技能掌握度 |
| `/api/skill-mastery/all` | GET | 获取所有科目汇总 |

**前端组件**：`SkillMastery.vue`

### 3.3 🛡️ 连续保护（Duolingo Streak Freeze）

**竞品来源**：Duolingo 连续打卡保护

**核心功能**：
1. **Freeze 数量展示**：用户当前拥有的保护次数
2. **进度追踪**：每连续打卡 3 天获得 1 个 Freeze
3. **使用 Freeze**：在无法学习的日子里使用，保持连续天数不断
4. **获取来源追踪**：每日任务、成就奖励、手动获取
5. **历史记录**：最近 20 条获得/使用记录

**数据库**：
- `streak_freezes` 表：user_id, action (earn/use), source, created_at
- `user_stats` 新增字段：streak_freeze_count

**API**：
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/streak-freeze` | GET | 获取 Freeze 状态 |
| `/api/streak-freeze/use` | POST | 使用一个 Freeze |
| `/api/streak-freeze/earn` | POST | 通过每日任务获得 Freeze |
| `/api/streak-freeze/history` | GET | 使用历史记录 |

**前端组件**：`StreakFreeze.vue`

---

## 四、测试状态

| 类别 | 测试数 | 状态 |
|------|--------|------|
| Server Tests | 27/27 | ✅ 全部通过 |
| Web Tests | 51/51 | ✅ 全部通过 |
| **Total** | **78/78** | **✅ 100% 通过** |

---

## 五、数据库表一览

| 序号 | 表名 | 描述 |
|------|------|------|
| 1 | users | 用户表 |
| 2 | user_stats | 用户统计表（含 focus_minutes, xp_points, streak_freeze_count） |
| 3 | questions | 题库表 |
| 4 | exam_records | 考试成绩表 |
| 5 | practice_records | 练习记录表 |
| 6 | daily_challenges | 每日挑战（JSONB tasks） |
| 7 | achievements | 成就预设表（22种） |
| 8 | user_achievements | 用户成就解锁记录 |
| 9 | wrong_questions | 错题表（含 FSRS 参数） |
| 10 | vocabulary | 生词本表（FSRS 间隔重复） |
| 11 | exam_sets | 考试套题表 |
| 12 | membership_plans | 会员计划表 |
| 13 | user_memberships | 用户会员表 |
| 14 | ads | 广告表 |
| 15 | feedbacks | 反馈表 |
| 16 | study_plans | 学习计划表 |
| 17 | ai_conversations | AI对话表 |
| 18 | focus_sessions | 专注会话表 |
| 19 | streak_freezes | Streak Freeze 记录表 |

---

## 六、已参考的竞品优秀功能

| 竞品 | 功能 | 应用 |
|------|------|------|
| **墨墨背单词** | 学习周报 | 周报 ECharts 可视化 |
| **百词斩** | 每日闯关 | 8种每日任务 + XP |
| **Quizlet** | 配对游戏 + 翻转卡片 | Match Mode + 单词翻转 |
| **Anki** | 间隔重复 + 翻转卡片 | FSRS + 3D翻转 |
| **Duolingo** | XP 系统 + 成就 + Streak Freeze | 成就徽章 + 经验值 + 连续保护 |
| **Forest** | 专注计时 + 种树 | 专注森林 + 树种升级 |
| **Khan Academy** | 技能掌握雷达 | ECharts 雷达图 + 6级掌握度 |
| **Quizizz** | 游戏化反馈 | 成就解锁 + XP 奖励 |

---

## 七、待优化项

- [ ] 专注森林：添加"中途放弃"的惩罚机制（降低树种升级概率）
- [ ] 技能掌握：增加"推荐练习"联动（根据薄弱技能推荐题目）
- [ ] Streak Freeze：添加"自动使用"选项（达到风险阈值自动消耗）
- [ ] 周报：增加"月度趋势"视图
- [ ] 每日闯关：增加"周挑战"模式

---

## 八、Round 24 回归测试结果

| 测试项 | 结果 |
|--------|------|
| 专注森林 API | ✅ 实现完成 |
| 专注森林前端 | ✅ FocusTimer.vue 创建 |
| 技能掌握 API | ✅ 实现完成 |
| 技能掌握前端 | ✅ SkillMastery.vue 创建 |
| Streak Freeze API | ✅ 实现完成 |
| Streak Freeze 前端 | ✅ StreakFreeze.vue 创建 |
| 数据库迁移 | ✅ 新增 2 张表 + 4 个字段 |
| 导航集成 | ✅ Dashboard + App.vue 已更新 |
| Server Tests | ✅ 27/27 通过 |
| Web Tests | ✅ 51/51 通过 |
| **总计** | **✅ 78/78 通过** |
