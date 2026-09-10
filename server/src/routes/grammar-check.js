const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 内置语法检查规则（轻量级，无需 API key）
const grammarRules = [
  { pattern: /\b(a)\s+([aeiouAEIOU]\w*)/g, msg: '元音开头单词前应使用 "an" 而非 "a"', type: 'article' },
  { pattern: /\b(he|she|it)\s+(am)\b/gi, msg: '主语为 he/she/it 时，be 动词应使用 "is"', type: 'verb' },
  { pattern: /\b(I|you|we|they)\s+(is)\b/gi, msg: '主语为 I/you/we/they 时，be 动词应使用 "are"', type: 'verb' },
  { pattern: /\b(he|she|it)\s+(are)\b/gi, msg: '主语为 he/she/it 时，be 动词应使用 "is"', type: 'verb' },
  { pattern: /\b(I|you|we|they)\s+(is)\b/gi, msg: '主语为 I/you/we/they 时，be 动词应使用 "are"', type: 'verb' },
  { pattern: /\b(dont)\b/gi, msg: '拼写错误：应为 "don\'t"', type: 'spelling' },
  { pattern: /\b(didnt)\b/gi, msg: '拼写错误：应为 "didn\'t"', type: 'spelling' },
  { pattern: /\b(wont)\b/gi, msg: '拼写错误：应为 "won\'t"', type: 'spelling' },
  { pattern: /\b(cant)\b/gi, msg: '拼写错误：应为 "can\'t"', type: 'spelling' },
  { pattern: /\b(doesnt)\b/gi, msg: '拼写错误：应为 "doesn\'t"', type: 'spelling' },
  { pattern: /\b(isnt)\b/gi, msg: '拼写错误：应为 "isn\'t"', type: 'spelling' },
  { pattern: /\b(arent)\b/gi, msg: '拼写错误：应为 "aren\'t"', type: 'spelling' },
  { pattern: /\b(wasnt)\b/gi, msg: '拼写错误：应为 "wasn\'t"', type: 'spelling' },
  { pattern: /\b(werent)\b/gi, msg: '拼写错误：应为 "weren\'t"', type: 'spelling' },
  { pattern: /\b(havent)\b/gi, msg: '拼写错误：应为 "haven\'t"', type: 'spelling' },
  { pattern: /\b(hasnt)\b/gi, msg: '拼写错误：应为 "hasn\'t"', type: 'spelling' },
  { pattern: /\b(wouldnt)\b/gi, msg: '拼写错误：应为 "wouldn\'t"', type: 'spelling' },
  { pattern: /\b(shouldnt)\b/gi, msg: '拼写错误：应为 "shouldn\'t"', type: 'spelling' },
  { pattern: /\b(couldnt)\b/gi, msg: '拼写错误：应为 "couldn\'t"', type: 'spelling' },
  // 第三人称单数
  { pattern: /\b(he|she|it)\s+(\w+?)\s+(go|do|have|make|take|get|give|know|want|see|come|think|look|find|tell|become|leave|put|mean|keep|let|begin|show|hear|play|run|move|live|believe|hold|bring|happen|write|sit|stand|lose|pay|meet|include|continue|set|learn|change|lead|understand|watch|follow|stop|create|speak|read|spend|grow|open|walk|win|teach|offer|remember|love|consider|appear|buy|wait|serve|die|send|expect|build|stay|fall|cut|reach|kill|remain)\b/gi, msg: '第三人称单数 (he/she/it) 后动词需加 -s/-es', type: 'agreement' },
  // 重复单词
  { pattern: /\b(\w+)\s+\1\b/gi, msg: '重复单词检测', type: 'repetition' },
];

/**
 * POST /api/grammar/check
 * 检查文本中的语法问题
 */
router.post('/check', auth, async (req, res) => {
  try {
    const { text, questionId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ code: 400, message: '请输入检查的文本' });
    }

    const issues = [];
    const processedText = text.replace(/<[^>]+>/g, ''); // 去除 HTML 标签

    for (const rule of grammarRules) {
      let match;
      // 重置 lastIndex
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      
      while ((match = regex.exec(processedText)) !== null) {
        issues.push({
          id: `issue_${issues.length}`,
          type: rule.type,
          message: rule.msg,
          text: match[0],
          index: match.index,
          suggestion: getSuggestion(rule.type, match[0]),
          severity: getSeverity(rule.type),
        });
      }
    }

    // 计算基础评分
    const wordCount = processedText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charCount = processedText.length;
    const sentences = processedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentences > 0 ? wordCount / sentences : wordCount;

    // 错误率
    const errorRate = wordCount > 0 ? Math.round((issues.length / wordCount) * 100) : 0;
    
    // 综合评分 (0-100)
    let score = 100;
    score -= issues.filter(i => i.severity === 'high').length * 5;
    score -= issues.filter(i => i.severity === 'medium').length * 2;
    score -= issues.filter(i => i.severity === 'low').length * 1;
    score = Math.max(0, Math.min(100, score));

    // 按类型分组统计
    const typeStats = {};
    issues.forEach(i => {
      if (!typeStats[i.type]) typeStats[i.type] = 0;
      typeStats[i.type]++;
    });

    // 保存检查结果
    await db.query(
      `INSERT INTO grammar_checks (user_id, question_id, text, score, issue_count, issues_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, questionId || null, text.slice(0, 5000), score, issues.length, JSON.stringify(issues.slice(0, 50))]
    );

    res.json({
      code: 200,
      data: {
        text,
        score,
        wordCount,
        charCount,
        sentences,
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        errorRate,
        issues,
        typeStats,
        suggestions: generateSuggestions(issues, score),
      },
    });
  } catch (err) {
    console.error('[GrammarCheck] 检查失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/grammar/history
 * 获取语法检查历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, question_id, score, issue_count, created_at
       FROM grammar_checks
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: result.rows.map(r => ({
        id: r.id,
        score: parseInt(r.score),
        issues: parseInt(r.issue_count),
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[GrammarCheck] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * 根据错误类型获取建议
 */
function getSuggestion(type, text) {
  const suggestions = {
    article: text.startsWith('a ') ? text.replace('a ', 'an ') : '使用正确的冠词',
    verb: '使用正确的 be 动词形式',
    spelling: text.toLowerCase() + "'",
    agreement: text.replace(/(he|she|it)\s+(\w+)/i, (m, subj, verb) => {
      return `${subj} ${verb}s`;
    }),
    repetition: '删除重复单词',
  };
  return suggestions[type] || '请仔细检查';
}

/**
 * 获取严重程度
 */
function getSeverity(type) {
  const severityMap = {
    verb: 'high',
    agreement: 'high',
    article: 'medium',
    spelling: 'low',
    repetition: 'low',
  };
  return severityMap[type] || 'low';
}

/**
 * 生成改进建议
 */
function generateSuggestions(issues, score) {
  const suggestions = [];
  
  if (score < 60) {
    suggestions.push('文本中错误较多，建议重写并仔细检查语法');
    suggestions.push('注意主谓一致，特别是第三人称单数');
  } else if (score < 80) {
    suggestions.push('有一些语法错误，建议检查动词形式和冠词使用');
  }
  
  const types = {};
  issues.forEach(i => { types[i.type] = (types[i.type] || 0) + 1; });
  
  if (types.article > 2) suggestions.push('注意 "a/an" 的使用，元音开头前用 "an"');
  if (types.verb > 2) suggestions.push('检查 be 动词与主语的搭配是否正确');
  if (types.spelling > 3) suggestions.push('注意缩写形式的拼写（don\'t, can\'t 等）');
  
  if (issues.length === 0) {
    suggestions.push('语法表现优秀！');
  }

  return suggestions;
}

module.exports = router;
