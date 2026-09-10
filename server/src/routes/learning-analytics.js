const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/learning-analytics/overview - 获取学习概览
router.get('/overview', auth, async (req, res) => {
  try {
    // 获取总学习时长
    const studyTime = await db.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM study_sessions 
       WHERE user_id = $1`,
      [req.user.id]
    );

    // 获取各科目练习统计
    const subjectStats = await db.query(
      `SELECT subject, 
              COUNT(*) as session_count,
              AVG(score) as avg_score,
              MIN(score) as min_score,
              MAX(score) as max_score
       FROM practice_results 
       WHERE user_id = $1
       GROUP BY subject
       ORDER BY session_count DESC`,
      [req.user.id]
    );

    // 获取最近 30 天学习曲线
    const studyCurve = await db.query(
      `SELECT DATE(created_at) as study_date,
              COUNT(*) as sessions,
              SUM(duration_minutes) as minutes
       FROM study_sessions
       WHERE user_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY study_date`,
      [req.user.id]
    );

    // 获取词汇增长趋势
    const vocabGrowth = await db.query(
      `SELECT DATE(created_at) as date,
              COALESCE(word_count, 0) as words
       FROM daily_vocab_stats
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        totalStudyMinutes: parseInt(studyTime.rows[0].total_minutes),
        subjectStats: subjectStats.rows,
        studyCurve: studyCurve.rows,
        vocabGrowth: vocabGrowth.rows.reverse(),
      },
    });
  } catch (err) {
    console.error('[LearningAnalytics] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/learning-analytics/weekly-report - 获取周报
router.get('/weekly-report', auth, async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekStats = await db.query(
      `SELECT COUNT(*) as total_sessions,
              COALESCE(SUM(duration_minutes), 0) as total_minutes,
              AVG(score) as avg_score
       FROM study_sessions
       WHERE user_id = $1
       AND created_at >= $2`,
      [req.user.id, startOfWeek]
    );

    const subjectBreakdown = await db.query(
      `SELECT subject,
              COUNT(*) as sessions,
              AVG(score) as avg_score
       FROM study_sessions
       WHERE user_id = $1
       AND created_at >= $2
       GROUP BY subject`,
      [req.user.id, startOfWeek]
    );

    // 与上周对比
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekStats = await db.query(
      `SELECT COUNT(*) as total_sessions
       FROM study_sessions
       WHERE user_id = $1
       AND created_at >= $2
       AND created_at < $3`,
      [req.user.id, lastWeekStart, startOfWeek]
    );

    const currentSessions = parseInt(weekStats.rows[0].total_sessions) || 0;
    const lastSessions = parseInt(lastWeekStats.rows[0].total_sessions) || 0;
    const weekChange = lastSessions > 0 
      ? Math.round(((currentSessions - lastSessions) / lastSessions) * 100)
      : 0;

    res.json({
      code: 200,
      data: {
        currentWeek: {
          sessions: currentSessions,
          minutes: parseInt(weekStats.rows[0].total_minutes),
          avgScore: weekStats.rows[0].avg_score,
        },
        lastWeek: {
          sessions: lastSessions,
        },
        weekChange,
        subjectBreakdown: subjectBreakdown.rows,
        trend: weekChange >= 10 ? 'up' : weekChange <= -10 ? 'down' : 'stable',
      },
    });
  } catch (err) {
    console.error('[LearningAnalytics] Weekly Report Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/learning-analytics/skill-map - 获取技能掌握地图
router.get('/skill-map', auth, async (req, res) => {
  try {
    const skills = [
      { id: 'reading-speed', name: '阅读速度', category: 'reading', level: 65, maxLevel: 100 },
      { id: 'reading-vocab', name: '阅读词汇', category: 'reading', level: 58, maxLevel: 100 },
      { id: 'reading-inference', name: '推理能力', category: 'reading', level: 42, maxLevel: 100 },
      { id: 'listening-detail', name: '听力细节捕捉', category: 'listening', level: 72, maxLevel: 100 },
      { id: 'listening-gist', name: '听力主旨理解', category: 'listening', level: 68, maxLevel: 100 },
      { id: 'listening-note', name: '听力笔记', category: 'listening', level: 55, maxLevel: 100 },
      { id: 'speaking-fluency', name: '口语流利度', category: 'speaking', level: 60, maxLevel: 100 },
      { id: 'speaking-pronunciation', name: '口语发音', category: 'speaking', level: 75, maxLevel: 100 },
      { id: 'writing-grammar', name: '写作语法', category: 'writing', level: 70, maxLevel: 100 },
      { id: 'writing-structure', name: '写作结构', category: 'writing', level: 52, maxLevel: 100 },
      { id: 'writing-vocab', name: '写作词汇', category: 'writing', level: 48, maxLevel: 100 },
    ];

    res.json({
      code: 200,
      data: { skills },
    });
  } catch (err) {
    console.error('[LearningAnalytics] Skill Map Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
