/**
 * 阅读篇章 AI 标注路由
 * POST /api/ai/annotate - 获取阅读篇章的生词和长难句标注
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const { annotatePassage } = require('../services/passage-annotate');
const db = require('../config/db');
const router = express.Router();

// POST /api/ai/annotate
router.post('/annotate', auth, async (req, res) => {
  try {
    const { questionId, provider, apiKey, baseURL, model } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ code: 400, message: '缺少 questionId' });
    }

    // 获取题目（passage）数据
    const questionRes = await db.query(
      'SELECT id, title, content, passage_text, type, difficulty, source FROM questions WHERE id = $1',
      [questionId]
    );
    const passage = questionRes.rows[0];

    if (!passage) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    const passageText = passage.passage_text || passage.content || '';
    if (!passageText || passageText.length < 50) {
      return res.status(400).json({ code: 400, message: '文章内容太短，无法标注' });
    }

    // 获取配套题目（passage 下的子问题）
    let relatedQuestions = [];
    try {
      const relatedRes = await db.query(
        `SELECT id, type, difficulty, title, content, options, answer
         FROM questions WHERE passage_text = $1 AND id != $2 AND status = 'approved'`,
        [passageText, questionId]
      );
      relatedQuestions = relatedRes.rows;
    } catch (_) {
      // 忽略
    }

    // 调用 AI 标注
    const result = await annotatePassage(
      passageText,
      relatedQuestions,
      apiKey,
      provider,
      baseURL,
      model
    );

    res.json({
      code: 200,
      data: {
        ...result,
        passageId: questionId,
        wordCount: passageText.split(/\s+/).length,
      }
    });
  } catch (e) {
    console.error('[AI-Annotate] 路由错误:', e.message);
    res.status(500).json({ code: 500, message: '标注服务错误: ' + e.message });
  }
});

module.exports = router;
