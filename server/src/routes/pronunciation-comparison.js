const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/pronunciation-comparison/phrases - 获取对比练习短语
router.get('/phrases', auth, async (req, res) => {
  try {
    const phrases = [
      { id: 1, text: 'The biodiversity of the ecosystem is crucial for environmental stability.', difficulty: 'hard', category: 'academic' },
      { id: 2, text: 'Scientists have observed a correlation between habitat loss and species extinction.', difficulty: 'medium', category: 'science' },
      { id: 3, text: 'The adaptation of organisms to their environment is a key concept in evolution.', difficulty: 'hard', category: 'biology' },
      { id: 4, text: 'Climate change has significant impacts on global weather patterns.', difficulty: 'medium', category: 'environment' },
      { id: 5, text: 'The hypothesis was supported by extensive experimental evidence.', difficulty: 'medium', category: 'science' },
    ];

    res.json({
      code: 200,
      data: { phrases },
    });
  } catch (err) {
    console.error('[PronunciationComparison] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/pronunciation-comparison/analyze - AI 分析发音并对比
router.post('/analyze', auth, async (req, res) => {
  try {
    const { phraseId, phrase, userAudioData } = req.body;
    
    if (!phrase) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 模拟 AI 发音分析结果（实际应调用语音识别服务）
    const analysis = analyzePronunciation(phrase);

    // 记录练习结果
    await db.query(
      `INSERT INTO pronunciation_comparison_records (user_id, phrase_id, phrase, overall_score, audio_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, phraseId || null, phrase, analysis.overallScore, null]
    );

    res.json({
      code: 200,
      data: analysis,
    });
  } catch (err) {
    console.error('[PronunciationComparison] Analyze Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/pronunciation-comparison/stats - 获取练习统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT COUNT(*) as total_records,
              AVG(overall_score) as avg_score,
              MIN(overall_score) as min_score,
              MAX(overall_score) as max_score
       FROM pronunciation_comparison_records 
       WHERE user_id = $1`,
      [req.user.id]
    );

    const recent = await db.query(
      `SELECT phrase, overall_score, created_at 
       FROM pronunciation_comparison_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
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
    console.error('[PronunciationComparison] Stats Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Analyze pronunciation (simulated)
function analyzePronunciation(phrase) {
  const words = phrase.split(/\s+/).filter(w => w.length > 0);
  
  // 生成逐词评分
  const wordScores = words.map((word, idx) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    const baseScore = 3.0 + Math.random() * 2.0; // 3.0 - 5.0
    return {
      word: cleanWord,
      score: Math.round(baseScore * 10) / 10,
      confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      phonemes: generatePhonemeScores(cleanWord),
    };
  });

  // 计算总体评分
  const overallScore = Math.round(wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length * 10) / 10;

  // 找出需要改进的单词
  const needsImprovement = wordScores.filter(w => w.score < 3.5);

  // 生成节奏和语调评分
  const rhythmScore = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
  const intonationScore = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;

  return {
    overallScore,
    wordScores,
    rhythmScore,
    intonationScore,
    needsImprovement: needsImprovement.map(w => w.word),
    suggestion: needsImprovement.length > 0 
      ? `需要重点练习的单词：${needsImprovement.map(w => w.word).join('、')}。建议放慢速度，逐个单词练习。`
      : '发音整体不错，继续保持！注意语调和节奏。',
    phonemeAnalysis: generatePhonemeAnalysis(phrase),
  };
}

// Helper: Generate phoneme scores for a word
function generatePhonemeScores(word) {
  if (!word) return [];
  const phonemes = word.split('');
  return phonemes.map(p => ({
    phoneme: p,
    score: Math.round((3.0 + Math.random() * 2.0) * 10) / 10,
    accuracy: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
  }));
}

// Helper: Generate phoneme-level analysis
function generatePhonemeAnalysis(phrase) {
  // 模拟常见英语音素的发音建议
  const phonemeTips = [
    { phoneme: '/θ/', tip: '舌尖轻触上齿，送气发音', difficulty: 'hard' },
    { phoneme: '/ð/', tip: '舌尖轻触上齿，声带振动', difficulty: 'hard' },
    { phoneme: '/æ/', tip: '嘴巴张大，舌尖抵下齿', difficulty: 'medium' },
    { phoneme: '/r/', tip: '舌尖卷起，不接触上颚', difficulty: 'hard' },
    { phoneme: '/l/', tip: '舌尖抵上齿龈，气流从两侧流出', difficulty: 'medium' },
  ];
  return phonemeTips;
}

module.exports = router;
