const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/wrong - 错题列表
router.get('/', auth, async (req, res) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['wq.user_id = $1'];
    let params = [req.user.id];
    let paramIdx = 2;

    if (subject) {
      where.push(`q.subject = $${paramIdx++}`);
      params.push(subject);
    }

    const whereClause = where.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.id
      WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT
        wq.id, wq.question_id, wq.user_answer, wq.is_correct,
        wq.wrong_count, wq.last_wrong_at, wq.next_review_at,
        wq.sm2_easiness, wq.sm2_interval, wq.sm2_repetitions,
        q.subject, q.type, q.difficulty, q.title, q.content, q.options, q.answer, q.analysis
      FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.id
      WHERE ${whereClause}
      ORDER BY wq.last_wrong_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows.map(row => ({
          id: row.id,
          questionId: row.question_id,
          userAnswer: row.user_answer,
          isCorrect: row.is_correct,
          wrongCount: row.wrong_count,
          lastWrongAt: row.last_wrong_at,
          nextReviewAt: row.next_review_at,
          sm2Easiness: row.sm2_easiness,
          sm2Interval: row.sm2_interval,
          sm2Repetitions: row.sm2_repetitions,
          question: {
            subject: row.subject,
            type: row.type,
            difficulty: row.difficulty,
            title: row.title,
            content: row.content,
            options: row.options,
            answer: row.answer,
            analysis: row.analysis,
          },
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[Wrong] 获取错题列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/wrong/review-plan - 获取复习计划（基于SM-2）
router.get('/review-plan', auth, async (req, res) => {
  try {
    const now = new Date().toISOString();

    const result = await db.query(
      `SELECT
        wq.id, wq.question_id, wq.next_review_at, wq.wrong_count,
        q.subject, q.title
      FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.id
      WHERE wq.user_id = $1 AND wq.next_review_at <= $2
      ORDER BY wq.next_review_at ASC
      LIMIT 50`,
      [req.user.id, now]
    );

    res.json({
      code: 200,
      data: {
        reviewCount: result.rows.length,
        list: result.rows.map(row => ({
          wrongId: row.id,
          questionId: row.question_id,
          subject: row.subject,
          title: row.title,
          wrongCount: row.wrong_count,
          nextReviewAt: row.next_review_at,
        })),
      },
    });
  } catch (err) {
    console.error('[Wrong] 获取复习计划失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/wrong/:id/redo - 重做错题（更新SM-2参数）
router.post('/:id/redo', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect, quality } = req.body;

    if (quality === undefined) {
      return res.status(400).json({ code: 400, message: '缺少quality参数（0-5评分）' });
    }

    const wrong = (await db.query(
      'SELECT * FROM wrong_questions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!wrong) {
      return res.status(404).json({ code: 404, message: '错题记录不存在' });
    }

    // SM-2 算法更新
    const { updateSM2 } = require('../services/sm2');
    const sm2Result = updateSM2(
      wrong.sm2_easiness,
      wrong.sm2_interval,
      wrong.sm2_repetitions,
      parseInt(quality)
    );

    await db.query(
      `UPDATE wrong_questions SET
        is_correct = $2,
        wrong_count = CASE WHEN $2 = false THEN wrong_count + 1 ELSE wrong_count END,
        last_wrong_at = CASE WHEN $2 = false THEN CURRENT_TIMESTAMP ELSE last_wrong_at END,
        next_review_at = $3,
        sm2_easiness = $4,
        sm2_interval = $5,
        sm2_repetitions = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [
        id,
        isCorrect === true,
        sm2Result.nextReviewDate,
        sm2Result.easiness,
        sm2Result.interval,
        sm2Result.repetitions,
      ]
    );

    res.json({
      code: 200,
      data: {
        wrongId: id,
        isCorrect,
        nextReviewAt: sm2Result.nextReviewDate,
        sm2Easiness: sm2Result.easiness,
        sm2Interval: sm2Result.interval,
        sm2Repetitions: sm2Result.repetitions,
      },
    });
  } catch (err) {
    console.error('[Wrong] 重做错题失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;