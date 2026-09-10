/**
 * AI 口语模拟对话 API — TOEFL Speaking Conversation Practice
 *
 * 模拟考官与考生对话：AI 提问 → 考生回答 → AI 评价 + 追问 → 最终评分
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

/**
 * POST /api/ai-conversation/start
 * 开始模拟对话 — AI 出题（托福独立口语题型）
 */
router.post('/start', auth, async (req, res) => {
  try {
    const { type = 'independent', difficulty = 'medium' } = req.body || {};
    const key = getKey(req.body.apiKey);
    const backend = resolveBackend({
      provider: req.body.provider || 'deepseek',
      apiKey: key,
      baseURL: req.body.baseURL,
      model: req.body.model,
    });

    // 从数据库随机获取一道口语题作为参考
    let query = "SELECT id, title, content, type FROM questions WHERE subject = 'speaking'";
    const params = [];
    if (type !== 'all') { params.push(type); query += ` AND type = $${params.length}`; }
    if (difficulty !== 'all') { params.push(difficulty); query += ` AND difficulty = $${params.length}`; }
    query += ' ORDER BY RANDOM() LIMIT 1';
    const topicResult = await db.query(query, params);

    const topic = topicResult.rows[0];

    res.json({
      code: 200,
      data: {
        conversationId: 'conv_' + Date.now(),
        topic: topic ? {
          id: topic.id,
          title: topic.title,
          content: topic.content,
        } : null,
        type,
        difficulty,
      },
    });
  } catch (err) {
    console.error('[AI-Conversation] 开始对话失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/ai-conversation/respond
 * 用户回答后，AI 评价 + 追问或结束
 */
router.post('/respond', auth, async (req, res) => {
  try {
    const { conversationId, userResponse, round, topicContent, type, apiKey, provider, baseURL, model } = req.body;

    if (!userResponse || !userResponse.trim()) {
      return res.status(400).json({ code: 400, message: '回答内容不能为空' });
    }

    const key = getKey(apiKey);
    const backend = resolveBackend({ provider, apiKey: key, baseURL, model });

    if (!backend || !key) {
      return res.json({
        code: 200,
        data: {
          needsKey: true,
          feedback: '请配置 AI Key 以获取真实评分',
          suggestion: '前往个人中心 → AI 设置配置 API Key',
          nextQuestion: '',
        },
      });
    }

    // 判断是否已结束对话（默认 3 轮）
    const maxRounds = req.body.maxRounds || 3;
    const isFinalRound = round >= maxRounds;

    const systemPrompt = '你是托福口语模拟考官。你正在与考生进行模拟面试。\n\n' +
      '评分标准：\n' +
      '1. Delivery 表达流利度（0-5）：语速、停顿、发音、语调\n' +
      '2. Language Use 语言使用（0-5）：语法、词汇准确度与丰富度\n' +
      '3. Topic Development 话题展开（0-5）：观点清晰、逻辑连贯、例子具体\n\n' +
      '行为准则：\n' +
      '- 如果还有轮次：先简短评价用户回答（1-2 句中文），然后用英文提出下一个相关问题或追问\n' +
      '- 如果是最后一轮：给总分和详细反馈，不要用追问结尾\n' +
      '- 追问要自然、有递进性，围绕话题深入\n' +
      '- 每次回复格式：{"feedback": "中文简短评价", "score": 0-30 整数，"delivery": 0-5, "languageUse": 0-5, "topicDevelopment": 0-5, "nextQuestion": "英文追问", "isFinal": true/false}';

    const userPrompt = '当前轮次：第 ' + round + ' / ' + maxRounds + ' 轮\n' +
      '话题内容：' + (topicContent || '通用口语话题') + '\n' +
      '考生类型：' + (type || 'independent') + '\n\n' +
      '考生上一轮回答：\n' +
      userResponse + '\n\n' +
      '请评估并返回 JSON。';

    const raw = await callAI(key, backend, userPrompt, systemPrompt);
    let parsed = extractJSON(raw);
    if (!parsed) {
      parsed = {
        feedback: 'AI 解析失败',
        score: 20,
        delivery: 3,
        languageUse: 3,
        topicDevelopment: 3,
        nextQuestion: '',
        isFinal: true,
      };
    }

    res.json({
      code: 200,
      data: {
        needsKey: false,
        round: round + 1,
        isFinal: parsed.isFinal || isFinalRound,
        ...parsed,
      },
    });
  } catch (err) {
    console.error('[AI-Conversation] 对话失败:', err.message);
    res.status(500).json({ code: 500, message: 'AI 对话失败: ' + err.message });
  }
});

/**
 * POST /api/ai-conversation/finish
 * 结束对话，获取最终总结
 */
router.post('/finish', auth, async (req, res) => {
  try {
    const { conversationId, messages, type, apiKey, provider, baseURL, model } = req.body;

    const key = getKey(apiKey);
    const backend = resolveBackend({ provider, apiKey: key, baseURL, model });

    let overallFeedback = '对话结束';
    let score = null;

    if (backend && key) {
      const systemPrompt = '你是托福口语评分官。请对考生整套回答进行总结性评价和最终评分。';

      const conversationText = (messages || []).map((m) =>
        (m.role === 'user' ? '考生' : '考官') + ': ' + m.content
      ).join('\n\n');

      const userPrompt = '对话记录：\n' + conversationText + '\n\n' +
        '类型：' + (type || 'independent') + '\n\n' +
        '请返回 JSON：\n' +
        '{"score": 0-30 整数，"delivery": 0-5，"languageUse": 0-5，"topicDevelopment": 0-5，"overallFeedback": "中文总结评价 (3-4 句)", "suggestions": ["建议 1(中文)", "建议 2(中文)", "建议 3(中文)"]，"highlights": ["优点 1(中文)", "优点 2(中文)"]，"sampleAnswer": "参考高分回答 (英文)"}';

      try {
        const raw = await callAI(key, backend, userPrompt, systemPrompt);
        const parsed = extractJSON(raw);
        if (parsed) {
          overallFeedback = parsed.overallFeedback || '对话结束';
          score = parsed.score || 20;
        }
      } catch (e) {
        console.error('[AI-Conversation] 最终评分失败:', e.message);
      }
    }

    // 保存练习记录
    try {
      await db.query(
        'INSERT INTO practice_records (user_id, subject, content, score, detail, status, created_at) ' +
        'VALUES ($1, \'speaking\', $2, $3, $4, \'completed\', CURRENT_TIMESTAMP)',
        [req.user.id,
         JSON.stringify(messages || []),
         score || 20,
         JSON.stringify({ overallFeedback, type })]
      );
    } catch (e) { /* 记录失败不影响返回 */ }

    res.json({
      code: 200,
      data: {
        overallFeedback,
        score,
      },
    });
  } catch (err) {
    console.error('[AI-Conversation] 结束对话失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
