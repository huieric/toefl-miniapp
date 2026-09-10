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

    const xp = (await db.query(
      'SELECT xp_points FROM user_stats WHERE user_id = $1',
      [req.user.id]
    )).rows[0];

    const level = xp ? Math.max(1, Math.floor(Math.log2(xp.xp_points / 100 + 1)) + 1) : 1;

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
        xpPoints: xp?.xp_points || 0,
        level,
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

// POST /api/user/update-study - 更新学习统计（自动处理 Streak）
router.post('/update-study', auth, async (req, res) => {
  try {
    const { minutes = 1, action } = req.body || {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 获取当前 stats
    const existing = (await db.query(
      `SELECT streak_days, last_study_date FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    let newStreak = 0;
    let lastDate = todayStr;

    if (existing) {
      const lastDateStr = existing.last_study_date ? new Date(existing.last_study_date).toISOString().split('T')[0] : null;
      if (lastDateStr === todayStr) {
        // 今天已打卡，只更新分钟
        newStreak = existing.streak_days || 0;
        lastDate = todayStr;
      } else if (lastDateStr === yesterdayStr || !lastDateStr) {
        // 昨天打的或首次学习
        newStreak = existing.streak_days ? existing.streak_days + 1 : 1;
        lastDate = todayStr;
      } else {
        // 断了，重置为 1
        newStreak = 1;
        lastDate = todayStr;
      }

      await db.query(
        `UPDATE user_stats SET
          total_study_minutes = COALESCE(total_study_minutes, 0) + $2,
          total_questions = COALESCE(total_questions, 0) + 1,
          streak_days = $3,
          last_study_date = $4,
          xp_points = COALESCE(xp_points, 0) + 5,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1`,
        [req.user.id, minutes, newStreak, lastDate]
      );
    } else {
      // 首次学习
      newStreak = 1;
      await db.query(
        `INSERT INTO user_stats (user_id, total_study_minutes, total_questions, streak_days, last_study_date, xp_points)
         VALUES ($1, $2, 1, $3, $4, 5)`,
        [req.user.id, minutes, newStreak, lastDate]
      );
    }

    res.json({
      code: 200,
      data: {
        minutesAdded: minutes,
        streakDays: newStreak,
        action,
      },
    });
  } catch (err) {
    console.error('[User] 更新学习统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/user/streak - 获取 Streak 详情
router.get('/streak', auth, async (req, res) => {
  try {
    const stats = (await db.query(
      `SELECT streak_days, last_study_date, xp_points FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastDateStr = stats?.last_study_date ? new Date(stats.last_study_date).toISOString().split('T')[0] : null;
    const isTodayChecked = lastDateStr === todayStr;
    const isYesterdayChecked = lastDateStr === yesterdayStr;
    const isStreakActive = stats?.streak_days > 0;

    // 生成未来7天打卡日历
    const weekCalendar = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      weekCalendar.push({
        date: ds,
        checked: ds === lastDateStr,
        isToday: ds === todayStr,
        isFuture: false,
      });
    }

    res.json({
      code: 200,
      data: {
        streakDays: stats?.streak_days || 0,
        xpPoints: stats?.xp_points || 0,
        isTodayChecked,
        isYesterdayChecked,
        isStreakActive,
        lastStudyDate: lastDateStr,
        weekCalendar: weekCalendar.reverse(),
      },
    });
  } catch (err) {
    console.error('[User] 获取 Streak 失败:', err);
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

// GET /api/user/weekly-report — 学习周报（近7天数据）
router.get('/weekly-report', auth, async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    // 近7天每日学习时长（分钟）
    const minutesRes = await db.query(
      `SELECT 
        created_at::date as day,
        COALESCE(SUM(time_spent), 0) as minutes
      FROM practice_records
      WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3
      GROUP BY created_at::date
      ORDER BY day`,
      [req.user.id, startStr, endStr]
    );

    // 近7天每日做题数
    const questionsRes = await db.query(
      `SELECT 
        created_at::date as day,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
      FROM practice_records
      WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3
      GROUP BY created_at::date
      ORDER BY day`,
      [req.user.id, startStr, endStr]
    );

    // 各科目本周数据
    const subjectRes = await db.query(
      `SELECT 
        subject,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
        COALESCE(AVG(time_spent), 0) as avg_time
      FROM practice_records
      WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3
      GROUP BY subject`,
      [req.user.id, startStr, endStr]
    );

    // 考试本周数据
    const examRes = await db.query(
      `SELECT 
        COUNT(*) as total_exams,
        COALESCE(AVG(total_score), 0) as avg_score,
        COALESCE(SUM(time_spent), 0) as total_exam_time
      FROM exam_records
      WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3`,
      [req.user.id, startStr, endStr]
    );

    // 生词本周新增
    const vocabRes = await db.query(
      `SELECT COUNT(*) as new_words
       FROM vocabulary
       WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3`,
      [req.user.id, startStr, endStr]
    );

    // 构建7天日历数据
    const weekDays = [];
    const daysMap = {};
    minutesRes.rows.forEach(r => { daysMap[r.day] = { minutes: parseInt(r.minutes) }; });
    questionsRes.rows.forEach(r => {
      if (!daysMap[r.day]) daysMap[r.day] = {};
      daysMap[r.day].questions = parseInt(r.total);
      daysMap[r.day].correct = parseInt(r.correct);
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const label = i === 0 ? '今天' : i === 1 ? '昨天' : d.toLocaleDateString('zh-CN', { weekday: 'short' });
      weekDays.push({
        label,
        date: ds,
        minutes: daysMap[ds]?.minutes || 0,
        questions: daysMap[ds]?.questions || 0,
        correct: daysMap[ds]?.correct || 0,
      });
    }

    const subjectStats = subjectRes.rows.map(s => ({
      subject: s.subject,
      total: parseInt(s.total),
      correct: parseInt(s.correct),
      accuracy: s.total > 0 ? Math.round((parseInt(s.correct) / parseInt(s.total)) * 100) : 0,
      avgTime: Math.round(parseInt(s.avg_time)),
    }));

    res.json({
      code: 200,
      data: {
        weekDays,
        subjectStats,
        weeklySummary: {
          totalMinutes: weekDays.reduce((sum, d) => sum + d.minutes, 0),
          totalQuestions: weekDays.reduce((sum, d) => sum + d.questions, 0),
          totalCorrect: weekDays.reduce((sum, d) => sum + d.correct, 0),
          avgAccuracy: weekDays.reduce((sum, d) => sum + (d.questions > 0 ? Math.round((d.correct / d.questions) * 100) : 0), 0) / 7,
          newVocab: parseInt(vocabRes.rows[0]?.new_words || 0),
          totalExams: parseInt(examRes.rows[0]?.total_exams || 0),
          avgExamScore: parseFloat(examRes.rows[0]?.avg_score || 0),
        },
      },
    });
  } catch (err) {
    console.error('[User] 获取学习周报失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;