const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * GET /api/study-heatmap
 * 获取 GitHub 风格的学习热力图
 */
router.get('/', auth, async (req, res) => {
  try {
    // 获取最近一年（365天）的学习数据
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    const startStr = startDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // 从练习记录获取每日学习时长
    const result = await db.query(
      `SELECT 
        created_at::date as study_date,
        SUM(time_spent) as total_minutes
       FROM practice_records
       WHERE user_id = $1 AND created_at::date >= $2 AND created_at::date <= $3
       GROUP BY created_at::date
       UNION ALL
       SELECT 
        created_at::date as study_date,
        SUM(time_spent) as total_minutes
       FROM exam_records
       WHERE user_id = $1 AND created_at::date >= $2 AND created_at::date <= $3
       GROUP BY created_at::date
       ORDER BY study_date`,
      [req.user.id, startStr, todayStr]
    );

    // 从专注会话获取专注时长
    const focusResult = await db.query(
      `SELECT 
        created_at::date as study_date,
        SUM(actual_minutes) as total_minutes
       FROM focus_sessions
       WHERE user_id = $1 AND completed = TRUE
         AND created_at::date >= $2 AND created_at::date <= $3
       GROUP BY created_at::date`,
      [req.user.id, startStr, todayStr]
    );

    // 合并数据
    const dateMap = new Map();

    for (const r of result.rows) {
      const d = r.study_date;
      dateMap.set(d, (dateMap.get(d) || 0) + (parseInt(r.total_minutes) || 0));
    }

    for (const r of focusResult.rows) {
      const d = r.study_date;
      dateMap.set(d, (dateMap.get(d) || 0) + (parseInt(r.total_minutes) || 0));
    }

    // 生成 52 周 × 7 天的数据
    const days = [];
    let current = new Date(startDate);
    while (current <= new Date(todayStr)) {
      const dateStr = current.toISOString().split('T')[0];
      const minutes = dateMap.get(dateStr) || 0;
      days.push({
        date: dateStr,
        minutes,
        count: minutes > 0 ? 1 : 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // 计算统计信息
    const totalDays = days.length;
    const studyDays = days.filter(d => d.minutes > 0).length;
    const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0);
    const avgMinutes = studyDays > 0 ? Math.round(totalMinutes / studyDays) : 0;
    const maxMinutes = days.length > 0 ? Math.max(...days.map(d => d.minutes)) : 0;

    // 计算最长连续学习天数
    let longestStreak = 0;
    let currentStreak = 0;
    for (const d of days) {
      if (d.minutes > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // 最近 7 天
    const recent7 = days.slice(-7).map(d => ({
      date: d.date,
      minutes: d.minutes,
      isToday: d.date === todayStr,
    }));

    res.json({
      code: 200,
      data: {
        days,
        stats: {
          totalDays,
          studyDays,
          totalMinutes,
          avgMinutes,
          maxMinutes,
          longestStreak,
        },
        recent7,
      },
    });
  } catch (err) {
    console.error('[StudyHeatmap] 获取失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/study-heatmap/week
 * 获取周视图详细数据
 */
router.get('/week', auth, async (req, res) => {
  try {
    const week = parseInt(req.query.week) || 0;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (week * 7) - 6);
    const endDate = new Date();
    startDate.setDate(startDate.getDate() - (week * 7));

    const result = await db.query(
      `SELECT subject, COUNT(*) as count,
              AVG(score) as avg_score,
              SUM(time_spent) as total_time
       FROM practice_records
       WHERE user_id = $1 AND created_at::date >= $2 AND created_at::date <= $3
       GROUP BY subject`,
      [req.user.id, startDate.toISOString(), endDate.toISOString()]
    );

    res.json({
      code: 200,
      data: result.rows,
    });
  } catch (err) {
    console.error('[StudyHeatmap] 获取周数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
