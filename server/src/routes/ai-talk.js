const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/ai-talk/start - 开始AI对话
router.post('/start', auth, async (req, res) => {
  try {
    const { scene = 'free_talk' } = req.body;

    const validScenes = ['free_talk', 'campus', 'academic', 'daily', 'debate'];
    if (!validScenes.includes(scene)) {
      return res.status(400).json({ code: 400, message: '无效的对话场景' });
    }

    const result = await db.query(
      `INSERT INTO ai_conversations (user_id, scene, messages, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING id`,
      [req.user.id, scene, JSON.stringify([])]
    );

    res.json({
      code: 200,
      data: {
        conversationId: result.rows[0].id,
        scene,
        messages: [],
      },
    });
  } catch (err) {
    console.error('[AI-Talk] 开始对话失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-talk/:id/message - 发送消息并获取AI回复
router.post('/:id/message', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ code: 400, message: '消息内容不能为空' });
    }

    // 获取对话记录
    const conv = (await db.query(
      'SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!conv) {
      return res.status(404).json({ code: 404, message: '对话不存在' });
    }

    if (conv.status === 'completed') {
      return res.status(400).json({ code: 400, message: '对话已结束' });
    }

    // 解析现有消息
    let messages = [];
    try { messages = JSON.parse(conv.messages || '[]'); } catch (e) { messages = []; }

    // 添加用户消息
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // 调用AI服务获取回复
    const { generateReply } = require('../services/ai-talk');
    let aiReply;
    try {
      aiReply = await generateReply(conv.scene, messages);
    } catch (err) {
      console.error('[AI-Talk] AI回复失败:', err.message);
      aiReply = {
        content: '抱歉，AI服务暂时不可用，请稍后再试。',
        score: null,
      };
    }

    // 添加AI回复
    messages.push({
      role: 'assistant',
      content: aiReply.content,
      timestamp: new Date().toISOString(),
      score: aiReply.score,
    });

    // 更新数据库
    await db.query(
      'UPDATE ai_conversations SET messages = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id, JSON.stringify(messages)]
    );

    res.json({
      code: 200,
      data: {
        conversationId: id,
        reply: aiReply.content,
        score: aiReply.score,
        messages,
      },
    });
  } catch (err) {
    console.error('[AI-Talk] 发送消息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-talk/:id/end - 结束对话并评分
router.post('/:id/end', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const conv = (await db.query(
      'SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!conv) {
      return res.status(404).json({ code: 404, message: '对话不存在' });
    }

    // 计算对话时长
    const startedAt = new Date(conv.started_at);
    const endedAt = new Date();
    const duration = Math.round((endedAt - startedAt) / 1000);

    // 评分（基于对话内容）
    const { scoreConversation } = require('../services/ai-talk');
    let aiScore = null;
    let scoreDetail = null;
    try {
      const scoreResult = await scoreConversation(conv.messages);
      aiScore = scoreResult.score;
      scoreDetail = scoreResult.detail;
    } catch (err) {
      console.error('[AI-Talk] 评分失败:', err.message);
    }

    await db.query(
      `UPDATE ai_conversations SET
        status = 'completed',
        ended_at = CURRENT_TIMESTAMP,
        duration = $2,
        ai_score = $3,
        score_detail = $4
      WHERE id = $1`,
      [id, duration, aiScore, JSON.stringify(scoreDetail)]
    );

    res.json({
      code: 200,
      data: {
        conversationId: id,
        duration,
        aiScore,
        scoreDetail,
      },
    });
  } catch (err) {
    console.error('[AI-Talk] 结束对话失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ai-talk/history - 对话历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM ai_conversations WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, scene, ai_score, duration, status, started_at, ended_at
      FROM ai_conversations
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows.map(row => ({
          id: row.id,
          scene: row.scene,
          aiScore: row.ai_score,
          duration: row.duration,
          status: row.status,
          startedAt: row.started_at,
          endedAt: row.ended_at,
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[AI-Talk] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;