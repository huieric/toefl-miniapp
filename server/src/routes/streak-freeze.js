const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * GET /api/streak-freeze
 * 获取 Streak Freeze 状态
 */
router.get('/', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT streak_days, streak_freeze_count, last_study_date FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );

    const row = stats.rows[0] || {};
    const freezeCount = parseInt(row?.streak_freeze_count || 0);
    const streakDays = parseInt(row?.streak_days || 0);
    const lastDateStr = row?.last_study_date ? new Date(row.last_study_date).toISOString().split('T')[0] : null;
    const todayStr = new Date().toISOString().split('T')[0];
    const isStreakAtRisk = streakDays >= 1 && lastDateStr !== todayStr;

    // 计算下一个可获得的 Freeze（连续打卡 3 天）
    const nextFreezeGoal = Math.ceil(streakDays / 3) * 3;
    const progressToNext = Math.min(streakDays / nextFreezeGoal, 1) * 100;

    res.json({
      code: 200,
      data: {
        freezeCount,
        streakDays,
        isStreakAtRisk,
        progressToNextFreeze: Math.round(progressToNext),
        nextFreezeGoal,
        freezeEarned: Math.floor(streakDays / 3),
      },
    });
  } catch (err) {
    console.error('[StreakFreeze] 获取状态失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/streak-freeze/use
 * 使用一个 Streak Freeze 保护连续打卡
 */
router.post('/use', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT streak_freeze_count, streak_days FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );

    const row = stats.rows[0];
    const freezeCount = parseInt(row?.streak_freeze_count || 0);

    if (freezeCount <= 0) {
      return res.status(400).json({ code: 400, message: '没有可用的 Streak Freeze' });
    }

    // 扣除一个 Freeze
    await db.query(
      `UPDATE user_stats SET streak_freeze_count = GREATEST(streak_freeze_count - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [req.user.id]
    );

    // 记录使用
    await db.query(
      `INSERT INTO streak_freezes (user_id, action, source) VALUES ($1, 'use', 'manual')`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        remainingFreezes: freezeCount - 1,
        message: 'Streak Freeze 已使用，连续打卡已保护！',
      },
    });
  } catch (err) {
    console.error('[StreakFreeze] 使用 Freeze 失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/streak-freeze/earn
 * 通过完成每日任务获得 Streak Freeze（每日最多 1 个）
 */
router.post('/earn', auth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 检查今天是否已经获得
    const alreadyEarned = await db.query(
      `SELECT COUNT(*) as cnt FROM streak_freezes 
       WHERE user_id = $1 AND action = 'earn' AND source = 'daily_task' 
       AND created_at::date = $2`,
      [req.user.id, todayStr]
    );

    if (parseInt(alreadyEarned.rows[0]?.cnt || 0) > 0) {
      return res.json({
        code: 200,
        data: { alreadyEarned: true },
      });
    }

    // 获得 Freeze
    await db.query(
      `UPDATE user_stats SET streak_freeze_count = COALESCE(streak_freeze_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [req.user.id]
    );

    // 记录获得
    await db.query(
      `INSERT INTO streak_freezes (user_id, action, source) VALUES ($1, 'earn', 'daily_task')`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { earned: true, message: '完成每日任务，获得 1 个 Streak Freeze！🛡️' },
    });
  } catch (err) {
    console.error('[StreakFreeze] 获得 Freeze 失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/streak-freeze/history
 * 获取 Streak Freeze 历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT action, source, created_at FROM streak_freezes 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: result.rows.map(r => ({
        action: r.action,
        source: r.source,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[StreakFreeze] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
