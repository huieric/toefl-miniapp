const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * 速度阅读训练 API
 * 追踪阅读速度（WPM）、理解率和进步趋势
 */

/**
 * POST /api/speed-reading/start
 * 开始一次阅读训练
 */
router.post('/start', auth, async (req, res) => {
  try {
    const { passageId, subject, wordCount, title } = req.body || {};

    const result = await db.query(
      `INSERT INTO speed_reading_sessions 
       (user_id, passage_id, subject, word_count, title, status, started_at)
       VALUES ($1, $2, $3, $4, $5, 'in_progress', NOW())
       RETURNING id`,
      [req.user.id, passageId || null, subject || 'reading', wordCount || 0, title || '']
    );

    res.json({
      code: 200,
      data: { sessionId: result.rows[0].id },
    });
  } catch (err) {
    console.error('[SpeedReading] 开始训练失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/speed-reading/complete
 * 完成阅读训练，记录速度和理解率
 */
router.post('/complete', auth, async (req, res) => {
  try {
    const { sessionId, timeSpent, wordCount, comprehensionScore, title, passageId, subject } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ code: 400, message: '请提供会话ID' });
    }

    // 检查会话是否属于当前用户
    const checkResult = await db.query(
      'SELECT id, subject, word_count, title FROM speed_reading_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (!checkResult.rows.length) {
      return res.status(404).json({ code: 404, message: '会话不存在' });
    }

    const session = checkResult.rows[0];
    const actualWordCount = wordCount || parseInt(session.word_count) || 0;
    const actualSubject = subject || session.subject || 'reading';

    if (actualWordCount === 0) {
      return res.status(400).json({ code: 400, message: '请提供阅读的字数' });
    }

    // 计算 WPM
    const timeMinutes = timeSpent / 60;
    const wpm = Math.round(actualWordCount / timeMinutes);

    // 理解率 (0-100)
    const comprehension = Math.min(100, Math.max(0, comprehensionScore || 0));

    // 计算综合效率分
    // 理想WPM范围: 阅读=250-350, 听力=300+, 写作=200-250
    const targetWPM = { reading: 300, listening: 350, writing: 250, speaking: 200 };
    const idealWPM = targetWPM[actualSubject] || 300;
    const wpmEfficiency = wpm >= idealWPM ? 100 : (wpm / idealWPM) * 100;
    const efficiencyScore = Math.round(wpmEfficiency * 0.5 + comprehension * 0.5);

    // 更新会话
    await db.query(
      `UPDATE speed_reading_sessions 
       SET completed_at = NOW(), actual_time = $3, word_count = $4,
           wpm = $5, comprehension_score = $6, efficiency_score = $7, status = 'completed'
       WHERE id = $1 AND user_id = $2`,
      [sessionId, req.user.id, timeSpent, actualWordCount, wpm, comprehension, efficiencyScore]
    );

    // 更新用户阅读统计数据
    await db.query(
      `UPDATE user_stats 
       SET total_reading_words = total_reading_words + $1,
           reading_wpm = GREATEST(reading_wpm, $2),
           reading_comprehension_avg = (reading_comprehension_avg * reading_sessions_completed + $3) / (reading_sessions_completed + 1)
       WHERE user_id = $4`,
      [actualWordCount, wpm, comprehension, req.user.id]
    );

    res.json({
      code: 200,
      data: {
        sessionId,
        timeSpent,
        wordCount: actualWordCount,
        wpm,
        comprehension,
        efficiencyScore,
        targetWPM: idealWPM,
      },
    });
  } catch (err) {
    console.error('[SpeedReading] 完成训练失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/speed-reading/stats
 * 获取速度阅读统计
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT subject, 
              COUNT(*) as total_sessions,
              AVG(wpm) as avg_wpm,
              AVG(comprehension_score) as avg_comprehension,
              AVG(efficiency_score) as avg_efficiency,
              MAX(wpm) as max_wpm,
              SUM(word_count) as total_words
       FROM speed_reading_sessions 
       WHERE user_id = $1 AND status = 'completed'
       GROUP BY subject`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: result.rows,
    });
  } catch (err) {
    console.error('[SpeedReading] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/speed-reading/history
 * 获取阅读训练历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = await db.query(
      `SELECT id, passage_id, subject, word_count, actual_time, wpm, 
              comprehension_score, efficiency_score, started_at, completed_at
       FROM speed_reading_sessions 
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY completed_at DESC LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({
      code: 200,
      data: result.rows,
    });
  } catch (err) {
    console.error('[SpeedReading] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/speed-reading/trend
 * 获取WPM进步趋势
 */
router.get('/trend', auth, async (req, res) => {
  try {
    const subject = req.query.subject || 'reading';
    const result = await db.query(
      `SELECT DATE(completed_at) as date,
              AVG(wpm) as avg_wpm,
              AVG(comprehension_score) as avg_comprehension,
              AVG(efficiency_score) as avg_efficiency,
              COUNT(*) as sessions
       FROM speed_reading_sessions 
       WHERE user_id = $1 AND subject = $2 AND status = 'completed'
         AND completed_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(completed_at)
       ORDER BY date ASC`,
      [req.user.id, subject]
    );

    res.json({
      code: 200,
      data: result.rows.map(r => ({
        date: r.date,
        wpm: Math.round(r.avg_wpm),
        comprehension: Math.round(r.avg_comprehension),
        efficiency: Math.round(r.avg_efficiency),
        sessions: parseInt(r.sessions),
      })),
    });
  } catch (err) {
    console.error('[SpeedReading] 获取趋势失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/speed-reading/levels
 * 获取阅读等级和推荐目标
 */
router.get('/levels', auth, async (req, res) => {
  try {
    // 获取用户的平均WPM
    const userResult = await db.query(
      `SELECT reading_wpm, reading_comprehension_avg FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );

    const userWpm = userResult.rows[0]?.reading_wpm || 0;
    const userComp = userResult.rows[0]?.reading_comprehension_avg || 0;

    // TOEFL阅读WPM标准
    const levels = [
      { name: '慢速阅读', minWpm: 0, maxWpm: 150, icon: '🐢', color: '#9E9E9E' },
      { name: '普通阅读', minWpm: 151, maxWpm: 250, icon: '🚶', color: '#4CAF50' },
      { name: '快速阅读', minWpm: 251, maxWpm: 350, icon: '🏃', color: '#2196F3' },
      { name: '超快阅读', minWpm: 351, maxWpm: 500, icon: '🚀', color: '#FF9800' },
      { name: '专家级', minWpm: 501, maxWpm: Infinity, icon: '👑', color: '#9C27B0' },
    ];

    const currentLevel = levels.find(l => userWpm >= l.minWpm && userWpm <= l.maxWpm) || levels[0];
    const nextLevel = levels[levels.indexOf(currentLevel) + 1];

    res.json({
      code: 200,
      data: {
        userWpm,
        comprehension: Math.round(userComp),
        currentLevel,
        nextLevel,
        levels,
        recommendations: {
          targetWpm: nextLevel ? nextLevel.minWpm : userWpm * 1.2,
          tips: userWpm < 200 
            ? '建议先从慢速材料开始，逐步提高速度' 
            : userWpm < 300 
            ? '已达到托福平均速度，可尝试加快速度练习' 
            : '已具备优秀阅读速度，注重理解深度',
        },
      },
    });
  } catch (err) {
    console.error('[SpeedReading] 获取等级失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
