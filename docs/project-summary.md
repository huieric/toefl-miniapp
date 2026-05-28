# 托福备考助手 - 项目总结

> 版本：v1.0 | 日期：2026-05-28

---

## 一、项目概述

**托福备考助手** 是一款面向托福考生的智能备考平台，覆盖阅读、听力、口语、写作四大科目，集成 AI 题目解析、智能陪练、自适应学习规划与后台数据分析。

**核心目标**：前期通过免费功能吸引用户，建立用户粘性；后期通过付费订阅 + 广告实现商业化。

### 项目信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 托福备考助手（TOEFL Mini-App） |
| GitHub 仓库 | https://github.com/huieric/toefl-miniapp |
| Web 部署地址 | https://huieric.github.io/toefl-miniapp/web/ |
| 后端 API 地址 | https://toefl-api-m1ue.onrender.com |
| 当前版本 | v1.0.0 |
| 开源协议 | MIT |

---

## 二、技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                   用户端入口                        │
├──────────────────┬──────────────────┬──────────────┤
│   微信小程序      │   Web 前端       │  管理后台     │
│  (miniprogram/)  │   (web/)         │  (admin/)    │
│  原生 WXML/WXSS  │   Vue 3 + Vite  │  Vue 3 + ECharts │
└────────┬─────────┴────────┬─────────┴──────┬───────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            ▼
                  ┌──────────────────┐
                  │   Node.js 后端    │
                  │   (server/)       │
                  │   Express + JWT   │
                  └────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         PostgreSQL    Redis       第三方服务
         (主数据库)   (缓存/限流)  (OpenAI/微信)
```

### 2.2 技术栈详情

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| **小程序前端** | 微信小程序原生 (WXML + WXSS + JS) | 原生性能最优，可直接调用微信 API |
| **Web 前端** | Vue 3 + Vite + Element Plus | 响应式设计，适配移动端 |
| **管理后台** | Vue 3 + ECharts + Element Plus | 数据可视化，用户/内容管理 |
| **后端** | Node.js + Express | 生态成熟、异步性能好 |
| **数据库** | PostgreSQL 16 | 关系型 + JSONB 支持，适合题库结构化存储 |
| **缓存** | Redis | 会话管理 + 排行榜 + 限流 |
| **鉴权** | JWT (jsonwebtoken) | 无状态鉴权，支持小程序/Web 多端 |
| **文件存储** | 阿里云 OSS / 腾讯云 COS（预留） | PDF 文件 + 音频文件存储 |
| **AI 服务** | OpenAI API（预留） | AI 评分 + 陪练对话 + 学习计划生成 |
| **部署** | Render.com (后端) + GitHub Pages (前端) | 免费托管，自动部署 |

---

## 三、核心功能模块

### 3.1 四科练习

| 科目 | 功能 | 状态 |
|------|------|------|
| 阅读 | 文章阅读 + 题目练习 + 计时 + 结果分析 | ✅ 已实现 |
| 听力 | 音频播放 + 题目练习 + 倍速播放 | ✅ 已实现 |
| 口语 | 录音答题 + AI 评分（预留） | 🔲 待完善 |
| 写作 | 在线编辑器 + 计时 + AI 批改（预留） | 🔲 待完善 |

### 3.2 AI 陪练

- **口语对话模式**：与 AI 进行托福口语场景对话，实时评分
- **听力沉浸模式**：AI 朗读听力材料，用户进行交互式问答
- **场景分类**：日常对话 / 校园场景 / 学术讨论
- **状态**：接口已预留，AI 服务接入后可用

### 3.3 智能学习计划

- 基于用户目标分数和考试日期，自动生成分阶段学习计划
- 三阶段：**基础阶段（40%）** → **强化阶段（30%）** → **冲刺阶段（30%）**
- 每日任务动态调节：根据昨日完成情况和薄弱科目调整任务配比
- 算法：改进版 SM-2 遗忘曲线（用于错题复习调度）

### 3.4 错题本

- 自动收集练习/模考中的错题
- 基于遗忘曲线算法推送复习任务
- 重做错题后更新掌握度（`mastery_level` 和 `ease_factor`）
- 支持按科目筛选

### 3.5 全真模拟考试

- 四科连考模式，还原真实考试流程
- 限时答题，自动计分
- 模考结果含各科明细和 AI 反馈

---

## 四、商业化设计

### 4.1 用户体系

| 用户类型 | 权限 |
|---------|------|
| **免费用户（free）** | 每日限 20 题，AI 陪练限 10 分钟/天，可访问基础题库 |
| **付费会员（premium）** | 全量题库解锁，AI 陪练无限制，模考无限制，学习计划全功能 |

会员状态存储在 `users.membership` 字段，JWT 中携带，前后端双重校验。

### 4.2 支付系统

- 套餐设计：

| 套餐 | 价格 | 说明 |
|------|------|------|
| 月卡 | ¥29.9/月 | 按月订阅，可自动续费 |
| 季卡 | ¥79.9/季 | 相当于 ¥26.6/月，更划算 |
| 年卡 | ¥299/年 | 相当于 ¥24.9/月，最优惠 |

- 支付流程：`创建订单` → `微信支付` → `支付回调` → `激活会员` → `更新 subscription 表`
- 当前状态：支付接口已预留，微信支付 SDK 待接入

### 4.3 广告系统

- **广告位设计**：

| 位置 | 页面 | 说明 |
|------|------|------|
| `home` | 首页 | 今日任务卡片下方，Banner 形式 |
| `practice-done` | 练习完成页 | 成绩展示后，激励视频或 Banner |
| `wrong-book` | 错题本 | 错题列表下方，相关教辅广告 |

- **收益模型**：CPM 计费，预估 `$2.00/1000 次展示`
- 广告内容通过 `adService.js` 管理，支持按 `placement` 轮播

### 4.4 数据看板（管理后台）

管理员可查看：
- 用户增长趋势（日新增、累计用户）
- 日活 / 周活 / 月活
- 各科目使用分布
- 付费转化率
- 广告展示次数和预估收益
- 用户留存率（次日/7日/30日）

---

## 五、数据库设计

### 5.1 表结构总览

共 **16 张表**，分五大模块：

**用户模块**
- `users` — 用户基本信息（含 membership 字段）
- `user_stats` — 用户学习统计（各科目进度 JSONB）
- `usage_events` — 用户行为埋点

**题库模块**
- `questions` — 题目表（支持 PDF 上传解析入库）
- `practice_sets` — 套题/试卷表

**学习记录模块**
- `exam_records` — 考试/练习记录
- `wrong_questions` — 错题本（含 SM-2 算法字段）
- `study_plans` — 学习计划
- `daily_tasks` — 每日任务

**AI 陪练模块**
- `ai_conversations` — AI 对话记录

**商业化模块**
- `orders` — 订单表
- `subscriptions` — 订阅表
- `ad_impressions` — 广告展示记录

**管理后台模块**
- `admin_users` — 管理员用户
- `admin_logs` — 操作日志
- `user_feedback` — 用户反馈

### 5.2 核心算法字段说明

`wrong_questions` 表使用改进版 SM-2 算法：

| 字段 | 说明 |
|------|------|
| `next_review_at` | 下次复习时间 |
| `sm2_easiness` | 记忆容易度因子（初始 2.50） |
| `sm2_interval` | 当前复习间隔（天数） |
| `sm2_repetitions` | 连续正确次数 |
| `mastery_level` | 掌握度（0~1，前端计算展示） |

---

## 六、核心算法说明

### 6.1 遗忘曲线算法（SM-2 改进版）

```
输入：用户重做错题的正确率、用时

计算质量分 quality (0~5)：
  - 正确且用时 < 平均用时 * 0.8  → quality = 5
  - 正确且用时正常              → quality = 4
  - 正确但用时较长              → quality = 3
  - 错误                         → quality = 1~2

if quality >= 3:
    interval = interval * ease_factor
    ease_factor += 0.1
else:
    interval = 1  （重置为明天复习）
    ease_factor = max(1.3, ease_factor - 0.2)

next_review_at = now + interval days
```

### 6.2 学习计划生成算法

```
输入：target_score, exam_date, current_level

N = exam_date - today
foundation_days  = N * 0.4
strengthen_days  = N * 0.3
sprint_days      = N * 0.3

各阶段每日任务权重：
  基础阶段：阅读 30% + 听力 20% + AI口语 25% + AI听力 25%
  强化阶段：阅读 20% + 听力 15% + 错题回顾 20% + AI陪练 25% + 写作 20%
  冲刺阶段：模考 40% + 错题回顾 30% + AI陪练 20% + 写作 10%

每日动态微调：根据昨日完成率和各科目正确率调整次日任务配比
```

### 6.3 动态调节规则

| 条件 | 调节动作 |
|------|---------|
| 某科目正确率 > 90% 连续 3 天 | 该科任务配比 -10%，分配给最弱科目 |
| AI 评分连续停滞 5 天 | 增加陪练时长 + 推荐高分范文 |
| 考前 3 天 | 关闭新题推荐，100% 错题回顾 + AI 陪练维持语感 |

---

## 七、API 接口总览

基础路径：`/api/v1`

### 7.1 用户模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/auth/login` | 微信登录（code 换 openid） | 无需 |
| GET | `/user/profile` | 获取个人信息 | 需要 |
| PUT | `/user/profile` | 更新目标分数/考试日期 | 需要 |
| GET | `/user/stats` | 获取学习统计数据 | 需要 |
| GET | `/user/usage-limit` | 获取今日剩余免费额度 | 需要 |

### 7.2 题库模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/questions/upload` | 上传 PDF，触发 OCR 解析 |
| GET | `/questions` | 题目列表（支持科目/难度筛选） |
| GET | `/questions/:id` | 题目详情 |
| GET | `/practice-sets` | 套题列表 |
| GET | `/practice-sets/:id` | 套题详情（含题目） |

### 7.3 考试/练习模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/exam/start` | 开始练习/模考 |
| POST | `/exam/:id/submit` | 提交答案 |
| GET | `/exam/:id/result` | 获取考试结果 |
| GET | `/exam/history` | 考试历史记录 |

### 7.4 错题模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/wrong-questions` | 错题列表 |
| GET | `/wrong-questions/review-plan` | 今日复习推荐 |
| POST | `/wrong-questions/:id/redo` | 重做错题 |

### 7.5 会员/支付模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/membership/plans` | 获取会员套餐列表 |
| POST | `/membership/create-order` | 创建订单 |
| POST | `/membership/simulate-pay` | 模拟支付（开发用） |
| GET | `/membership/my-subscription` | 获取我的订阅信息 |
| GET | `/membership/usage-limit` | 获取今日剩余免费额度 |
| POST | `/membership/cancel` | 取消订阅 |

### 7.6 管理后台 API（`/api/v1/admin`，需 admin 权限）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/dashboard/overview` | 数据总览 |
| GET | `/admin/dashboard/users` | 用户增长趋势 |
| GET | `/admin/dashboard/usage` | 使用时长趋势 |
| GET | `/admin/dashboard/retention` | 留存率分析 |
| GET | `/admin/dashboard/subjects` | 各科目使用分布 |
| GET | `/admin/orders` | 订单管理 |
| GET | `/admin/subscriptions` | 订阅管理 |
| GET | `/admin/ad-analytics` | 广告效果分析 |
| GET | `/admin/feedback` | 反馈列表 |
| PUT | `/admin/feedback/:id/reply` | 回复用户反馈 |

---

## 八、项目目录结构

```
toefl-miniapp/
├── miniprogram/             # 微信小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/               # 小程序页面
│   │   ├── index/           # 首页
│   │   ├── reading/         # 阅读模块
│   │   ├── listening/       # 听力模块
│   │   ├── speaking/        # 口语模块
│   │   ├── writing/         # 写作模块
│   │   ├── mock-exam/       # 全真模拟
│   │   ├── wrong-book/      # 错题本
│   │   ├── ai-talk/         # AI 陪练
│   │   ├── plan/            # 学习计划
│   │   ├── profile/         # 个人中心
│   │   └── membership/      # 会员中心
│   ├── components/          # 小程序组件（ad-banner 等）
│   └── utils/               # 工具函数（api.js, membership.js 等）
│
├── web/                     # Web 前端（Vue 3）
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   │   ├── Dashboard.vue
│   │   │   ├── Reading.vue / Listening.vue / Writing.vue
│   │   │   ├── Membership.vue
│   │   │   ├── Profile.vue
│   │   │   └── admin/       # 管理后台页面
│   │   ├── components/      # Vue 组件（AdBanner.vue 等）
│   │   ├── router/          # Vue Router 配置
│   │   ├── stores/          # 状态管理（user.js）
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── admin/                   # 管理后台前端（独立 Vue 3 项目）
│   └── src/views/admin/     # 管理页面
│
├── server/                  # Node.js 后端
│   ├── src/
│   │   ├── app.js           # Express 入口
│   │   ├── routes/          # API 路由
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑层
│   │   │   ├── membershipService.js
│   │   │   ├── paymentService.js
│   │   │   ├── adService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── sm2.js
│   │   │   └── planner.js
│   │   ├── models/          # 数据库模型/查询
│   │   │   └── db-init.sql  # 数据库初始化脚本
│   │   ├── middleware/      # 鉴权/日志/限流
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── render.yaml          # Render.com 部署配置
│
├── docs/                    # 项目文档
│   ├── deployment.md        # 部署文档（本文件）
│   ├── project-summary.md  # 项目总结（本文件）
│   └── api-spec.md         # API 详细文档
│
├── .gitignore
├── README.md
└── render.yaml              # Render.com 蓝图配置
```

---

## 九、后续迭代计划

| 版本 | 重点 | 内容 | 状态 |
|------|------|------|------|
| **v1.0** | MVP | 阅读+听力基础练习、错题集、PDF 上传解析、用户体系 | ✅ 当前版本 |
| **v1.1** | AI 陪练 | 口语对话 + 听力沉浸模式（接入 OpenAI API） | 🔲 进行中 |
| **v1.2** | 全科覆盖 | 口语题、写作题 + AI 评分 | 🔲 待开发 |
| **v1.3** | 全真模拟 | 四科连考模式、计时、自动计分 | 🔲 待开发 |
| **v1.4** | AI 导师 | 学习计划自动生成 + 动态调节（完善 planner.js） | 🔲 待开发 |
| **v1.5** | 后台管理 | 数据监控 + 反馈管理 + 题目审核 | 🔲 待开发 |
| **v2.0** | 商业化 | 付费会员完整支付流程 + 广告系统上线 | 🔲 待开发 |

---

## 十、已知限制与注意事项

1. **Render 免费版休眠**：后端服务在闲置后会休眠，首次请求有冷启动延迟（约 30 秒）
2. **小程序支付限制**：个人主体小程序无法使用微信支付，需企业资质
3. **OpenAI API 费用**：AI 陪练功能需要有效的 OpenAI API Key，按调用量计费
4. **PDF OCR 解析**：当前使用腾讯云 OCR（预留），需要配置 API 密钥
5. **数据持久化**：免费版 PostgreSQL 有行数和存储限制，大规模用户需升级

---

*文档结束。*
