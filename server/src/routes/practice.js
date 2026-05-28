const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/practice/sets - 套题列表
router.get('/sets', auth, async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    let where = [];
    let params = [];
    let paramIdx = 1;

    if (subject) {
      where.push(`subject = $${paramIdx++}`);
      params.push(subject);
    }
    if (difficulty) {
      where.push(`difficulty = $${paramIdx++}`);
      params.push(difficulty);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const result = await db.query(
      `SELECT id, title, description, subject, difficulty, time_limit, total_score, question_ids, created_at
      FROM practice_sets ${whereClause}
      ORDER BY created_at DESC`,
      params
    );

    // 获取每个套题的实际题目数量
    const sets = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      subject: row.subject,
      difficulty: row.difficulty,
      timeLimit: row.time_limit,
      totalScore: row.total_score,
      questionCount: Array.isArray(row.question_ids) ? row.question_ids.length : 0,
      createdAt: row.created_at,
    }));

    res.json({ code: 200, data: sets });
  } catch (err) {
    console.error('[Practice] 获取套题列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/practice/sets/:id - 套题详情（含题目）
router.get('/sets/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const set = (await db.query(
      'SELECT * FROM practice_sets WHERE id = $1',
      [id]
    )).rows[0];

    if (!set) {
      return res.status(404).json({ code: 404, message: '套题不存在' });
    }

    // 获取套题中的题目
    const questionIds = set.question_ids;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.json({
        code: 200,
        data: {
          id: set.id,
          title: set.title,
          description: set.description,
          subject: set.subject,
          difficulty: set.difficulty,
          timeLimit: set.time_limit,
          totalScore: set.total_score,
          questions: [],
        },
      });
    }

    const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
    const questions = (await db.query(
      `SELECT id, subject, type, difficulty, title, content, options, passage_text, audio_url
      FROM questions WHERE id IN (${placeholders}) AND status = 'approved'`,
      questionIds
    )).rows;

    // 按 questionIds 顺序排列
    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });
    const orderedQuestions = questionIds
      .map(qid => questionMap[qid])
      .filter(Boolean)
      .map(q => ({
        id: q.id,
        subject: q.subject,
        type: q.type,
        difficulty: q.difficulty,
        title: q.title,
        content: q.content,
        options: q.options,
        passageText: q.passage_text,
        audioUrl: q.audio_url,
      }));

    res.json({
      code: 200,
      data: {
        id: set.id,
        title: set.title,
        description: set.description,
        subject: set.subject,
        difficulty: set.difficulty,
        timeLimit: set.time_limit,
        totalScore: set.total_score,
        questions: orderedQuestions,
      },
    });
  } catch (err) {
    console.error('[Practice] 获取套题详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;