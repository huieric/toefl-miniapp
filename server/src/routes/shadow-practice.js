const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保必要列存在
db.query('ALTER TABLE shadow_practices ADD COLUMN IF NOT EXISTS pronunciation_score NUMERIC').catch(() => {});

// GET /api/shadow-practice/phrases - 获取跟读短语列表
router.get('/phrases', auth, async (req, res) => {
  try {
    const { subject = 'reading', level = 'all' } = req.query;
    
    // 模拟跟读短语数据（实际应从题库获取）
    const phrases = generatePracticePhrases(subject, level);

    res.json({
      code: 200,
      data: {
        phrases,
        total: phrases.length,
      },
    });
  } catch (err) {
    console.error('[ShadowPractice] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/shadow-practice/record - 记录跟读练习
router.post('/record', auth, async (req, res) => {
  try {
    const { phraseId, phrase, audioUrl, duration, score, subject } = req.body;
    if (!phraseId || !phrase) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    const result = await db.query(
      `INSERT INTO shadow_practices (user_id, phrase_id, phrase, audio_url, 
       duration, score, subject, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, phraseId, phrase, audioUrl || null, duration || 0, score || 0, subject || 'all']
    );

    res.json({
      code: 200,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('[ShadowPractice] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/shadow-practice/stats - 获取跟读练习统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT COUNT(*) as total_records,
              AVG(duration) as avg_duration,
              AVG(score) as avg_score,
              COUNT(DISTINCT phrase_id) as unique_phrases
       FROM shadow_practices 
       WHERE user_id = $1`,
      [req.user.id]
    );

    const recent = await db.query(
      `SELECT phrase, score, recorded_at 
       FROM shadow_practices 
       WHERE user_id = $1 
       ORDER BY recorded_at DESC 
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        summary: stats.rows[0],
        recent: recent.rows,
      },
    });
  } catch (err) {
    console.error('[ShadowPractice] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/shadow-practice/analyze - AI 分析跟读音频（模拟）
router.post('/analyze', auth, async (req, res) => {
  try {
    const { phrase, audioData } = req.body;
    if (!phrase) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 模拟 AI 分析结果（实际应调用语音识别和发音评分服务）
    const analysis = analyzePronunciation(phrase);

    res.json({
      code: 200,
      data: analysis,
    });
  } catch (err) {
    console.error('[ShadowPractice] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Generate practice phrases
function generatePracticePhrases(subject, level) {
  const allPhrases = [
    // Reading/Listening phrases
    { id: 1, text: 'The biodiversity of the ecosystem is crucial for environmental stability.', difficulty: 'hard', category: 'academic' },
    { id: 2, text: 'Scientists have observed a correlation between habitat loss and species extinction.', difficulty: 'medium', category: 'science' },
    { id: 3, text: 'The adaptation of organisms to their environment is a key concept in evolution.', difficulty: 'hard', category: 'biology' },
    { id: 4, text: 'Climate change has significant impacts on global weather patterns.', difficulty: 'medium', category: 'environment' },
    { id: 5, text: 'The hypothesis was supported by extensive experimental evidence.', difficulty: 'medium', category: 'science' },
    // Speaking phrases
    { id: 6, text: 'I believe that online education will continue to grow in popularity.', difficulty: 'easy', category: 'opinion' },
    { id: 7, text: 'The main advantage of this approach is that it saves time and money.', difficulty: 'medium', category: 'comparison' },
    { id: 8, text: 'For example, many students find that studying in groups helps them understand better.', difficulty: 'easy', category: 'example' },
    // TOEFL independent speaking
    { id: 9, text: 'In my opinion, the benefits of remote work outweigh the disadvantages.', difficulty: 'medium', category: 'independent' },
    { id: 10, text: 'First of all, working from home allows employees to have a better work-life balance.', difficulty: 'medium', category: 'independent' },
  ];

  return level === 'all' ? allPhrases : allPhrases.filter(p => p.difficulty === level);
}

// Helper: Analyze pronunciation
function analyzePronunciation(phrase) {
  // 模拟分析结果
  const words = phrase.split(/\s+/);
  const wordScores = words.map(word => ({
    word: word.replace(/[^a-zA-Z]/g, ''),
    score: Math.round((3 + Math.random() * 2) * 10) / 10,
    confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
  }));

  const overallScore = Math.round(wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length * 10) / 10;

  // 找出需要改进的单词
  const needsImprovement = wordScores.filter(w => w.score < 3.5);

  return {
    overallScore,
    words: wordScores,
    needsImprovement: needsImprovement.map(w => w.word),
    suggestion: needsImprovement.length > 0 
      ? `需要重点练习的单词：${needsImprovement.map(w => w.word).join('、')}。建议放慢速度，逐个单词练习。`
      : '发音整体不错，继续保持！',
    rhythm: Math.round((3 + Math.random() * 2) * 10) / 10,
    intonation: Math.round((3 + Math.random() * 2) * 10) / 10,
  };
}

module.exports = router;
