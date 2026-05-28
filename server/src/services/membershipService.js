/**
 * 会员服务
 * 处理会员权限检查、额度计算、订阅状态管理
 */
const db = require('../config/db');

const FREE_LIMITS = {
  dailyQuestions: 20,      // 每日免费做题数
  dailyAiTalkMinutes: 10,  // 每日免费AI陪练分钟数
  dailyMockExams: 0,       // 每日免费模考次数(0 = 会员专享)
};

/**
 * 检查用户会员状态
 */
async function getUserMembership(userId) {
  const result = await db.query(
    `SELECT membership, level, target_score, exam_date FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw new Error('用户不存在');
  }
  return {
    membership: result.rows[0].membership || 'free',
    level: result.rows[0].level || 'beginner',
    targetScore: result.rows[0].target_score,
    examDate: result.rows[0].exam_date,
  };
}

/**
 * 获取用户当日使用额度
 */
async function getDailyUsage(userId) {
  const today = new Date().toISOString().split('T')[0];

  const [questionsResult, aiTalkResult, examResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int as count FROM exam_records
       WHERE user_id = $1 AND created_at::date = $2 AND status = 'completed'`,
      [userId, today]
    ),
    db.query(
      `SELECT COALESCE(SUM(duration), 0)::int as total_minutes FROM ai_conversations
       WHERE user_id = $1 AND started_at::date = $2 AND status = 'completed'`,
      [userId, today]
    ),
    db.query(
      `SELECT COUNT(*)::int as count FROM exam_records
       WHERE user_id = $1 AND created_at::date = $2 AND exam_type = 'mock' AND status = 'completed'`,
      [userId, today]
    ),
  ]);

  return {
    questionsDone: questionsResult.rows[0].count,
    aiTalkMinutes: Math.round((aiTalkResult.rows[0].total_minutes || 0) / 60),
    mockExamsDone: examResult.rows[0].count,
  };
}

/**
 * 获取用户剩余免费额度
 */
async function getRemainingQuota(userId) {
  const membership = await getUserMembership(userId);
  const usage = await getDailyUsage(userId);

  // 会员无限
  if (membership.membership === 'premium') {
    return {
      membership: 'premium',
      isPremium: true,
      dailyQuestions: { used: usage.questionsDone, limit: Infinity, remaining: Infinity },
      dailyAiTalkMinutes: { used: usage.aiTalkMinutes, limit: Infinity, remaining: Infinity },
      dailyMockExams: { used: usage.mockExamsDone, limit: Infinity, remaining: Infinity },
    };
  }

  return {
    membership: 'free',
    isPremium: false,
    dailyQuestions: {
      used: usage.questionsDone,
      limit: FREE_LIMITS.dailyQuestions,
      remaining: Math.max(0, FREE_LIMITS.dailyQuestions - usage.questionsDone),
    },
    dailyAiTalkMinutes: {
      used: usage.aiTalkMinutes,
      limit: FREE_LIMITS.dailyAiTalkMinutes,
      remaining: Math.max(0, FREE_LIMITS.dailyAiTalkMinutes - usage.aiTalkMinutes),
    },
    dailyMockExams: {
      used: usage.mockExamsDone,
      limit: FREE_LIMITS.dailyMockExams,
      remaining: Math.max(0, FREE_LIMITS.dailyMockExams - usage.mockExamsDone),
    },
  };
}

/**
 * 检查用户是否有权限使用某个功能
 * @returns {{ allowed: boolean, reason?: string }}
 */
async function checkFeatureAccess(userId, feature) {
  const membership = await getUserMembership(userId);
  const usage = await getDailyUsage(userId);

  if (membership.membership === 'premium') {
    return { allowed: true };
  }

  switch (feature) {
    case 'question':
    case 'practice':
      if (usage.questionsDone >= FREE_LIMITS.dailyQuestions) {
        return { allowed: false, reason: `今日免费做题已达上限(${FREE_LIMITS.dailyQuestions}题)` };
      }
      break;
    case 'ai_talk':
      if (usage.aiTalkMinutes >= FREE_LIMITS.dailyAiTalkMinutes) {
        return { allowed: false, reason: `今日AI陪练时长已达上限(${FREE_LIMITS.dailyAiTalkMinutes}分钟)` };
      }
      break;
    case 'mock_exam':
      return { allowed: false, reason: '全真模拟为会员专属功能' };
    default:
      break;
  }

  return { allowed: true };
}

/**
 * 获取会员套餐列表
 */
function getPlanList() {
  return [
    {
      id: 'monthly',
      name: '月卡',
      price: 29.90,
      originalPrice: 49.90,
      durationDays: 30,
      features: [
        '无限题目练习',
        '无限AI陪练时长',
        '全真模拟考试',
        'AI评分 + 详细解析',
        '个性化学习计划',
      ],
      tag: '',
    },
    {
      id: 'quarterly',
      name: '季卡',
      price: 79.90,
      originalPrice: 149.70,
      durationDays: 90,
      features: [
        '月卡全部权益',
        '优先体验新功能',
        '每月学习报告',
      ],
      tag: '热销',
    },
    {
      id: 'yearly',
      name: '年卡',
      price: 299.00,
      originalPrice: 598.80,
      durationDays: 365,
      features: [
        '季卡全部权益',
        '专属学习顾问',
        '题库定制服务',
        '考试报名提醒',
      ],
      tag: '最值',
    },
  ];
}

/**
 * 获取用户有效订阅
 */
async function getActiveSubscription(userId) {
  const result = await db.query(
    `SELECT id, plan_type, start_date, end_date, status, auto_renew
     FROM subscriptions
     WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP
     ORDER BY end_date DESC LIMIT 1`,
    [userId]
  );
  if (!result.rows[0]) return null;

  const sub = result.rows[0];
  const remainingDays = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));

  return {
    id: sub.id,
    planType: sub.plan_type,
    startDate: sub.start_date,
    endDate: sub.end_date,
    status: sub.status,
    autoRenew: sub.auto_renew,
    remainingDays: Math.max(0, remainingDays),
  };
}

/**
 * 更新用户会员状态（付费成功后调用）
 */
async function activateMembership(userId, planType) {
  let durationDays;
  switch (planType) {
    case 'monthly': durationDays = 30; break;
    case 'quarterly': durationDays = 90; break;
    case 'yearly': durationDays = 365; break;
    default: durationDays = 30;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET membership = 'premium' WHERE id = $1`,
      [userId]
    );

    const subResult = await client.query(
      `INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, status, auto_renew)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${durationDays} days', 'active', FALSE)
       ON CONFLICT DO NOTHING
       RETURNING id, end_date`,
      [userId, planType]
    );

    await client.query('COMMIT');
    return subResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 取消订阅
 */
async function cancelSubscription(userId) {
  await db.query(
    `UPDATE subscriptions SET status = 'cancelled', auto_renew = FALSE
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
}

/**
 * 检查并处理过期订阅（定时任务）
 */
async function checkExpiredSubscriptions() {
  const expired = await db.query(
    `UPDATE subscriptions SET status = 'expired'
     WHERE status = 'active' AND end_date < CURRENT_TIMESTAMP
     RETURNING user_id`
  );

  for (const row of expired.rows) {
    // 检查用户是否还有其他有效订阅
    const activeSub = await db.query(
      `SELECT id FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP`,
      [row.user_id]
    );
    if (activeSub.rows.length === 0) {
      await db.query(
        `UPDATE users SET membership = 'free' WHERE id = $1`,
        [row.user_id]
      );
    }
  }

  return expired.rows.length;
}

module.exports = {
  FREE_LIMITS,
  getUserMembership,
  getDailyUsage,
  getRemainingQuota,
  checkFeatureAccess,
  getPlanList,
  getActiveSubscription,
  activateMembership,
  cancelSubscription,
  checkExpiredSubscriptions,
};
