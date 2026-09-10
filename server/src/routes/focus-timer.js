const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 可选择的专注时长（分钟）
const DURATIONS = [10, 15, 20, 25, 30, 45, 60];

// 树类型按连续完成次数递增
const TREE_TYPES = [
  { name: '树苗', icon: '🌱', minSessions: 0 },
  { name: '小花', icon: '🌸', minSessions: 5 },
  { name: '小树', icon: '🌳', minSessions: 15 },
  { name: '桃树', icon: '🍑', minSessions: 30 },
  { name: '银杏', icon: '🌿', minSessions: 50 },
  { name: '樱花', icon: '🌺', minSessions: 100 },
  { name: '神树', icon: '✨', minSessions: 200 },
];

/**
 * GET /api/focus-timer/options
 * 获取专注选项（时长选择 + 当前树类型）
 */
router.get('/options', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT total_focus_sessions, focus_minutes FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );
    const sessionCount = parseInt(stats.rows[0]?.total_focus_sessions || 0);
    const treeIndex = Math.min(
      TREE_TYPES.length - 1,
      TREE_TYPES.findIndex(t => t.minSessions > sessionCount) - 1
    );
    const currentTree = TREE_TYPES[Math.max(0, treeIndex)];

    res.json({
      code: 200,
      data: {
        durations: DURATIONS,
        currentTree,
        totalSessions: sessionCount,
      },
    });
  } catch (err) {
    console.error('[FocusTimer] 获取选项失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/focus-timer/start
 * 开始一次专注
 */
router.post('/start', auth, async (req, res) => {
  try {
    const { duration } = req.body;
    if (!DURATIONS.includes(duration)) {
      return res.status(400).json({ code: 400, message: '无效的专注时长' });
    }

    // 检查是否已有进行中的专注
    const existing = await db.query(
      `SELECT * FROM focus_sessions WHERE user_id = $1 AND completed = FALSE AND finished_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.json({
        code: 200,
        data: {
          alreadyStarted: true,
          session: existing.rows[0],
        },
      });
    }

    const session = await db.query(
      `INSERT INTO focus_sessions (user_id, duration, completed, tree_type)
       VALUES ($1, $2, FALSE, NULL)
       RETURNING id, user_id, duration, started_at, completed, finished_at`,
      [req.user.id, duration]
    );

    res.json({
      code: 200,
      data: session.rows[0],
    });
  } catch (err) {
    console.error('[FocusTimer] 开始专注失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/focus-timer/:sessionId/complete
 * 完成一次专注
 */
router.post('/:sessionId/complete', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await db.query(
      `SELECT * FROM focus_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, req.user.id]
    );

    if (!session.rows.length) {
      return res.status(404).json({ code: 404, message: '专注会话不存在' });
    }

    if (session.rows[0].completed) {
      return res.json({
        code: 200,
        data: { alreadyCompleted: true, session: session.rows[0] },
      });
    }

    const actualMinutes = Math.round(
      (Date.now() - new Date(session.rows[0].started_at).getTime()) / 60000
    );

    // 更新会话
    const completed = await db.query(
      `UPDATE focus_sessions
       SET completed = TRUE, finished_at = CURRENT_TIMESTAMP, actual_minutes = $3
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sessionId, req.user.id, actualMinutes]
    );

    // 更新用户统计
    await db.query(
      `UPDATE user_stats
       SET focus_minutes = COALESCE(focus_minutes, 0) + $2,
           total_focus_sessions = COALESCE(total_focus_sessions, 0) + 1,
           total_study_minutes = COALESCE(total_study_minutes, 0) + $2
       WHERE user_id = $1`,
      [req.user.id, actualMinutes]
    );

    // 获取新树类型
    const stats = await db.query(
      `SELECT total_focus_sessions FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );
    const sessionCount = parseInt(stats.rows[0]?.total_focus_sessions || 0);
    const treeIndex = Math.min(
      TREE_TYPES.length - 1,
      TREE_TYPES.findIndex(t => t.minSessions > sessionCount) - 1
    );
    const newTree = TREE_TYPES[Math.max(0, treeIndex)];

    // 检查是否解锁新树
    const prevTreeIndex = Math.min(
      TREE_TYPES.length - 1,
      TREE_TYPES.findIndex(t => t.minSessions > sessionCount - 1) - 1
    );
    const unlockedNewTree = newTree.minSessions > (prevTreeIndex >= 0 ? TREE_TYPES[prevTreeIndex].minSessions : 0);

    // 奖励 XP
    const xpReward = Math.round(actualMinutes * 1.5);
    await db.query(
      `UPDATE user_stats SET xp_points = COALESCE(xp_points, 0) + $2 WHERE user_id = $1`,
      [req.user.id, xpReward]
    );

    res.json({
      code: 200,
      data: {
        session: completed.rows[0],
        actualMinutes,
        xpReward,
        treeUnlocked: unlockedNewTree,
        currentTree: newTree,
      },
    });
  } catch (err) {
    console.error('[FocusTimer] 完成专注失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/focus-timer/:sessionId/abort
 * 取消/放弃专注
 */
router.post('/:sessionId/abort', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    await db.query(
      `UPDATE focus_sessions
       SET completed = TRUE, finished_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND completed = FALSE`,
      [sessionId, req.user.id]
    );

    res.json({ code: 200, data: { aborted: true } });
  } catch (err) {
    console.error('[FocusTimer] 取消专注失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/focus-timer/history
 * 获取历史专注记录
 */
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, duration, actual_minutes, completed, created_at, finished_at
       FROM focus_sessions
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const history = result.rows.map(r => ({
      id: r.id,
      duration: r.duration,
      actualMinutes: r.actual_minutes || 0,
      completed: r.completed,
      createdAt: r.created_at,
      finishedAt: r.finished_at,
    }));

    res.json({ code: 200, data: history });
  } catch (err) {
    console.error('[FocusTimer] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/focus-timer/stats
 * 获取专注统计
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0) as totalSessions,
        COALESCE(SUM(actual_minutes), 0) as totalMinutes,
        COALESCE(AVG(CASE WHEN completed THEN actual_minutes ELSE NULL END), 0) as avgDuration
       FROM focus_sessions
       WHERE user_id = $1`,
      [req.user.id]
    );

    const row = stats.rows[0];

    res.json({
      code: 200,
      data: {
        totalSessions: parseInt(row?.totalSessions || 0),
        totalMinutes: parseInt(row?.totalMinutes || 0),
        avgDuration: Math.round(row?.avgDuration || 0),
      },
    });
  } catch (err) {
    console.error('[FocusTimer] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
