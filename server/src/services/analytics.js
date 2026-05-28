const db = require('../config/db');

/**
 * 数据埋点事件记录服务
 * 用于记录用户行为数据，支持后续数据分析
 */

/**
 * 记录使用事件
 * @param {number} userId - 用户ID
 * @param {string} eventType - 事件类型
 * @param {Object} eventData - 事件数据
 * @param {number} duration - 持续时间（秒）
 * @param {string} pagePath - 页面路径
 * @returns {Promise<number>} 事件ID
 */
async function recordEvent(userId, eventType, eventData = {}, duration = 0, pagePath = '') {
  try {
    const result = await db.query(
      `INSERT INTO usage_events (user_id, event_type, event_data, duration, page_path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [userId, eventType, JSON.stringify(eventData), duration, pagePath]
    );
    return result.rows[0].id;
  } catch (err) {
    console.error('[Analytics] 记录事件失败:', err.message);
    return null;
  }
}

// 预定义事件类型
const EventTypes = {
  // 页面访问
  PAGE_VIEW: 'page_view',

  // 练习相关
  PRACTICE_START: 'practice_start',
  PRACTICE_COMPLETE: 'practice_complete',
  PRACTICE_PAUSE: 'practice_pause',
  PRACTICE_RESUME: 'practice_resume',

  // 题目相关
  QUESTION_VIEW: 'question_view',
  QUESTION_ANSWER: 'question_answer',
  QUESTION_CORRECT: 'question_correct',
  QUESTION_WRONG: 'question_wrong',
  QUESTION_SKIP: 'question_skip',

  // 考试相关
  EXAM_START: 'exam_start',
  EXAM_COMPLETE: 'exam_complete',

  // AI对话
  AI_TALK_START: 'ai_talk_start',
  AI_TALK_SEND: 'ai_talk_send',
  AI_TALK_END: 'ai_talk_end',

  // 学习计划
  PLAN_CREATE: 'plan_create',
  TASK_COMPLETE: 'task_complete',
  TASK_REMOVE: 'task_remove',

  // 通用
  LOGIN: 'login',
  FEEDBACK_SUBMIT: 'feedback_submit',
  UPLOAD: 'upload',
  ERROR: 'error',
};

/**
 * 获取用户活跃时长统计
 * @param {number} userId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Object>}
 */
async function getUserActivityStats(userId, startDate, endDate) {
  const result = await db.query(
    `SELECT
      DATE(created_at) as date,
      COUNT(*) as event_count,
      COALESCE(SUM(duration), 0) as total_duration
    FROM usage_events
    WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3
    GROUP BY DATE(created_at)
    ORDER BY date`,
    [userId, startDate, endDate]
  );

  return result.rows;
}

/**
 * 获取页面访问分析
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Object>}
 */
async function getPageAnalytics(startDate, endDate) {
  const result = await db.query(
    `SELECT
      page_path,
      COUNT(*) as view_count,
      COUNT(DISTINCT user_id) as unique_visitors
    FROM usage_events
    WHERE event_type = $1 AND created_at::date BETWEEN $2 AND $3
    GROUP BY page_path
    ORDER BY view_count DESC`,
    [EventTypes.PAGE_VIEW, startDate, endDate]
  );

  return result.rows;
}

module.exports = { recordEvent, EventTypes, getUserActivityStats, getPageAnalytics };