const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/exam/start - 开始考试
router.post('/start', auth, async (req, res) => {
  try {
    const { examType = 'mock', subject, setId } = req.body;

    if (!examType) {
      return res.status(400).json({ code: 400, message: '缺少考试类型' });
    }

    const result = await db.query(
      `INSERT INTO exam_records (user_id, exam_type, subject, set_id, started_at, status)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'in_progress')
      RETURNING id`,
      [req.user.id, examType, subject || null, setId || null]
    );

    res.json({
      code: 200,
      data: {
        examId: result.rows[0].id,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Exam] 开始考试失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/exam/:id/submit - 提交考试答案
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent, scores } = req.body;

    if (!answers) {
      return res.status(400).json({ code: 400, message: '缺少答案数据' });
    }

    // 验证考试记录属于当前用户
    const exam = (await db.query(
      'SELECT * FROM exam_records WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!exam) {
      return res.status(404).json({ code: 404, message: '考试记录不存在' });
    }

    // 计算总分
    let totalScore = 0;
    if (scores && typeof scores === 'object') {
      totalScore = Object.values(scores).reduce((sum, s) => sum + (parseFloat(s) || 0), 0);
    }

    await db.query(
      `UPDATE exam_records SET
        answers = $2,
        scores = $3,
        total_score = $4,
        time_spent = $5,
        completed_at = CURRENT_TIMESTAMP,
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id, JSON.stringify(answers), JSON.stringify(scores || {}), totalScore, timeSpent || 0]
    );

    // 更新用户统计
    await db.query(
      `UPDATE user_stats SET
        total_exams = total_exams + 1,
        avg_exam_score = (avg_exam_score * (total_exams - 1) + $2) / total_exams,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1`,
      [req.user.id, totalScore]
    );

    res.json({
      code: 200,
      data: {
        examId: id,
        totalScore,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Exam] 提交答案失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/exam/:id/result - 获取考试结果
router.get('/:id/result', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const exam = (await db.query(
      `SELECT er.*, ps.title as set_title
      FROM exam_records er
      LEFT JOIN practice_sets ps ON er.set_id = ps.id
      WHERE er.id = $1 AND er.user_id = $2`,
      [id, req.user.id]
    )).rows[0];

    if (!exam) {
      return res.status(404).json({ code: 404, message: '考试记录不存在' });
    }

    res.json({
      code: 200,
      data: {
        examId: exam.id,
        examType: exam.exam_type,
        subject: exam.subject,
        scores: exam.scores,
        totalScore: exam.total_score,
        timeSpent: exam.time_spent,
        answers: exam.answers,
        aiFeedback: exam.ai_feedback,
        startedAt: exam.started_at,
        completedAt: exam.completed_at,
        status: exam.status,
      },
    });
  } catch (err) {
    console.error('[Exam] 获取结果失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/exam/history - 考试历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM exam_records WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, exam_type, subject, total_score, time_spent, started_at, completed_at, status
      FROM exam_records
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
          examType: row.exam_type,
          subject: row.subject,
          totalScore: row.total_score,
          timeSpent: row.time_spent,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          status: row.status,
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[Exam] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;