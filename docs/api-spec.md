# 托福备考助手 - API 接口文档

> 版本：v1.0 | 日期：2026-05-28
> 基础路径：`/api/v1`

---

## 通用说明

### 请求格式

- 所有请求使用 **JSON** 格式（`Content-Type: application/json`）
- GET 请求参数通过 URL query string 传递
- POST/PUT 请求参数通过 request body 传递（JSON 格式）

### 响应格式

```json
// 成功
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 失败
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

### 错误码说明

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / Token 无效 |
| 403 | 权限不足（免费用户访问会员功能） |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

### 鉴权

在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

Token 通过 `/auth/login` 接口获取，有效期 7 天（可通过 `JWT_EXPIRE` 环境变量调整）。

---

## 一、认证模块

### 1.1 微信登录

`POST /auth/login`

**请求参数：**

```json
{
  "code": "081abc123def",   // 微信登录 code
  "nickname": "用户昵称",   // 可选，首次登录时提供
  "avatarUrl": "https://..." // 可选，首次登录时提供
}
```

**响应：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "openid": "oXXX...",
      "nickname": "用户昵称",
      "avatarUrl": "https://...",
      "membership": "free",
      "targetScore": 100,
      "examDate": "2026-12-31"
    }
  }
}
```

---

## 二、用户模块

### 2.1 获取个人信息

`GET /user/profile`

**鉴权：** 需要

**响应：**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatarUrl": "https://...",
    "phone": "138****8888",
    "membership": "free",
    "level": "intermediate",
    "targetScore": 100,
    "examDate": "2026-12-31",
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLoginAt": "2026-05-28T08:00:00Z"
  }
}
```

### 2.2 更新个人信息

`PUT /user/profile`

**鉴权：** 需要

**请求参数：**

```json
{
  "nickname": "新昵称",
  "targetScore": 110,
  "examDate": "2026-11-30"
}
```

### 2.3 获取学习统计

`GET /user/stats`

**鉴权：** 需要

**响应：**

```json
{
  "code": 200,
  "data": {
    "totalStudyMinutes": 1200,
    "totalQuestions": 500,
    "correctQuestions": 350,
    "readingScore": 25.5,
    "listeningScore": 23.0,
    "speakingScore": 22.0,
    "writingScore": 24.5,
    "totalExams": 15,
    "avgExamScore": 95.0,
    "streakDays": 7,
    "lastStudyDate": "2026-05-28"
  }
}
```

### 2.4 获取今日剩余免费额度

`GET /user/usage-limit`

**鉴权：** 需要

**响应：**

```json
{
  "code": 200,
  "data": {
    "membership": "free",
    "dailyQuestionLimit": 20,
    "dailyAiMinutesLimit": 10,
    "questionsUsed": 5,
    "aiMinutesUsed": 3,
    "questionsRemaining": 15,
    "aiMinutesRemaining": 7
  }
}
```

---

## 三、题库模块

### 3.1 获取题目列表

`GET /questions?subject=reading&difficulty=easy&page=1&size=20`

**鉴权：** 需要

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject | string | 否 | reading/listening/speaking/writing |
| difficulty | string | 否 | easy/medium/hard |
| type | string | 否 | 题型筛选 |
| page | number | 否 | 页码，默认 1 |
| size | number | 否 | 每页数量，默认 20 |

**响应：**

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "subject": "reading",
        "type": "detail",
        "difficulty": "easy",
        "title": "The Evolution of Birds",
        "content": "What is the main purpose...",
        "options": [{"label":"A","text":"..."}, ...],
        "analysis": "文章讨论了...",
        "passageText": "Birds have long fascinated...",
        "status": "approved"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

### 3.2 获取题目详情

`GET /questions/:id`

**鉴权：** 需要（免费用户受额度限制）

### 3.3 获取套题列表

`GET /practice-sets?subject=reading&page=1&size=10`

### 3.4 获取套题详情

`GET /practice-sets/:id`

**响应：**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "阅读入门练习",
    "description": "适合托福初学者的阅读练习",
    "subject": "reading",
    "difficulty": "easy",
    "timeLimit": 1200,
    "totalScore": 30,
    "questions": [ { "id": 1, "title": "...", ... } ]
  }
}
```

### 3.5 上传 PDF 解析

`POST /questions/upload`

**鉴权：** 需要

**请求：** `multipart/form-data`

| 参数 | 类型 | 说明 |
|------|------|------|
| file | File | PDF 文件 |
| subject | string | 科目 |

**响应：**

```json
{
  "code": 200,
  "data": {
    "taskId": "abc123",
    "status": "processing"
  }
}
```

### 3.6 查询 PDF 解析进度

`GET /questions/upload/:id/status`

---

## 四、考试/练习模块

### 4.1 开始练习/模考

`POST /exam/start`

**鉴权：** 需要

**请求参数：**

```json
{
  "practiceSetId": 1,        // 套题 ID（单科练习可为空）
  "mode": "single",           // single=单科, full_mock=全真模拟
  "subject": "reading"        // 单科练习时必填
}
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "examRecordId": 123,
    "questions": [ ... ],
    "timeLimit": 1200
  }
}
```

### 4.2 提交答案

`POST /exam/:id/submit`

**请求参数：**

```json
{
  "answers": [
    {
      "questionId": 1,
      "userAnswer": "B",
      "timeSpent": 60
    }
  ],
  "timeUsed": 900
}
```

### 4.3 获取考试结果

`GET /exam/:id/result`

**响应：**

```json
{
  "code": 200,
  "data": {
    "examRecordId": 123,
    "totalScore": 25,
    "timeUsed": 900,
    "answers": [
      {
        "questionId": 1,
        "userAnswer": "B",
        "correctAnswer": "B",
        "isCorrect": true,
        "analysis": "..."
      }
    ],
    "aiFeedback": "整体表现良好，建议加强..."
  }
}
```

### 4.4 获取考试历史

`GET /exam/history?page=1&size=10`

---

## 五、错题模块

### 5.1 获取错题列表

`GET /wrong-questions?subject=reading&page=1&size=20`

**响应：**

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "questionId": 1,
        "title": "The Evolution of Birds",
        "subject": "reading",
        "wrongCount": 2,
        "lastWrongAt": "2026-05-27T10:00:00Z",
        "nextReviewAt": "2026-05-29T00:00:00Z",
        "masteryLevel": 0.3,
        "easinessFactor": 2.3
      }
    ],
    "total": 50
  }
}
```

### 5.2 获取今日复习推荐

`GET /wrong-questions/review-plan`

**响应：**

```json
{
  "code": 200,
  "data": {
    "reviewCount": 8,
    "newCount": 3,
    "questions": [ ... ]
  }
}
```

### 5.3 重做错题

`POST /wrong-questions/:id/redo`

**请求参数：**

```json
{
  "userAnswer": "B",
  "timeSpent": 45
}
```

---

## 六、AI 陪练模块

### 6.1 开始陪练

`POST /ai-talk/start`

**鉴权：** 需要（免费用户受时长限制）

**请求参数：**

```json
{
  "mode": "speaking",          // speaking / listening
  "scene": "academic"         // daily / campus / academic
}
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "conversationId": 456,
    "aiGreeting": "Hello! Let's talk about environmental protection..."
  }
}
```

### 6.2 发送消息

`POST /ai-talk/:id/message`

**请求参数：**

```json
{
  "message": "I think renewable energy is very important because...",
  "audioUrl": "https://..."    // 语音模式时提供
}
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "aiReply": "That's a great point! Could you elaborate on...",
    "aiAudioUrl": "https://...",
    "score": 3.5,
    "corrections": ["Grammar: consider using 'because of' instead of 'because'"]
  }
}
```

### 6.3 结束陪练

`POST /ai-talk/:id/end`

**响应：**

```json
{
  "code": 200,
  "data": {
    "overallScore": 3.2,
    "durationMinutes": 8,
    "feedback": "你的发音清晰，建议增加复杂句式的使用..."
  }
}
```

### 6.4 获取陪练历史

`GET /ai-talk/history?page=1&size=10`

---

## 七、学习计划模块

### 7.1 创建学习计划

`POST /plan/create`

**请求参数：**

```json
{
  "targetScore": 110,
  "examDate": "2026-11-30",
  "currentScore": 90,
  "dailyMinutes": 90
}
```

### 7.2 获取当前学习计划

`GET /plan/current`

### 7.3 获取每日任务

`GET /plan/daily/:date`  （如 `/plan/daily/2026-05-28`）

**响应：**

```json
{
  "code": 200,
  "data": {
    "date": "2026-05-28",
    "tasks": [
      {
        "id": 1,
        "type": "reading",
        "title": "阅读练习 - 细节题专项",
        "duration": 30,
        "completed": false
      }
    ],
    "isCompleted": false
  }
}
```

### 7.4 标记任务完成

`PUT /plan/daily/:date/task/:taskId`

---

## 八、会员/支付模块

> 基础路径：`/api/v1/membership`

### 8.1 获取会员套餐列表

`GET /membership/plans`

**鉴权：** 需要

**响应：**

```json
{
  "code": 200,
  "data": {
    "plans": [
      { "type": "monthly",  "name": "月卡", "price": 29.90, "days": 30 },
      { "type": "quarterly","name": "季卡", "price": 79.90, "days": 90 },
      { "type": "yearly",   "name": "年卡", "price": 299.00,"days": 365 }
    ]
  }
}
```

### 8.2 创建订单

`POST /membership/create-order`

**请求参数：**

```json
{
  "planType": "monthly"
}
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "orderNo": "ORD20260528000001",
    "planType": "monthly",
    "amount": 29.90,
    "status": "pending",
    "payParams": { }   // 微信支付 JSAPI 参数（待接入）
  }
}
```

### 8.3 模拟支付（开发用）

`POST /membership/simulate-pay`

**请求参数：**

```json
{
  "orderNo": "ORD20260528000001"
}
```

> 生产环境使用微信支付回调接口，详见 8.4。

### 8.4 微信支付回调

`POST /membership/callback`

> 由微信支付服务器回调，不在客户端直接调用。

### 8.5 获取我的订阅信息

`GET /membership/my-subscription`

**响应：**

```json
{
  "code": 200,
  "data": {
    "membership": "premium",
    "subscription": {
      "planType": "monthly",
      "startDate": "2026-05-01T00:00:00Z",
      "endDate": "2026-05-31T23:59:59Z",
      "status": "active",
      "autoRenew": false
    },
    "orders": [ { "orderNo": "ORD...", "amount": 29.90, "paidAt": "..." } ]
  }
}
```

### 8.6 获取今日剩余额度

`GET /membership/usage-limit`

（同 2.4，路径别名）

### 8.7 取消订阅

`POST /membership/cancel`

---

## 九、广告模块

> 基础路径：`/api/v1/ads`

### 9.1 获取广告内容

`GET /ads/banner/:placement`

**鉴权：** 需要

**路径参数：**

| 参数 | 说明 |
|------|------|
| placement | `home` / `practice-done` / `wrong-book` |

**响应：**

```json
{
  "code": 200,
  "data": {
    "adId": "ad_001",
    "placement": "home",
    "imageUrl": "https://.../banner-home.png",
    "linkUrl": "https://...",
    "title": "托福词汇书限时优惠"
  }
}
```

### 9.2 记录广告展示

`POST /ads/impression`

**请求参数：**

```json
{
  "placement": "home",
  "adId": "ad_001"
}
```

### 9.3 广告效果分析（管理后台）

`GET /ads/analytics?from=2026-05-01&to=2026-05-31`

**鉴权：** 需要 admin 权限

---

## 十、反馈模块

### 10.1 提交反馈

`POST /feedback`

**请求参数：**

```json
{
  "type": "suggestion",
  "content": "希望增加口语评分功能",
  "contact": "user@example.com"
}
```

### 10.2 查看我的反馈

`GET /feedback/my?page=1&size=10`

---

## 十一、管理后台 API

> 基础路径：`/api/v1/admin`
> **鉴权：** 需要 admin 权限（JWT 中 `isAdmin: true`）

### 11.1 数据总览

`GET /admin/dashboard/overview`

**响应：**

```json
{
  "code": 200,
  "data": {
    "totalUsers": 1250,
    "newUsersToday": 35,
    "activeToday": 180,
    "totalExams": 5600,
    "totalRevenue": 8990.00
  }
}
```

### 11.2 用户增长趋势

`GET /admin/dashboard/users?from=2026-05-01&to=2026-05-31`

### 11.3 使用时长趋势

`GET /admin/dashboard/usage?from=2026-05-01&to=2026-05-31`

### 11.4 留存率分析

`GET /admin/dashboard/retention`

### 11.5 各科目使用分布

`GET /admin/dashboard/subjects`

### 11.6 订单管理

`GET /admin/orders?page=1&size=20&status=paid`

### 11.7 订阅管理

`GET /admin/subscriptions?page=1&size=20&status=active`

### 11.8 广告效果分析

`GET /admin/ad-analytics?from=2026-05-01&to=2026-05-31`

### 11.9 反馈管理

`GET /admin/feedback?status=pending&page=1&size=20`

### 11.10 回复反馈

`PUT /admin/feedback/:id/reply`

**请求参数：**

```json
{
  "reply": "感谢您的反馈，口语评分功能将在 v1.2 版本上线！"
}
```

### 11.11 题目审核

`GET /admin/questions?status=pending_review&page=1&size=20`

### 11.12 审核通过题目

`PUT /admin/questions/:id/approve`

### 11.13 驳回题目

`PUT /admin/questions/:id/reject`

---

## 十二、数据模型参考

详细数据库设计请参考 [技术设计文档](./design-spec.md) 和 `server/src/models/db-init.sql`。

**关键表：**
- `users` — 用户表（含 `membership` 字段）
- `user_stats` — 用户学习统计
- `questions` — 题库表
- `exam_records` — 考试记录
- `wrong_questions` — 错题本
- `orders` — 订单表
- `subscriptions` — 订阅表
- `ad_impressions` — 广告展示记录

---

*文档结束。*
