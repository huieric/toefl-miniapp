const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * 题目收藏 API
 * 允许用户收藏/取消收藏题目，便于快速复习
 */

/**
 * POST /api/bookmarks
 * 收藏一道题目
 */
router.post('/', auth, async (req, res) => {
  try {
    const { questionId, passageId, type, note } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ code: 400, message: '请提供题目ID' });
    }

    // 检查是否已收藏
    const existing = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND question_id = $2',
      [req.user.id, questionId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        code: 200,
        data: { bookmarked: true, id: existing.rows[0].id, message: '已收藏过' },
      });
    }

    // 收藏
    const result = await db.query(
      `INSERT INTO bookmarks (user_id, question_id, passage_id, type, note, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [req.user.id, questionId, passageId || null, type || 'question', note || '']
    );

    res.json({
      code: 200,
      data: { bookmarked: true, id: result.rows[0].id, message: '收藏成功' },
    });
  } catch (err) {
    console.error('[Bookmarks] 收藏失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/bookmarks
 * 获取收藏列表
 */
router.get('/', auth, async (req, res) => {
  try {
    const type = req.query.type;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let query = `SELECT b.id, b.question_id, b.passage_id, b.type, b.note, b.created_at,
                      q.title, q.content, q.subject, q.difficulty, q.answer_key,
                      q.is_correct, q.correct_rate
               FROM bookmarks b
               LEFT JOIN questions q ON b.question_id = q.id
               WHERE b.user_id = $1`;
    const params = [req.user.id];

    if (type) {
      params.push(type);
      query += ` AND b.type = $${params.length}`;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1`;
    const countParams = [req.user.id];
    if (type) {
      countParams.push(type);
      countQuery += ` AND type = $${countParams.length}`;
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      code: 200,
      data: {
        bookmarks: result.rows,
        total: parseInt(countResult.rows[0].total),
        hasMore: offset + result.rows.length < parseInt(countResult.rows[0].total),
      },
    });
  } catch (err) {
    console.error('[Bookmarks] 获取收藏失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * DELETE /api/bookmarks/:id
 * 取消收藏
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND id = $2',
      [req.user.id, req.params.id]
    );

    if (result.rowCount > 0) {
      res.json({ code: 200, data: { message: '取消收藏成功' } });
    } else {
      res.status(404).json({ code: 404, message: '收藏不存在' });
    }
  } catch (err) {
    console.error('[Bookmarks] 取消收藏失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/bookmarks/:id
 * 更新收藏备注
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { note } = req.body || {};

    const result = await db.query(
      'UPDATE bookmarks SET note = $1 WHERE user_id = $2 AND id = $3 RETURNING id',
      [note || '', req.user.id, req.params.id]
    );

    if (result.rowCount > 0) {
      res.json({ code: 200, data: { message: '更新成功' } });
    } else {
      res.status(404).json({ code: 404, message: '收藏不存在' });
    }
  } catch (err) {
    console.error('[Bookmarks] 更新收藏失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/bookmarks/stats
 * 获取收藏统计
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN type = 'question' THEN 1 END) as questions,
         COUNT(CASE WHEN type = 'passage' THEN 1 END) as passages,
         subject
       FROM bookmarks b
       LEFT JOIN questions q ON b.question_id = q.id
       WHERE b.user_id = $1
       GROUP BY subject`,
      [req.user.id]
    );

    // 获取总数
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1',
      [req.user.id]
    );

    // 获取最近收藏
    const recent = await db.query(
      `SELECT b.created_at, b.type, b.note, q.subject, q.difficulty
       FROM bookmarks b
       LEFT JOIN questions q ON b.question_id = q.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC LIMIT 5`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        total: parseInt(totalResult.rows[0].total),
        subjects: stats.rows,
        recent: recent.rows,
      },
    });
  } catch (err) {
    console.error('[Bookmarks] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/bookmarks/batch-remove
 * 批量取消收藏
 */
router.post('/batch-remove', auth, async (req, res) => {
  try {
    const { ids } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请提供要移除的收藏ID列表' });
    }

    const result = await db.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND id = ANY($2)',
      [req.user.id, ids]
    );

    res.json({
      code: 200,
      data: { removed: result.rowCount, message: `已移除 ${result.rowCount} 个收藏` },
    });
  } catch (err) {
    console.error('[Bookmarks] 批量移除失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
