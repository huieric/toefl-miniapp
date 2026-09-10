const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * POST /api/quiz-reaction/record
 * 记录一次 Quizizz 风格的情感反应
 */
router.post('/record', auth, async (req, res) => {
  try {
    const { questionId, emotion, score, isCorrect } = req.body;

    if (!['excited', 'proud', 'relieved', 'confused', 'frustrated'].includes(emotion)) {
      return res.status(400).json({ code: 400, message: '无效的情感类型' });
    }

    await db.query(
      `INSERT INTO quiz_reactions (user_id, question_id, emotion, score, is_correct)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, questionId, emotion, score, isCorrect]
    );

    // 获取对应的 emoji 和动画效果
    const effects = {
      excited: { emoji: '🎉', animation: 'confetti', label: '太棒了！' },
      proud: { emoji: '🏆', animation: 'fire', label: '真棒！' },
      relieved: { emoji: '😌', animation: 'heal', label: '松了一口气' },
      confused: { emoji: '🤔', animation: 'sparkle', label: '继续努力' },
      frustrated: { emoji: '💪', animation: 'boost', label: '加油！' },
    };

    res.json({
      code: 200,
      data: {
        recorded: true,
        effect: effects[emotion],
      },
    });
  } catch (err) {
    console.error('[QuizReaction] 记录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/quiz-reaction/summary
 * 获取情感分析汇总
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        emotion,
        COUNT(*) as count
       FROM quiz_reactions
       WHERE user_id = $1
       GROUP BY emotion
       ORDER BY count DESC`,
      [req.user.id]
    );

    const total = result.rows.reduce((sum, r) => sum + r.count, 0);
    const emotions = result.rows.map(r => ({
      ...r,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));

    res.json({
      code: 200,
      data: {
        total: total,
        emotions,
        positiveRate: total > 0
          ? Math.round(((emotions.find(e => e.emotion === 'excited')?.count || 0) +
                        (emotions.find(e => e.emotion === 'proud')?.count || 0)) / total * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error('[QuizReaction] 获取汇总失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/quiz-reaction/streak
 * 获取 Quizizz 风格连胜统计
 */
router.get('/streak', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as totalCorrect,
        SUM(CASE WHEN score >= 10 THEN 1 ELSE 0 END) as highScoreCount
       FROM quiz_reactions
       WHERE user_id = $1 AND is_correct = TRUE`,
      [req.user.id]
    );

    const row = result.rows[0] || {};
    const totalCorrect = parseInt(row?.totalCorrect || 0);
    const highScoreCount = parseInt(row?.highScoreCount || 0);

    // 计算连胜（连续答对）
    const streakResult = await db.query(
      `SELECT is_correct FROM quiz_reactions 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    let currentStreak = 0;
    for (const r of streakResult.rows) {
      if (r.is_correct) currentStreak++;
      else break;
    }

    res.json({
      code: 200,
      data: {
        totalCorrect,
        highScoreCount,
        currentStreak,
        maxStreak: Math.max(currentStreak, highScoreCount),
      },
    });
  } catch (err) {
    console.error('[QuizReaction] 获取连胜失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
