const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保必要列存在（幂等操作，避免 wrong_questions 缺 updated_at/FSRS 列导致 500）
db.query('ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP').catch(() => {});
db.query('ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS fsrs_stability DOUBLE PRECISION').catch(() => {});
db.query('ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS fsrs_difficulty DOUBLE PRECISION').catch(() => {});
db.query('ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS last_review_at TIMESTAMP').catch(() => {});

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
        q.subject, q.type, q.difficulty, q.title, q.content, q.options, q.analysis
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

// GET /api/wrong/stats - 错题统计（总数 + 今日待复习）
router.get('/stats', auth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE next_review_at IS NULL OR next_review_at <= NOW() OR fsrs_stability IS NULL)::int AS due
      FROM wrong_questions
      WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ code: 200, data: { total: r.rows[0].total, due: r.rows[0].due } });
  } catch (err) {
    console.error('[Wrong] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/wrong/review-plan - 今日待复习队列（含完整题干，按到期排序）
router.get('/review-plan', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        wq.id, wq.question_id, wq.next_review_at, wq.wrong_count, wq.fsrs_stability,
        q.subject, q.type, q.difficulty, q.title, q.content, q.options, q.passage_text, q.answer
      FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.id
      WHERE wq.user_id = $1
        AND (wq.next_review_at IS NULL OR wq.next_review_at <= NOW() OR wq.fsrs_stability IS NULL)
      ORDER BY wq.next_review_at ASC NULLS FIRST
      LIMIT 50`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        reviewCount: result.rows.length,
        list: result.rows.map(row => ({
          wrongId: row.id,
          questionId: row.question_id,
          subject: row.subject,
          type: row.type,
          difficulty: row.difficulty,
          title: row.title,
          content: row.content,
          options: row.options,
          passageText: row.passage_text,
          answer: row.answer,
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
    const { rating, quality } = req.body || {};

    const wrong = (await db.query(
      'SELECT * FROM wrong_questions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!wrong) {
      return res.status(404).json({ code: 404, message: '错题记录不存在' });
    }

    // FSRS-4.5 算法更新（rating: 1=again 2=hard 3=good 4=easy；兼容旧 quality 0-5）
    const { review: fsrsReview, mapQualityToRating } = require('../services/fsrs');
    const r = rating != null
      ? Math.max(1, Math.min(4, parseInt(rating, 10)))
      : mapQualityToRating(quality == null ? 4 : quality);
    const isCorrect = r >= 2; // hard/good/easy 视为回忆起

    const fsrsState = {
      stability: wrong.fsrs_stability,
      difficulty: wrong.fsrs_difficulty,
      lastReviewAt: wrong.last_review_at,
    };
    const fsrsResult = fsrsReview(fsrsState, r);

    await db.query(
      `UPDATE wrong_questions SET
        is_correct = $2,
        wrong_count = CASE WHEN $2 = false THEN wrong_count + 1 ELSE wrong_count END,
        last_wrong_at = CASE WHEN $2 = false THEN CURRENT_TIMESTAMP ELSE last_wrong_at END,
        next_review_at = $3,
        fsrs_stability = $4,
        fsrs_difficulty = $5,
        last_review_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [
        id,
        isCorrect,
        fsrsResult.due,
        fsrsResult.stability,
        fsrsResult.difficulty,
      ]
    );

    res.json({
      code: 200,
      data: {
        wrongId: id,
        isCorrect,
        rating: r,
        retrievability: fsrsResult.retrievability,
        nextReviewAt: fsrsResult.due.toISOString(),
        intervalDays: fsrsResult.interval,
        fsrsStability: fsrsResult.stability,
        fsrsDifficulty: fsrsResult.difficulty,
      },
    });
  } catch (err) {
    console.error('[Wrong] 重做错题失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;