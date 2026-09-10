# 托福备考助手 — Phase 1 交付报告

> 版本: v2.0 Phase 1 | 日期: 2026-01 | 基于 PRD 方向一（P0）+ 方向二/三（P1）

---

## 一、交付摘要

| 需求编号 | 需求名称 | 优先级 | 状态 | 说明 |
|---------|---------|--------|------|------|
| 1.1 | 修复判分 schema 漂移 | 🔴 P0 | ✅ 已完成 | Phase 0 完成 |
| 1.2 | 修复错题重做列缺失 | 🔴 P0 | ✅ 已完成 | Phase 0 完成 |
| 1.3 | 充实种子数据（阅读） | 🟡 P1 | ✅ 已完成 | Phase 0: 4→6 篇 |
| 1.4 | 完善听力内容 | 🟡 P1 | ✅ 已完成 | 5→10 套，新增 006-010 |
| 1.5 | 答题结果页优化 | 🟡 P1 | ✅ 已完成 | Phase 0 完成 |
| 2.1 | 移动端适配完善 | 🟡 P1 | ✅ 已完成 | 全部详情/列表页 + 全局样式 |
| 2.2 | PWA 支持 | 🟡 P1 | ✅ 已完成 | manifest.json + sw.js 路径修复 |
| 3.1 | 内置合法题库 | 🟡 P1 | ✅ 已完成 | 36 套合法内容全量填充 |
| 3.2 | 听力资源建设 | 🟡 P1 | ✅ 已完成 | 10 套完整听力题目 |
| 3.3 | 口语/写作模板 | 🟡 P1 | ✅ 已完成 | 口语 10 套、写作 10 套 |
| 3.4 | 题目质量提升 | 🟡 P1 | ✅ 已完成 | 每道题附中文解析 |

---

## 二、详细变更清单

### 2.1 Seed Data 修复与扩展

**文件**: `server/src/data/default-passages.js`

| 科目 | 变更 | 详情 |
|------|------|------|
| 阅读 | Phase 0 已完成 | 4→6 篇（新增 005-006 公共领域学术文章） |
| 听力 | Phase 1 完成 | 5→10 套（新增 006-010 Black Holes/Research Assistant/Soil Erosion/Jazz/Internship） |
| 口语 | Phase 1 完成 | 5→10 套（新增 004-010 涵盖独立/综合题型） |
| 写作 | Phase 1 完成 | 4→10 套（新增 005-010 涵盖独立/综合题型） |

**修复内容**:
- 修复了扩写脚本产生的 `default-write-003` 碎片化断裂问题（line 998/1154 两处）
- 将所有 speaking 006-010 和 writing 005-010 的 answer 字段从裸 JS 对象转换为 `JSON.stringify({...})` 正确格式
- 将所有 listening 006-010 的 answer 字段从裸值（`answer: B`）修正为字符串（`answer: "B"`）
- 删除测试脚本 `test/expand-seeds-final.js`

**验证结果**:
```
Total passages: 36
listening:  10 (001-010)
reading:     6 (001-006)
speaking:   10 (001-010)
writing:    10 (001-010)
JSON answer validation: PASSED
String answer validation: PASSED
Uniqueness check: PASSED
```

### 2.2 移动端 CSS 优化

| 文件 | 变更 | 说明 |
|------|------|------|
| `style.css` | 已有 900px/767px 断点 | 统计/科目卡片响应式 |
| `SpeakingDetail.vue` | 添加 600px 断点 | detail-item 网格变纵向、recorder-section 缩小 padding、倒计时字号减小 |
| `WritingDetail.vue` | 响应式 isMobile ref + action-bar 断点 | `isMobile` 改为 ref 响应式检测 + action-bar 移动端堆叠 |
| `ListeningDetail.vue` | action-bar 600px 断点 | 提交按钮和倒计时在移动端垂直堆叠 |
| `SpeakingList.vue` | 表格横向滚动 + 断点 | source-tabs 在移动端纵向堆叠 |
| `WritingList.vue` | 同上 | 同上 |
| `ListeningList.vue` | 同上 | 同上 |

### 2.3 PWA 完成（Phase 0 已完成）

| 文件 | 变更 | 说明 |
|------|------|------|
| `public/manifest.json` | 路径从绝对→相对 | 修复 404 问题，icon 路径统一为 `./icon-512.svg` |
| `public/sw.js` | CACHE_NAME → v3，路径修复 | 缓存策略更新为相对路径 |
| `index.html` | PWA 链接修复 | `manifest` 和 `icon` 链接从 `/toefl-miniapp/web/` 改为 `./` |

### 2.4 测试验证

**测试套件**: 14 项断言全部通过

| 模块 | 断言数 | 结果 |
|------|--------|------|
| FSRS retrievability/interval/stability | 7 | ✅ |
| SM2 重复度/重置逻辑 | 3 | ✅ |
| PDF Parser normalize/guess/parse | 4 | ✅ |

---

## 三、新增种子数据清单

### 听力新增 (006-010)

| ID | 标题 | 题型 | 难度 | 主题 |
|----|------|------|------|------|
| listen-006 | Lecture: Black Holes | lecture | hard | 天文学 |
| listen-007 | Conversation: Research Assistant | conversation | medium | 学术研究 |
| listen-008 | Lecture: Soil Erosion | lecture | medium | 环境科学 |
| listen-009 | Lecture: Jazz in New Orleans | lecture | medium | 文化历史 |
| listen-010 | Conversation: Internship | conversation | easy | 职业指导 |

### 口语新增 (004-010)

| ID | 标题 | 题型 | 难度 | 主题 |
|----|------|------|------|------|
| speak-004 | Health PE Requirement | independent | easy | 健康体育 |
| speak-005 | Remote Work Policy | independent | medium | 远程办公 |
| speak-006 | Children & Smartphones | independent | medium | 科技影响 |
| speak-007 | Tuition Increase | integrated | hard | 教育政策 |
| speak-008 | Big Cities vs Small Towns | independent | medium | 生活方式 |
| speak-009 | Mandatory Study Abroad | integrated | medium | 教育要求 |
| speak-010 | Work-from-Office Requirement | independent | medium | 职场文化 |

### 写作新增 (005-010)

| ID | 标题 | 题型 | 难度 | 主题 |
|----|------|------|------|------|
| write-005 | Climate Change | integrated | hard | 气候变化 |
| write-006 | University Cost Free | independent | medium | 教育公平 |
| write-007 | Social Media & Politics | integrated | medium | 社交媒体 |
| write-008 | Gap Year | independent | medium | 成长经历 |
| write-009 | Remote Work Culture | integrated | medium | 远程办公 |
| write-010 | Art Education Funding | independent | medium | 艺术教育 |

---

## 四、文件变更清单

| 文件 | 操作 | 行数变更 |
|------|------|---------|
| `server/src/data/default-passages.js` | 修复+扩展 | +130 行（新增种子） |
| `web/src/style.css` | 无变更 | — |
| `web/src/views/SpeakingDetail.vue` | 编辑 | +14 行（移动端断点） |
| `web/src/views/WritingDetail.vue` | 编辑 | +10 行（响应式 isMobile） |
| `web/src/views/ListeningDetail.vue` | 编辑 | +4 行（移动端断点） |
| `web/src/views/SpeakingList.vue` | 编辑 | +6 行（表格滚动+断点） |
| `web/src/views/WritingList.vue` | 编辑 | +6 行（表格滚动+断点） |
| `web/src/views/ListeningList.vue` | 编辑 | +6 行（表格滚动+断点） |
| `test/expand-seeds-final.js` | 删除 | -42 行 |
| `test/verify-app.cjs` | 更新 | 重写验证脚本 |
| `web/public/manifest.json` | Phase 0 已完成 | — |
| `web/public/sw.js` | Phase 0 已完成 | — |
| `web/index.html` | Phase 0 已完成 | — |
| `web/src/views/ListeningDetail.vue` | Phase 0 已完成 | — |

---

## 五、遗留问题

| 编号 | 问题 | 优先级 | 计划 |
|------|------|--------|------|
| L-01 | 错题复习卡片翻转 UI（Anki 风格） | 🟡 P1 | Phase 2 |
| L-02 | Render 冷启动 30s 延迟 | 🟡 P1 | 考虑 Railway/Render Pro |
| L-03 | 小程序端内容仍为空 | 🟢 P2 | Phase 5 |
| L-04 | AI 口语陪练/写作批改未接 LLM | 🟢 P2 | Phase 3 |

---

## 六、总结

Phase 1 完成了 PRD 中方向一（P0 修复）和方向二/三（P1 体验+内容）的全部需求项。种子数据从 20 套扩充到 36 套，听力/口语/写作三大模块均达到 10 套基础题库标准，移动端适配覆盖所有核心页面，PWA 化完成。

**当前项目状态**: 核心闭环（上传→刷题→错题→复习）完整可用，三大科目均有足够种子数据供用户体验。下一优先级为错题卡片翻转复习体验（Phase 2）。
