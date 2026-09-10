/**
 * AI口语陪练 API — TOEFL Speaking Practice
 * 
 * 提供结构化口语练习模式：AI出题 → 用户回答 → AI评分 → 下一题
 */
const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const config = require('../config');
const { callAI, resolveBackend, extractJSON } = require('../services/pdf-parser')._internals;

const router = express.Router();

function getKey(apiKey) {
  return apiKey || config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
}

// POST /api/ai-speak/start - 开始口语陪练
router.post('/start', auth, async (req, res) => {
  try {
    const { difficulty, type } = req.body || {};
    const validDifficulties = ['easy', 'medium', 'hard', 'all'];
    const validTypes = ['independent', 'integrated', 'all'];
    const diff = validDifficulties.includes(difficulty) ? difficulty : 'all';
    const speakType = validTypes.includes(type) ? type : 'all';

    // 从数据库随机获取口语题
    let query = 'SELECT id, title, content, type, difficulty, hint FROM questions WHERE subject = \'speaking\' AND status = \'approved\'';
    const params = [];
    if (diff !== 'all') { params.push(diff); query += ` AND difficulty = $${params.length}`; }
    if (speakType !== 'all') { params.push(speakType); query += ` AND type = $${params.length}`; }
    query += ' ORDER BY RANDOM() LIMIT 5';

    const result = await db.query(query, params);
    if (!result.rows.length) {
      return res.status(404).json({ code: 404, message: '暂无可用口语题目' });
    }

    res.json({
      code: 200,
      data: {
        questions: result.rows.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          type: r.type,
          difficulty: r.difficulty,
          hint: r.hint,
        })),
        total: result.rows.length,
      },
    });
  } catch (err) {
    console.error('[AI-Speak] 开始陪练失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-speak/grade - 提交回答并获取评分
router.post('/grade', auth, async (req, res) => {
  try {
    const { answer, questionId, questionTitle, difficulty, type } = req.body || {};
    if (!answer || !answer.trim()) {
      return res.status(400).json({ code: 400, message: '缺少回答内容' });
    }

    const key = getKey(req.body.apiKey);
    const backend = resolveBackend({
      provider: req.body.provider || 'deepseek',
      apiKey: key,
      baseURL: req.body.baseURL,
      model: req.body.model,
    });

    // 如果未配置 API Key，返回默认评分
    if (!backend || !key) {
      return res.json({
        code: 200,
        data: {
          needsKey: true,
          score: null,
          feedback: '请配置 AI Key 以获取真实评分',
          suggestions: ['前往个人中心 → AI 设置配置 API Key'],
          highlights: ['已记录答题内容'],
        },
      });
    }

    const systemPrompt = `你是托福口语评分官（TOEFL iBT Speaking，满分30）。严格评估以下学生回答。

评分标准：
1. Delivery 表达流利度（0-5）：语速、停顿、发音、语调
2. Language Use 语言使用（0-5）：语法、词汇准确度与丰富度
3. Topic Development 话题展开（0-5）：观点清晰、逻辑连贯、例子具体

请返回 JSON：
{"score": 0-30整数, "delivery": 0-5, "languageUse": 0-5, "topicDevelopment": 0-5, "feedback": "中文总体评价(2-3句)", "suggestions": ["改进建议1(中文)", "改进建议2(中文)", "改进建议3(中文)"], "highlights": ["优点1(中文)", "优点2(中文)"], "sampleAnswer": "参考高分回答(英文,100-120词)"}`;

    const userPrompt = `科目: 口语(${type})
题目: ${questionTitle || questionId || '未知'}
难度: ${difficulty || 'medium'}

学生回答：
${answer}

请按系统要求评分并只返回 JSON。`;

    const raw = await callAI(key, backend, userPrompt, systemPrompt);
    let parsed = extractJSON(raw);
    if (!parsed) {
      parsed = {
        score: 20,
        delivery: 3,
        languageUse: 3,
        topicDevelopment: 3,
        feedback: '评分解析失败，给出默认分数',
        suggestions: ['请检查 AI 配置'],
        highlights: [],
        sampleAnswer: '',
      };
    }

    // 保存到练习历史
    try {
      await db.query(
        `INSERT INTO practice_records (user_id, question_id, subject, content, score, detail, status, created_at)
         VALUES ($1, $2, 'speaking', $3, $4, $5, 'completed', CURRENT_TIMESTAMP)`,
        [req.user.id, questionId, answer, parsed.score, JSON.stringify({
          delivery: parsed.delivery,
          languageUse: parsed.languageUse,
          topicDevelopment: parsed.topicDevelopment,
          feedback: parsed.feedback,
        })]
      );
    } catch (e) { /* 记录失败不影响评分 */ }

    res.json({
      code: 200,
      data: {
        needsKey: false,
        ...parsed,
      },
    });
  } catch (e) {
    console.error('[AI-Speak] 评分失败:', e.message);
    res.status(500).json({ code: 500, message: 'AI 评分失败: ' + e.message });
  }
});

// GET /api/ai-speak/progress - 获取练习进度
router.get('/progress', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as total,
              AVG(score) as avg_score,
              MIN(score) as min_score,
              MAX(score) as max_score
       FROM practice_records
       WHERE user_id = $1 AND subject = 'speaking' AND created_at > NOW() - INTERVAL '7 days'`,
      [req.user.id]
    );
    const row = result.rows[0];
    res.json({
      code: 200,
      data: {
        total: parseInt(row.total) || 0,
        avgScore: row.avg_score ? Math.round(row.avg_score * 10) / 10 : 0,
        minScore: row.min_score || 0,
        maxScore: row.max_score || 0,
      },
    });
  } catch (err) {
    console.error('[AI-Speak] 获取进度失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
