const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const membershipService = require('../services/membershipService');
const aiScoring = require('../services/ai-scoring');

const router = express.Router();

// 确保 ai_result 列存在（幂等操作）
db.query('ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS ai_result JSONB').catch(() => {});

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

// GET /api/practice/history - 练习历史
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 10, subject } = req.query;

    let where = ['pr.user_id = $1'];
    let params = [req.user.id];
    let paramIdx = 2;

    if (subject) {
      where.push(`pr.subject = $${paramIdx++}`);
      params.push(subject);
    }

    const whereClause = where.join(' AND ');

    const result = await db.query(
      `SELECT pr.id, pr.question_id, pr.subject, pr.title, pr.score, pr.is_correct, pr.created_at
      FROM practice_records pr
      WHERE ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${paramIdx}`,
      [...params, parseInt(limit)]
    );

    res.json({
      code: 200,
      data: {
        records: result.rows.map(row => ({
          id: row.id,
          questionId: row.question_id,
          subject: row.subject,
          title: row.title,
          score: row.score,
          isCorrect: row.is_correct,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (err) {
    console.error('[Practice] 获取练习历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/practice/submit - 提交练习答案（阅读/听力/口语/写作）
router.post('/submit', auth, async (req, res) => {
  try {
    const { questionId, subject, content, answers, timeSpent } = req.body;

    if (!questionId || !subject) {
      return res.status(400).json({ code: 400, message: '缺少 questionId 或 subject' });
    }

    // 免费用户额度检查
    const access = await membershipService.checkFeatureAccess(req.user.id, 'practice');
    if (!access.allowed) {
      return res.status(403).json({ code: 403, message: access.reason });
    }

    // 获取题目
    const qResult = await db.query(
      'SELECT id, subject, type, title, content AS question_content, options, correct_answer, passage_text FROM questions WHERE id = $1',
      [questionId]
    );
    const question = qResult.rows[0];
    if (!question) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    let score = 0;
    let isCorrect = false;
    let aiResult = null;

    if (subject === 'writing') {
      // 写作：调用 AI 评分
      aiResult = await aiScoring.scoreWriting(
        question.question_content || question.title,
        content || '',
        question.type || 'independent'
      );
      score = aiResult.score;
      isCorrect = aiResult.score >= 20; // 20分以上算合格
    } else if (subject === 'speaking') {
      // 口语：调用 AI 评分（使用文字稿或转写文本）
      aiResult = await aiScoring.scoreSpeaking(
        question.question_content || question.title,
        content || '',
        timeSpent || 0
      );
      score = aiResult.score;
      isCorrect = aiResult.score >= 20;
    } else {
      // 阅读/听力：对比答案
      const correctAnswer = question.correct_answer;
      if (correctAnswer !== null && correctAnswer !== undefined) {
        const userAns = Array.isArray(answers) ? answers.join(',') : String(answers || '');
        const correctStr = Array.isArray(correctAnswer) ? correctAnswer.join(',') : String(correctAnswer);
        isCorrect = userAns === correctStr;
        score = isCorrect ? 1 : 0;
      }
    }

    // 写入练习记录
    const recordResult = await db.query(
      `INSERT INTO practice_records (user_id, question_id, subject, title, user_answer, is_correct, score, time_spent, ai_result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        req.user.id,
        questionId,
        subject,
        question.title || '',
        content || (answers ? JSON.stringify(answers) : ''),
        isCorrect,
        score,
        timeSpent || 0,
        aiResult ? JSON.stringify(aiResult) : null,
      ]
    );

    const recordId = recordResult.rows[0].id;

    // 答错自动加入错题本（仅阅读/听力）
    if (!isCorrect && (subject === 'reading' || subject === 'listening')) {
      await db.query(
        `INSERT INTO wrong_questions (user_id, question_id, user_answer, is_correct, wrong_count, next_review_at, sm2_easiness, sm2_interval, sm2_repetitions)
         VALUES ($1, $2, $3, FALSE, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', 2.50, 1, 0)
         ON CONFLICT DO NOTHING`,
        [req.user.id, questionId, content || (answers ? JSON.stringify(answers) : '')]
      );
    }

    // 返回结果（含 AI 评分详情）
    res.json({
      code: 200,
      data: {
        recordId,
        score,
        isCorrect,
        result: aiResult || { score, isCorrect },
      },
    });
  } catch (err) {
    console.error('[Practice] 提交答案失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/practice/result/:id - 获取练习结果详情
router.get('/result/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, question_id, subject, title, user_answer, is_correct, score, time_spent, ai_result, created_at
       FROM practice_records
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    const row = result.rows[0];
    res.json({
      code: 200,
      data: {
        id: row.id,
        questionId: row.question_id,
        subject: row.subject,
        title: row.title,
        userAnswer: row.user_answer,
        isCorrect: row.is_correct,
        score: parseFloat(row.score),
        timeSpent: row.time_spent,
        aiResult: row.ai_result,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error('[Practice] 获取结果失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/practice/stats - 获取用户练习统计
router.get('/stats', auth, async (req, res) => {
  try {
    const [totalResult, subjectResult, correctResult, recentResult] = await Promise.all([
      db.query(
        'SELECT COUNT(*)::int as total FROM practice_records WHERE user_id = $1',
        [req.user.id]
      ),
      db.query(
        `SELECT subject, COUNT(*)::int as count
         FROM practice_records WHERE user_id = $1
         GROUP BY subject`,
        [req.user.id]
      ),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE is_correct = true)::int as correct,
           COUNT(*)::int as total
         FROM practice_records WHERE user_id = $1`,
        [req.user.id]
      ),
      db.query(
        `SELECT created_at::date as date, COUNT(*)::int as count
         FROM practice_records
         WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY created_at::date
         ORDER BY date`,
        [req.user.id]
      ),
    ]);

    const subjectMap = {};
    subjectResult.rows.forEach(r => { subjectMap[r.subject] = r.count; });

    res.json({
      code: 200,
      data: {
        totalPractices: totalResult.rows[0].total,
        bySubject: subjectMap,
        correctRate: correctResult.rows[0].total > 0
          ? Math.round((correctResult.rows[0].correct / correctResult.rows[0].total) * 100)
          : 0,
        recent7Days: recentResult.rows.map(r => ({
          date: r.date,
          count: r.count,
        })),
      },
    });
  } catch (err) {
    console.error('[Practice] 获取统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;