const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * GET /api/focus-session/timeline
 * 获取专注会话时间线（按时间倒序排列，带聚合统计）
 */
router.get('/timeline', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;

    // 获取会话列表
    const result = await db.query(
      `SELECT id, duration, actual_minutes, completed, created_at, finished_at
       FROM focus_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // 获取聚合统计
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_sessions,
        COALESCE(SUM(actual_minutes), 0) as total_minutes,
        COALESCE(AVG(actual_minutes), 0) as avg_minutes,
        MAX(created_at) as last_session_at
       FROM focus_sessions
       WHERE user_id = $1`,
      [req.user.id]
    );

    // 获取本周统计
    const weekResult = await db.query(
      `SELECT 
        COUNT(*) as sessions,
        COALESCE(SUM(actual_minutes), 0) as minutes
       FROM focus_sessions
       WHERE user_id = $1 
         AND completed = TRUE
         AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`,
      [req.user.id]
    );

    // 获取每日趋势（最近 7 天）
    const trendResult = await db.query(
      `SELECT 
        created_at::date as session_date,
        COUNT(*) as sessions,
        SUM(actual_minutes) as minutes
       FROM focus_sessions
       WHERE user_id = $1 
         AND created_at::date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY created_at::date
       ORDER BY session_date`,
      [req.user.id]
    );

    // 获取树种等级（Forest 升级系统）
    const totalCompleted = statsResult.rows[0]?.completed_sessions || 0;
    const treeLevel = getTreeLevel(totalCompleted);

    // 格式化会话列表
    const sessions = result.rows.map(s => ({
      id: s.id,
      duration: parseInt(s.duration),
      actualMinutes: parseInt(s.actual_minutes),
      completed: s.completed,
      createdAt: s.created_at,
      finishedAt: s.finished_at,
      date: new Date(s.created_at).toLocaleDateString('zh-CN'),
      time: new Date(s.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isToday: s.created_at.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    }));

    res.json({
      code: 200,
      data: {
        sessions,
        total: result.rows.length,
        hasMore: result.rows.length >= limit,
        stats: {
          ...statsResult.rows[0],
          avgMinutes: Math.round(statsResult.rows[0]?.avg_minutes || 0),
        },
        week: weekResult.rows[0] || { sessions: 0, minutes: 0 },
        trend: trendResult.rows.map(r => ({
          date: r.session_date,
          sessions: parseInt(r.sessions),
          minutes: parseInt(r.minutes),
        })),
        treeLevel,
      },
    });
  } catch (err) {
    console.error('[FocusSession] 获取时间线失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/focus-session/stats
 * 获取专注统计汇总
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_sessions,
        COALESCE(SUM(actual_minutes), 0) as total_minutes,
        COALESCE(AVG(actual_minutes), 0) as avg_minutes,
        MAX(created_at) as last_session_at
       FROM focus_sessions
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        ...result.rows[0],
        avgMinutes: Math.round(result.rows[0]?.avg_minutes || 0),
      },
    });
  } catch (err) {
    console.error('[FocusSession] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/focus-session/trees
 * 获取树种解锁信息
 */
router.get('/trees', auth, async (req, res) => {
  try {
    const statsResult = await db.query(
      `SELECT SUM(CASE WHEN completed THEN 1 ELSE 0 END) as total_completed
       FROM focus_sessions
       WHERE user_id = $1`,
      [req.user.id]
    );

    const totalCompleted = parseInt(statsResult.rows[0]?.total_completed || 0);
    const treeLevel = getTreeLevel(totalCompleted);

    // 所有树种配置
    const allTrees = [
      { id: 'seedling', name: '幼苗', icon: '🌱', required: 0, unlocked: totalCompleted >= 0 },
      { id: 'sprout', name: '小树苗', icon: '🌿', required: 10, unlocked: totalCompleted >= 10 },
      { id: 'sapling', name: '树苗', icon: '🌲', required: 30, unlocked: totalCompleted >= 30 },
      { id: 'tree', name: '大树', icon: '🌳', required: 60, unlocked: totalCompleted >= 60 },
      { id: 'ancient', name: '古树', icon: '🎄', required: 120, unlocked: totalCompleted >= 120 },
      { id: 'magic', name: '魔法树', icon: '✨', required: 200, unlocked: totalCompleted >= 200 },
      { id: 'gold', name: '黄金树', icon: '🌟', required: 500, unlocked: totalCompleted >= 500 },
    ];

    res.json({
      code: 200,
      data: {
        treeLevel,
        allTrees,
        nextTree: allTrees.find(t => !t.unlocked) || null,
      },
    });
  } catch (err) {
    console.error('[FocusSession] 获取树种失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * 根据完成的会话数获取树种等级
 */
function getTreeLevel(completed) {
  if (completed >= 500) return { level: 6, name: '黄金树', icon: '🌟' };
  if (completed >= 200) return { level: 5, name: '魔法树', icon: '✨' };
  if (completed >= 120) return { level: 4, name: '古树', icon: '🎄' };
  if (completed >= 60) return { level: 3, name: '大树', icon: '🌳' };
  if (completed >= 30) return { level: 2, name: '树苗', icon: '🌲' };
  if (completed >= 10) return { level: 1, name: '小树苗', icon: '🌿' };
  return { level: 0, name: '幼苗', icon: '🌱' };
}

module.exports = router;
