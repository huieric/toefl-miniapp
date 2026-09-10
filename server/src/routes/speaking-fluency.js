const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保口语流利度记录表存在
db.query(`CREATE TABLE IF NOT EXISTS speaking_fluency_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  prompt TEXT,
  response_text TEXT,
  duration_seconds INTEGER,
  word_count INTEGER,
  fluency_score DECIMAL(5,2),
  pause_count INTEGER,
  avg_word_length DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/speaking-fluency/prompts - 获取口语提示
router.get('/prompts', auth, async (req, res) => {
  try {
    const prompts = [
      {
        id: 1,
        category: 'independent',
        question: 'Do you agree or disagree that traveling is important for personal growth?',
        prepTime: 15,
        speakTime: 45,
      },
      {
        id: 2,
        category: 'integrated',
        question: 'The reading and listening discuss two methods for protecting endangered species. What are they and what is the professor\'s opinion?',
        prepTime: 20,
        speakTime: 60,
      },
      {
        id: 3,
        category: 'independent',
        question: 'Some people prefer to live in a big city, while others prefer small towns. Which do you prefer?',
        prepTime: 15,
        speakTime: 45,
      },
    ];

    res.json({
      code: 200,
      data: { prompts },
    });
  } catch (err) {
    console.error('[SpeakingFluency] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/speaking-fluency/submit - 提交口语回答
router.post('/submit', auth, async (req, res) => {
  try {
    const { promptId, responseText, duration, wordCount, fluencyScore, pauseCount } = req.body;
    
    if (!responseText || !duration) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    const avgWordLength = responseText.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / wordCount;

    await db.query(
      `INSERT INTO speaking_fluency_records (user_id, prompt_id, response_text, duration_seconds, word_count, fluency_score, pause_count, avg_word_length)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, promptId, responseText, duration, wordCount, fluencyScore, pauseCount, avgWordLength]
    );

    res.json({
      code: 200,
      data: {
        wpm: Math.round((wordCount / duration) * 60),
        fluencyLevel: getFluencyLevel(fluencyScore),
        suggestions: generateFluencySuggestions(fluencyScore, pauseCount, avgWordLength),
      },
    });
  } catch (err) {
    console.error('[SpeakingFluency] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/speaking-fluency/stats - 获取统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT AVG(fluency_score) as avg_fluency,
              AVG(word_count) as avg_words,
              AVG(duration_seconds) as avg_duration,
              COUNT(*) as total_attempts,
              MIN(fluency_score) as min_fluency,
              MAX(fluency_score) as max_fluency
       FROM speaking_fluency_records
       WHERE user_id = $1`,
      [req.user.id]
    );

    const trend = await db.query(
      `SELECT fluency_score, created_at
       FROM speaking_fluency_records
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        summary: stats.rows[0],
        trend: trend.rows.reverse(),
      },
    });
  } catch (err) {
    console.error('[SpeakingFluency] Stats Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Get fluency level
function getFluencyLevel(score) {
  if (score >= 4.5) return 'Native-like';
  if (score >= 4.0) return 'Advanced';
  if (score >= 3.5) return 'Proficient';
  if (score >= 3.0) return 'Intermediate';
  if (score >= 2.5) return 'Developing';
  return 'Beginner';
}

// Helper: Generate suggestions
function generateFluencySuggestions(fluency, pauses, avgLength) {
  const suggestions = [];
  
  if (pauses > 10) {
    suggestions.push('减少停顿，练习连续表达');
  }
  if (avgLength > 6) {
    suggestions.push('尝试使用更简洁的表达');
  }
  if (fluency < 3.5) {
    suggestions.push('多练习常见话题，提高流利度');
  }
  
  return suggestions.length > 0 ? suggestions : ['保持练习，你的流利度很好！'];
}

module.exports = router;
