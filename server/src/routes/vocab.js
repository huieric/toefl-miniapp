const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const { review: fsrsReview } = require('../services/fsrs');
const axios = require('axios');

const router = express.Router();

function clampRating(r) {
  const v = parseInt(r, 10);
  return Number.isNaN(v) ? 3 : Math.max(1, Math.min(4, v)); // 1=again 2=hard 3=good 4=easy
}

// GET /api/vocab - 生词本列表（含到期状态）
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, word, meaning, context, subject, question_id AS "questionId",
              fsrs_stability AS "stability", fsrs_difficulty AS "difficulty",
              last_review_at AS "lastReviewAt", next_review_at AS "nextReviewAt",
              review_count AS "reviewCount", created_at AS "createdAt"
       FROM vocabulary
       WHERE user_id = $1
       ORDER BY COALESCE(next_review_at, created_at) ASC, id ASC`,
      [req.user.id]
    );
    const now = Date.now();
    const list = result.rows.map((r) => ({
      ...r,
      isDue: !r.nextReviewAt || new Date(r.nextReviewAt).getTime() <= now,
    }));
    const dueCount = list.filter((v) => v.isDue).length;
    res.json({ code: 200, data: { list, total: list.length, dueCount } });
  } catch (err) {
    console.error('[Vocab] 获取生词列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab - 加入生词（同用户同词去重；重复加入则更新释义/出处）
router.post('/', auth, async (req, res) => {
  try {
    const { word, meaning, context, subject, questionId } = req.body || {};
    const w = String(word || '').trim().toLowerCase();
    if (!w) return res.status(400).json({ code: 400, message: 'word 不能为空' });

    const result = await db.query(
      `INSERT INTO vocabulary (user_id, word, meaning, context, subject, question_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, word)
       DO UPDATE SET
         meaning = COALESCE(NULLIF(EXCLUDED.meaning, ''), vocabulary.meaning),
         context = COALESCE(NULLIF(EXCLUDED.context, ''), vocabulary.context),
         subject = COALESCE(NULLIF(EXCLUDED.subject, ''), vocabulary.subject),
         question_id = COALESCE(EXCLUDED.question_id, vocabulary.question_id)
       RETURNING id, word, meaning, context, subject`,
      [req.user.id, w, meaning || '', context || '', subject || 'reading', questionId || null]
    );
    res.json({ code: 200, data: result.rows[0], message: '已加入生词本' });
  } catch (err) {
    console.error('[Vocab] 加入生词失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/vocab/review - 今日待复习生词队列
router.get('/review', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, word, meaning, context, subject,
              fsrs_stability AS "stability", fsrs_difficulty AS "difficulty",
              last_review_at AS "lastReviewAt", next_review_at AS "nextReviewAt",
              review_count AS "reviewCount"
       FROM vocabulary
       WHERE user_id = $1 AND (next_review_at IS NULL OR next_review_at <= NOW())
       ORDER BY COALESCE(next_review_at, created_at) ASC, id ASC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ code: 200, data: { list: result.rows, count: result.rows.length } });
  } catch (err) {
    console.error('[Vocab] 获取复习队列失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab/:id/review - 背诵评分（FSRS 更新下次复习时间）
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const rating = clampRating(req.body && req.body.rating);

    const row = (
      await db.query('SELECT * FROM vocabulary WHERE id = $1 AND user_id = $2', [id, req.user.id])
    ).rows[0];
    if (!row) return res.status(404).json({ code: 404, message: '生词不存在' });

    const state = {
      stability: row.fsrs_stability,
      difficulty: row.fsrs_difficulty,
      lastReviewAt: row.last_review_at,
    };
    const result = fsrsReview(state, rating);

    await db.query(
      `UPDATE vocabulary SET
         fsrs_stability = $2,
         fsrs_difficulty = $3,
         last_review_at = NOW(),
         next_review_at = $4,
         review_count = review_count + 1
       WHERE id = $1`,
      [id, result.stability, result.difficulty, result.due]
    );

    res.json({
      code: 200,
      data: {
        id,
        rating,
        stability: result.stability,
        difficulty: result.difficulty,
        nextReviewAt: result.due.toISOString(),
        intervalDays: result.interval,
      },
    });
  } catch (err) {
    console.error('[Vocab] 复习更新失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/vocab/lookup?word=xxx - 查词（免费英文词典，返回音标+释义+例句）
router.get('/lookup', auth, async (req, res) => {
  const word = String(req.query.word || '').trim().toLowerCase();
  if (!/^[a-z'-]{2,}$/.test(word)) {
    return res.status(400).json({ code: 400, message: 'word 不合法' });
  }
  try {
    const resp = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { timeout: 8000 }
    );
    const entry = Array.isArray(resp.data) ? resp.data[0] : null;
    if (!entry) return res.json({ code: 200, data: { word, found: false } });

    const phonetic =
      entry.phonetic ||
      (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) ||
      '';
    const meanings = [];
    for (const m of entry.meanings || []) {
      for (const d of m.definitions || []) {
        meanings.push({
          partOfSpeech: m.partOfSpeech || '',
          definition: d.definition || '',
          example: d.example || '',
        });
        if (meanings.length >= 4) break;
      }
      if (meanings.length >= 4) break;
    }
    res.json({ code: 200, data: { word: entry.word || word, phonetic, meanings } });
  } catch (e) {
    console.error('[Vocab] 查词失败:', word, e.message);
    res.json({ code: 200, data: { word, found: false, error: '查词失败' } });
  }
});

module.exports = router;
