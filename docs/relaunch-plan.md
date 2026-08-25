# toefl-miniapp 重启计划（代码评审 + 竞品拆解 + 立项书 + 里程碑）

> 日期：2026 年（基于对现有仓库的通读评审）
> 结论一句话：**地基不错，核心闭环有阻断级 bug 没跑通，且内容踩在 TPO 版权雷区；方向改为「合法题目自导入 + 多端同步 + 错题 + FSRS 科学节奏」，先收敛、后扩。**

---

## 一、代码评审结论

### 1.1 优点（保留）

| 模块 | 评价 |
|---|---|
| Monorepo 结构 | 清晰：`miniprogram / web / admin / server / docs` 分离 |
| 数据库设计 | 16 张表、索引齐全、JSONB 灵活存储，`wrong_questions` 已带 SM-2 字段 |
| SM-2 算法 (`sm2.js`) | 实现正确，质量评分 + ease factor 区间 [1.3, 2.5] |
| 三阶段计划器 (`planner.js`) | 基础/强化/冲刺 + 薄弱科目加权，可用 |
| PDF 解析器 (`pdf-parser.js`) | **质量很高**：AI（DeepSeek/OpenAI）+ 规则双引擎、段落保护、答案 key 提取 —— 这正是「用户自导入」的现成底座 |
| 核心闭环骨架 | 练习提交 → 答错自动进错题本 → SM-2 复习，链路已搭好 |

### 1.2 问题（按严重度排序）

1. **【阻断级】schema 漂移，核心闭环跑不通**：
   - `practice.js` 读 `correct_answer`，但表里列名是 `answer` → 阅读/听力判分直接 500。
   - `wrong.js` 重做时写 `updated_at`，但 `wrong_questions` 没有该列 → 重做错题 500。
2. **【法律雷区】TPO 版权**：种子数据与 PDF 解析器都以「TPO/XPO 真题」（ETS 版权）为核心，公开分发即侵权。必须「去 TPO 化」。
3. **【摊子太大】3 个前端 + AI 陪练/AI 评分/AI tutor/支付全铺开**：单人兼职无法维护，核心体验被稀释。
4. **算法可升级**：SM-2 → FSRS（现代标准，更贴合「科学安排刷题节奏」的卖点）。
5. 无测试、无 CI；`wrong.js` 列表把正确答案直接返回客户端（「重做错题」失去意义）。

---

## 二、竞品拆解

| 竞品 | 内容来源 | 多端同步 | 错题/节奏 | UI | 变现 | 版权风险 |
|---|---|---|---|---|---|---|
| 淘宝/闲鱼 TPO 刷题软件 | 盗版 TPO | ❌ 多 PC 单机 | ❌ 弱 | ❌ 差 | 一锤子卖 | **高（侵权）** |
| 小站托福 | TPO 题库（授权待核） | 部分 | 一般 | 中 | 卖课+广告 | 中 |
| 考满分 KMF | 题库+机经 | 网页/App | 一般 | 中 | 卖课+会员 | 中 |
| 新东方在线 | 品牌课程 | 部分 | 弱 | 中 | 卖课 | 低 |
| ETS 官方 TPO | 正版真题 | ❌ 按套购买 | ❌ 无 | 一般 | 按套付费 | 无 |
| Anki/墨墨/扇贝（通用记忆） | 用户自建 | ✅ 强 | ✅ 强（SRS） | 中 | 订阅/买断 | 无 |

**空白点（我们的差异化）**：市场里**几乎没有「合法内容 + 多端同步 + 好用 UI + 错题归纳 + 科学复习节奏」的组合**。
- 通用记忆工具（Anki）有同步+SRS，但没有托福场景化 UI；
- 托福题库工具（小站/KMF）有内容，但同步和体验弱、且依赖版权；
- 盗版软件便宜但难用、违法。

**我们的位置**：做「托福场景化的 Anki」——**题目用户自导入 + 极简好用的刷题/错题/复习体验 + 多端同步**，内容不碰 TPO。

---

## 三、立项书（新方向）

### 3.1 定位
> 一款**托福刷题工具**：用户导入自己的题目（PDF/手录），跨设备同步，自动归纳错题，用 FSRS 科学安排复习节奏。**不提供盗版 TPO。**

### 3.2 核心闭环（第一优先级，只做这个）
```
导入题目 → 刷题（分科/计时） → 答错自动进错题本 → FSRS 排程 → 每日复习 → 掌握度上升
     └────────────── 多端同步（Web/PWA + 移动端）──────────────┘
```

### 3.3 技术架构（保留现有，收敛前端）
- 后端：保留 Node.js + Express + PostgreSQL + JWT（成熟、无需重写）。
- 前端：**收敛到 Web（Vue 3）PWA 为第一优先级**；小程序、Admin 后置；AI 陪练/评分/支付/广告全部标记「暂缓」。
- 算法：引入 **FSRS**（`ts-fsrs` 或自实现），替换/并存 SM-2；`wrong_questions` 增加 FSRS 参数列（state/stability/difficulty）。
- 数据：修复 schema 漂移；`wrong_questions` 补 `updated_at`。

### 3.4 数据库调整
- 统一判分列名为 `answer`（`questions.answer`），删除对 `correct_answer` 的引用。
- `wrong_questions` 增加：`updated_at`、FSRS 字段（`fsrs_state`、`stability`、`difficulty`，迁移时可由 SM-2 参数初始化）。

### 3.5 版权策略
- 种子数据去掉「TPO」字样与 ETS 原文，替换为自研题/占位。
- PDF 解析定位为「用户导入自己的资料」，且**不公开共享用户导入内容**（仅本人可见）。
- 产品文案不出现「TPO 真题」等侵权字样。

### 3.6 暂缓清单（不删，先不动）
AI 陪练、AI 评分、AI tutor、全真模考、微信支付、广告、Admin 后台、小程序端。

---

## 四、里程碑计划（兼职，3–6 个月）

| 里程碑 | 内容 | 周期 |
|---|---|---|
| **M0 修通核心** | 修 `correct_answer`/`updated_at` 漂移、补最小测试、跑通「刷题→错题→复习」 | 本周 |
| **M1 去版权+算法** | 去 TPO 化种子数据；SM-2 → FSRS；错题列表不再泄露答案 | 2–3 周 |
| **M2 前端打磨** | Web PWA：导入 / 刷题 / 错题 / 复习 四页做到「自己天天用」 | 1–2 月 |
| **M3 自用+小范围** | 自己备考全程使用；拉 10–20 个考友内测 | 持续 |
| **M4 上线准备** | 软著、域名+ICP 备案、接入订阅（先微信/支付宝，需企业） | 第 3–4 月 |

> 注：托福工具**不是游戏，不需要版号**；但公开收费需要：软著 + ICP 备案 + 企业主体（可复用之前调研的开公司流程）。

---

## 五、本次已完成的改动

1. `server/src/routes/practice.js`：判分查询 `correct_answer` → `answer AS correct_answer`，修复阅读/听力判分 500。
2. `server/src/config/db.js`：`COLUMN_DEFS` 增加 `wrong_questions.updated_at`，修复重做错题 500。

（后续改动随里程碑逐步提交。）

---

## 六、MVP 收敛决策（根据开发者最新反馈）

1. **隐藏 AI/付费入口，代码保留**：Web 导航已隐藏「模拟考试 / AI陪练 / AI导师 / 学习计划」，路由与组件全部保留（`web/src/App.vue` 内注释标记，随时恢复）。
2. **手机立即可用**：Web 端为第一优先级；移动端 TabBar 改为「首页 / 练习 / 错题本 / 我的」；`index.html` 已含 viewport，各核心页已有 `max-width` + `@media` 响应式规则。
3. **MVP 核心闭环**：做题 → 打分 → 看正确答案 → 选套题 + 错题本（FSRS 复习）；多端同步由同一后端 + 账号登录实现。

### 本阶段已落地改动
- `server/src/services/fsrs.js`：FSRS-4.5 完整实现（官方 17 参数）。
- `server/src/routes/wrong.js`：错题重做由 SM-2 切换到 FSRS（新增 `fsrs_stability / fsrs_difficulty / last_review_at`）。
- `server/src/config/db.js`：`wrong_questions` 新增 3 个 FSRS 列（启动自动补列）。
- `server/test/`：sm2(5) + pdf-parser(4) + fsrs(8) 测试，全部通过。
- `web/src/App.vue`：隐藏 AI/付费入口，移动 Tab 换为错题本。

### 部署提示（手机立即可用）
- 后端：推到 GitHub 后 Render 自动重部署；启动时 `initDatabase()` 自动补列。
- Web：`cd web && npm install && npm run build && npx gh-pages -d dist`，手机访问 `https://huieric.github.io/toefl-miniapp/web/`。
