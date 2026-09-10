const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保批改记录表存在
db.query(`CREATE TABLE IF NOT EXISTS writing_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  prompt TEXT,
  essay TEXT,
  total_score DECIMAL(5,2),
  grammar_score DECIMAL(5,2),
  vocabulary_score DECIMAL(5,2),
  structure_score DECIMAL(5,2),
  coherence_score DECIMAL(5,2),
  word_count INTEGER,
  estimated_time_minutes INTEGER,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/ai-writing/prompt - 获取写作题目
router.get('/prompt', auth, async (req, res) => {
  try {
    const prompts = [
      {
        id: 1,
        task: 'independent',
        title: 'Education Preference',
        prompt: 'Do you agree or disagree with the following statement? Universities should require all students to take at least one course in each of the following areas: natural sciences, social sciences, and humanities. Use specific reasons and examples to support your answer.',
        timeLimit: 30,
        minWords: 200,
        maxWords: 600,
      },
      {
        id: 2,
        task: 'integrated',
        title: 'Campus Closure',
        prompt: 'The reading passage discusses three reasons why the university should close its campus library on weekends. The professor in the lecture challenges these reasons. Summarize the points made in the lecture, being sure to explain how they cast doubt on the specific points made in the reading passage.',
        timeLimit: 20,
        minWords: 150,
        maxWords: 300,
      },
      {
        id: 3,
        task: 'independent',
        title: 'Remote Work',
        prompt: 'Some companies now allow employees to work remotely. Do you think this is a positive or negative development for society? Use specific reasons and examples to support your answer.',
        timeLimit: 30,
        minWords: 200,
        maxWords: 600,
      },
    ];

    res.json({ code: 200, data: { prompts } });
  } catch (err) {
    console.error('[AiWriting] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-writing/submit - 提交作文批改
router.post('/submit', auth, async (req, res) => {
  try {
    const { promptId, essay, estimatedTime } = req.body;

    if (!essay || essay.trim().length < 20) {
      return res.status(400).json({ code: 400, message: '作文内容过短' });
    }

    const wordCount = essay.trim().split(/\s+/).length;

    // E-rater 风格评分（模拟）
    const scores = evaluateEssay(essay);
    const feedback = generateFeedback(essay, scores);

    const result = await db.query(
      `INSERT INTO writing_submissions (user_id, prompt_id, essay, total_score, grammar_score, vocabulary_score, structure_score, coherence_score, word_count, estimated_time_minutes, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.user.id, promptId, essay, scores.total, scores.grammar, scores.vocabulary, scores.structure, scores.coherence, wordCount, estimatedTime, JSON.stringify(feedback)]
    );

    res.json({
      code: 200,
      data: {
        submission: result.rows[0],
        scores,
        feedback,
        bandScore: getBandScore(scores.total),
      },
    });
  } catch (err) {
    console.error('[AiWriting] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ai-writing/history - 获取批改历史
router.get('/history', auth, async (req, res) => {
  try {
    const history = await db.query(
      `SELECT id, prompt_id, total_score, word_count, estimated_time_minutes, created_at, feedback
       FROM writing_submissions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { submissions: history.rows },
    });
  } catch (err) {
    console.error('[AiWriting] History Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ai-writing/trend - 获取趋势
router.get('/trend', auth, async (req, res) => {
  try {
    const trend = await db.query(
      `SELECT total_score, word_count, grammar_score, vocabulary_score, created_at
       FROM writing_submissions
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { trend: trend.rows },
    });
  } catch (err) {
    console.error('[AiWriting] Trend Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Evaluate essay (E-rater style)
function evaluateEssay(essay) {
  const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = essay.trim().split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const avgSentenceLength = words.length / (sentences.length || 1);
  const lexDiversity = uniqueWords.size / words.length;
  
  // 检测复杂句式
  const complexPatterns = essay.match(/\b(which|although|because|however|moreover|furthermore|nevertheless|therefore)\b/gi) || [];
  const complexRatio = complexPatterns.length / (words.length / 10);
  
  // 检测语法错误（模拟）
  const grammarIssues = detectGrammarIssues(essay);

  // 各项评分
  const grammarScore = Math.min(5, 3.5 + (grammarIssues.length === 0 ? 1 : 0) + (complexRatio > 0.3 ? 0.5 : 0) - grammarIssues.length * 0.2);
  const vocabularyScore = Math.min(5, 2.5 + lexDiversity * 3 + (words.length > 300 ? 0.5 : 0));
  const structureScore = Math.min(5, 3 + (sentences.length >= 5 ? 0.5 : 0) + (complexRatio > 0.2 ? 0.5 : 0));
  const coherenceScore = Math.min(5, 3 + (sentences.length >= 8 ? 0.5 : 0) + (complexPatterns.length > 3 ? 0.5 : 0));

  const total = (grammarScore * 0.25 + vocabularyScore * 0.25 + structureScore * 0.25 + coherenceScore * 0.25);

  return {
    total: Math.round(total * 100) / 100,
    grammar: Math.round(grammarScore * 100) / 100,
    vocabulary: Math.round(vocabularyScore * 100) / 100,
    structure: Math.round(structureScore * 100) / 100,
    coherence: Math.round(coherenceScore * 100) / 100,
    metrics: { wordCount: words.length, sentenceCount: sentences.length, avgSentenceLength: Math.round(avgSentenceLength), lexDiversity: Math.round(lexDiversity * 100) / 100 },
  };
}

// Helper: Detect grammar issues
function detectGrammarIssues(essay) {
  const issues = [];
  const lowerEssay = essay.toLowerCase();
  
  // 常见错误检测
  if (/^\s*(i|I)(?=[^a-z])/m.test(essay)) {
    issues.push({ type: 'grammar', msg: '注意 "I" 作为主语时应该大写', level: 'minor' });
  }
  if (/\b(a|an) (apple|orange|elephant)\b/gi.test(essay)) {
    issues.push({ type: 'grammar', msg: '注意冠词 "a/an" 的使用', level: 'minor' });
  }
  if (/\b(he|she|it) (have|are)\b/gi.test(essay)) {
    issues.push({ type: 'grammar', msg: '注意第三人称单数动词形式', level: 'major' });
  }
  if (/\b(very|really) (good|bad|important)\b/gi.test(essay)) {
    issues.push({ type: 'vocabulary', msg: '建议替换 "very good/bad" 为更具体的词汇如 "excellent/terrible"', level: 'minor' });
  }
  
  return issues;
}

// Helper: Generate feedback
function generateFeedback(essay, scores) {
  const feedback = [];
  const words = essay.trim().split(/\s+/);

  // 字数建议
  if (words.length < 200) {
    feedback.push('建议增加内容长度，TOEFL 独立写作建议至少 300 词。');
  }

  // 语法反馈
  if (scores.grammar < 3.5) {
    feedback.push('语法错误较多，建议复习主谓一致、时态、冠词等基础知识。');
  }

  // 词汇反馈
  if (scores.vocabulary < 3.5) {
    feedback.push('词汇量有限，建议学习同义词替换，避免重复使用 "good", "bad", "important" 等简单词汇。');
  }

  // 结构反馈
  if (scores.structure < 3.5) {
    feedback.push('文章结构需要改进，建议使用经典五段式：引言 + 3 个正文段 + 结论。');
  }

  // 连贯性反馈
  if (scores.coherence < 3.5) {
    feedback.push('段落之间的逻辑衔接不够，建议多使用连接词如 "however", "moreover", "therefore"。');
  }

  // 正面反馈
  if (scores.total >= 4) {
    feedback.push('整体表现优秀！继续保持，注意细节提升。');
  }

  return feedback;
}

// Helper: Get band score
function getBandScore(score) {
  if (score >= 4.5) return 'Band 5 (4.0-5.0) - Excellent';
  if (score >= 3.5) return 'Band 4 (3.0-3.9) - Good';
  if (score >= 2.5) return 'Band 3 (2.0-2.9) - Average';
  if (score >= 1.5) return 'Band 2 (1.0-1.9) - Below Average';
  return 'Band 1 (0-0.9) - Weak';
}

module.exports = router;
