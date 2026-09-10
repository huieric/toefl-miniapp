const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/grammar-coach/check - 实时语法检查
router.post('/check', auth, async (req, res) => {
  try {
    const { text, language = 'en-US' } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ code: 400, message: '缺少文本内容' });
    }

    // 模拟 Grammarly 风格的语法检查结果
    const checks = checkGrammar(text);

    // 记录检查结果
    await db.query(
      `INSERT INTO grammar_check_records (user_id, text, error_count, suggestion_count)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, text, checks.errors.length, checks.suggestions.length]
    );

    res.json({
      code: 200,
      data: {
        text,
        checks,
        wordCount: text.split(/\s+/).filter(w => w).length,
        charCount: text.length,
      },
    });
  } catch (err) {
    console.error('[GrammarCoach] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/grammar-coach/history - 获取检查历史
router.get('/history', auth, async (req, res) => {
  try {
    const history = await db.query(
      `SELECT id, text, error_count, suggestion_count, created_at
       FROM grammar_check_records
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: history.rows,
    });
  } catch (err) {
    console.error('[GrammarCoach] History Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Check grammar (simulated Grammarly-style)
function checkGrammar(text) {
  const errors = [];
  const suggestions = [];
  
  // 检查常见的语法错误
  const lowerText = text.toLowerCase();
  
  // 检查 "a" vs "an"
  const anPattern = /\ba\s+[aeiou]/gi;
  const matches = text.match(anPattern);
  if (matches) {
    matches.forEach(match => {
      errors.push({
        type: 'article',
        message: `"${match}" 应改为 "an ${match.substring(2)}"，元音开头的单词前使用 "an"`,
        offset: text.indexOf(match),
        length: match.length,
        severity: 'error',
      });
    });
  }

  // 检查主谓一致
  const subjectVerbPattern = /\b(he|she|it)\s+\w+(s|es)\b/gi;
  const svMatches = text.match(subjectVerbPattern);
  if (!svMatches) {
    // 没有检测到错误，添加一般性建议
  }

  // 检查标点符号
  const multipleSpaces = /\s{2,}/g;
  if (multipleSpaces.test(text)) {
    errors.push({
      type: 'punctuation',
      message: '检测到多余的空格，建议删除',
      severity: 'warning',
    });
  }

  // 检查句子长度
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  sentences.forEach((sentence, idx) => {
    if (sentence.split(/\s+/).length > 30) {
      suggestions.push({
        type: 'style',
        message: `第 ${idx + 1} 句较长（${sentence.split(/\s+/).length} 词），建议拆分以提高可读性`,
        severity: 'suggestion',
      });
    }
  });

  // 检查词汇多样性
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const uniqueWords = new Set(words);
  const lexicalDensity = uniqueWords.size / words.length;
  
  if (lexicalDensity < 0.6) {
    suggestions.push({
      type: 'vocabulary',
      message: '词汇重复率较高，建议增加词汇多样性',
      severity: 'suggestion',
    });
  }

  // 检查正式程度
  const informalPatterns = /\b(gonna|wanna|gonna|kinda|sorta|wanna)\b/gi;
  const informalMatches = text.match(informalPatterns);
  if (informalMatches) {
    suggestions.push({
      type: 'formality',
      message: '检测到非正式用语，学术写作建议使用更正式的表达',
      severity: 'suggestion',
    });
  }

  // 生成评分
  const errorPenalty = errors.length * 10;
  const suggestionPenalty = suggestions.length * 5;
  let score = Math.max(0, 100 - errorPenalty - suggestionPenalty);

  return {
    errors,
    suggestions,
    score,
    scoreLabel: getScoreLabel(score),
  };
}

// Helper: Get score label
function getScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

module.exports = router;
