const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/user/dashboard - 仪表盘聚合数据
router.get('/dashboard', auth, async (req, res) => {
  try {
    const stats = (await db.query(
      `SELECT
        total_study_minutes, total_questions, correct_questions,
        reading_score, listening_score, speaking_score, writing_score,
        total_exams, avg_exam_score, streak_days, last_study_date,
        reading_progress, listening_progress, speaking_progress, writing_progress
      FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 今日学习分钟
    let todayMinutes = 0;
    try {
      const todayRes = await db.query(
        `SELECT COALESCE(SUM(time_spent), 0) as today_min
        FROM practice_records WHERE user_id = $1 AND created_at::date = $2`,
        [req.user.id, todayStr]
      );
      const examRes = await db.query(
        `SELECT COALESCE(SUM(time_spent), 0) as today_min
        FROM exam_records WHERE user_id = $1 AND created_at::date = $2`,
        [req.user.id, todayStr]
      );
      todayMinutes = Math.round(((todayRes.rows[0]?.today_min || 0) + (examRes.rows[0]?.today_min || 0)) / 60);
    } catch (e) { /* ignore */ }

    // 进度百分比
    const progress = {};
    const subKeys = ['reading', 'listening', 'speaking', 'writing'];
    if (stats) {
      for (const key of subKeys) {
        const p = stats[key + '_progress'];
        if (p && typeof p === 'object' && p.total > 0) {
          progress[key] = Math.round((p.correct / p.total) * 100);
        } else {
          progress[key] = 0;
        }
      }
    } else {
      for (const key of subKeys) progress[key] = 0;
    }

    res.json({
      code: 200,
      data: {
        stats: {
          todayMinutes: todayMinutes || (stats?.last_study_date === todayStr ? Math.round((stats?.total_study_minutes || 0) / 30) : 0),
          totalQuestions: stats?.total_questions || 0,
          accuracy: stats && stats.total_questions > 0
            ? Math.round((stats.correct_questions / stats.total_questions) * 100)
            : 0,
          avgExamScore: stats?.avg_exam_score || 0,
          streakDays: stats?.streak_days || 0,
        },
        progress,
      },
    });
  } catch (err) {
    console.error('[User] 获取仪表盘数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/user/profile - 获取个人信息
router.get('/profile', auth, async (req, res) => {
  try {
    const user = (await db.query(
      'SELECT id, nickname, avatar_url, target_score, exam_date, current_level, membership, created_at FROM users WHERE id = $1',
      [req.user.id]
    )).rows[0];

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({
      code: 200,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        targetScore: user.target_score,
        examDate: user.exam_date,
        currentLevel: user.current_level,
        membership: user.membership || 'free',
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('[User] 获取个人信息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// PUT /api/user/profile - 更新个人信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, avatarUrl, targetScore, examDate, level } = req.body;

    const result = await db.query(
      `UPDATE users SET
        nickname = COALESCE($2, nickname),
        avatar_url = COALESCE($3, avatar_url),
        target_score = COALESCE($4, target_score),
        exam_date = COALESCE($5, exam_date),
        current_level = COALESCE($6, current_level),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, nickname, avatar_url, target_score, exam_date, membership`,
      [req.user.id, nickname, avatarUrl, targetScore, examDate, level]
    );

    res.json({
      code: 200,
      data: {
        id: result.rows[0].id,
        nickname: result.rows[0].nickname,
        avatarUrl: result.rows[0].avatar_url,
        targetScore: result.rows[0].target_score,
        examDate: result.rows[0].exam_date,
        membership: result.rows[0].membership || 'free',
      },
    });
  } catch (err) {
    console.error('[User] 更新个人信息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/user/usage-limit - 获取今日剩余免费额度
router.get('/usage-limit', auth, async (req, res) => {
  try {
    const membershipService = require('../services/membershipService');
    const quota = await membershipService.getRemainingQuota(req.user.id);
    res.json({ code: 200, data: quota });
  } catch (err) {
    console.error('[User] 获取额度失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/user/stats - 获取学习统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = (await db.query(
      `SELECT
        total_study_minutes, total_questions, correct_questions,
        reading_score, listening_score, speaking_score, writing_score,
        total_exams, avg_exam_score, streak_days, last_study_date
      FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    if (!stats) {
      return res.json({
        code: 200,
        data: {
          totalStudyMinutes: 0,
          totalQuestions: 0,
          correctQuestions: 0,
          accuracy: 0,
          scores: { reading: 0, listening: 0, speaking: 0, writing: 0 },
          totalExams: 0,
          avgExamScore: 0,
          streakDays: 0,
        },
      });
    }

    const accuracy = stats.total_questions > 0
      ? Math.round((stats.correct_questions / stats.total_questions) * 100)
      : 0;

    res.json({
      code: 200,
      data: {
        totalStudyMinutes: stats.total_study_minutes,
        totalQuestions: stats.total_questions,
        correctQuestions: stats.correct_questions,
        accuracy,
        scores: {
          reading: stats.reading_score,
          listening: stats.listening_score,
          speaking: stats.speaking_score,
          writing: stats.writing_score,
        },
        totalExams: stats.total_exams,
        avgExamScore: stats.avg_exam_score,
        streakDays: stats.streak_days,
        lastStudyDate: stats.last_study_date,
      },
    });
  } catch (err) {
    console.error('[User] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;