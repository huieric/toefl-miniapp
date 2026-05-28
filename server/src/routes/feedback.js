const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/feedback - 提交反馈
router.post('/', auth, async (req, res) => {
  try {
    const { content, contact, images } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '反馈内容不能为空' });
    }

    const result = await db.query(
      `INSERT INTO user_feedback (user_id, content, contact, images)
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
      [req.user.id, content, contact || '', JSON.stringify(images || [])]
    );

    res.json({
      code: 200,
      data: {
        feedbackId: result.rows[0].id,
        message: '感谢您的反馈！',
      },
    });
  } catch (err) {
    console.error('[Feedback] 提交反馈失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/feedback/my - 我的反馈列表
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM user_feedback WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, content, contact, status, reply, replied_at, created_at
      FROM user_feedback
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows.map(row => ({
          id: row.id,
          content: row.content,
          contact: row.contact,
          status: row.status,
          reply: row.reply,
          repliedAt: row.replied_at,
          createdAt: row.created_at,
        })),
        total,
        page: parseInt(page),
      },
    });
  } catch (err) {
    console.error('[Feedback] 获取反馈列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;