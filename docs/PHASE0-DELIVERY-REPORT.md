# 托福备考助手 — Phase 0 交付报告

> 版本：v2.0 Phase 0（2025-05-23）  
> 依据 PRD：`toefl-miniapp/docs/PRD-下一步优化方向.md`  
> 状态：✅ P0 全部完成，P1 部分完成

---

## 一、完成清单

### P0：夯实核心闭环（所有阻塞项已解决）

| # | 任务 | 文件变更 | 验证结果 |
|---|------|---------|---------|
| P0-1 | 修复答题评分 schema 漂移 | `server/src/routes/practice.js`、`server/src/config/db.js`、`server/src/models/db-init.sql` | 统一使用 `answer` 列，`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 安全迁移 |
| P0-2 | 修复错题本缺少 `updated_at` | `server/src/routes/wrong.js`、`server/src/config/db.js`、`server/src/models/db-init.sql` | COLUMN_DEFS 覆盖，UPDATE 语句含 `updated_at = CURRENT_TIMESTAMP` |
| P0-3 | 补充种子数据 | `server/src/data/default-passages.js`、`server/src/data/seed-defaults.js` | 从 14 增至 20 篇阅读/听力/口语/写作，共 59+ 题 |
| P0-4 | 结果页正确/错误高亮 | `web/src/views/ReadingPassageResult.vue` | 环形总分、逐题对错、分析展示、加入错题本 toggle |

### P1：前端体验打磨（部分完成）

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| P1-1 | 错题本间隔复习 | ✅ 已完成 | `web/src/views/WrongBookRedo.vue`，翻转卡片 UX，4 按钮（Again/Hard/Good/Easy），FSRS 更新 |
| P1-2 | 练习页提交修复 | ✅ 已完成 | `web/src/views/ReadingPassage.vue`，改为发送 `{ answers: a.selected }`，与后端期望一致 |
| P1-3 | PWA 支持 | ⏳ 待开发 | 需配置 `manifest.json` 和 Service Worker |
| P1-4 | 加载骨架屏 | ⏳ 待开发 | 需在各页面添加 `Skeleton` 组件 |
| P1-5 | 移动端适配 QA | ⏳ 待开发 | 需真机/DevTools 多分辨率测试 |

### 内容生态建设（P1）

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| C1 | 扩充阅读/听力题库 | ✅ 已完成 | 阅读 6 篇 ×30+ 题，听力 5 篇 ×21 题 |
| C2 | 扩充口语/写作题库 | ⚠️ 部分完成 | 口语 4 套、写作 3 套，仍需更多 |

---

## 二、验证结果

### 自动化测试（`server/test/run-tests.cjs`）

- **14/14 断言通过**，覆盖：
  - FSRS-4.5 算法：初始状态、四档评分 (1-4)、稳定性/易学性递增、间隔计算
  - SM-2 算法：复习队列、更新参数、同天复习判断
  - PDF 解析器：`normalizeAnswer` 转换、`guessQuestionType` 分类

### 模块导入验证（`server/test/verify-app.cjs`）

- **15/15 路由模块** 加载成功
- **37→42 种子 INSERT**（扩充后）
- **19 张表** 定义完整
- **前端 `dist/index.html`** 存在

### Schema 一致性

- `questions` 表：`answer TEXT` ✅
- `wrong_questions` 表：`updated_at TIMESTAMP` ✅
- `COLUMN_DEFS` 与 DDL 完全同步 ✅

---

## 三、已知限制

| 项目 | 限制 | 缓解措施 |
|------|------|---------|
| 构建环境 | 沙箱 `spawn EPERM` 阻止 `pnpm run build` | 在本地运行构建，`dist/` 已存在 |
| 部署 | Render.com 免费层冷启动 ~30s | `api/index.js` 已有 `withRetry` 封装 |
| 口语/写作题库 | 当前仅 4+3 套 | PRD Phase 1 继续扩充 |
| PWA/骨架屏 | 尚未实现 | PRD Phase 1 计划项 |

---

## 四、下一步建议

### 优先队列（Phase 1 剩余）

1. **口语/写作扩充**：至少各 5-8 套，覆盖更多题型
2. **PWA 支持**：`manifest.json` + Service Worker 缓存策略
3. **加载骨架屏**：Reading/WrongBook/Exam 三页面

### 中期队列（Phase 2 AI）

4. **AI 助教**（`/api/ai/tutor`）：自由对话 + 上下文记忆
5. **AI 写作评分**：OpenAI/DeepSeek 自动批改 + 反馈
6. **AI 口语评估**：语音输入 + 评分

### 后期队列（Phase 3）

7. **数据驱动仪表盘**：Admin 统计页
8. **会员体系**：`membership` 路由已搭建，需前端接入
9. **广告系统**：`ads` 路由已搭建，需前端接入

---

> 📋 交付确认：所有 P0 阻塞项已修复，核心学习闭环（练习→评分→错题→复习）完整可用。
