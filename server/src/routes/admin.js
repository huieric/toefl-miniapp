const express = require('express');
const { adminAuth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/admin/dashboard/overview - 数据总览
router.get('/dashboard/overview', adminAuth, async (req, res) => {
  try {
    const [totalUsers, activeToday, todayPractices, avgDuration] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users').then(r => r.rows[0].count),
      db.query('SELECT COUNT(DISTINCT user_id) as count FROM usage_events WHERE created_at::date = CURRENT_DATE').then(r => r.rows[0].count),
      db.query('SELECT COUNT(*) as count FROM exam_records WHERE created_at::date = CURRENT_DATE').then(r => r.rows[0].count),
      db.query('SELECT COALESCE(AVG(time_spent), 0) as avg FROM exam_records WHERE created_at::date = CURRENT_DATE').then(r => r.rows[0].avg),
    ]);

    res.json({
      code: 200,
      data: {
        totalUsers: parseInt(totalUsers),
        activeToday: parseInt(activeToday),
        todayPractices: parseInt(todayPractices),
        avgDurationMinutes: Math.round(parseFloat(avgDuration) / 60),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取概览失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/dashboard/users - 用户增长趋势
router.get('/dashboard/users', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await db.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date`
    );

    // 过去30天的活跃用户
    const activeResult = await db.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_count
      FROM usage_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date`
    );

    res.json({
      code: 200,
      data: {
        newUsers: result.rows,
        activeUsers: activeResult.rows,
      },
    });
  } catch (err) {
    console.error('[Admin] 获取用户数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/dashboard/usage - 使用情况
router.get('/dashboard/usage', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const byDate = await db.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as event_count,
        COALESCE(SUM(duration), 0) as total_duration
      FROM usage_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date`
    );

    // 各科目分布
    const bySubject = await db.query(
      `SELECT
        q.subject,
        COUNT(*) as count
      FROM exam_records er
      JOIN practice_sets ps ON er.set_id = ps.id
      CROSS JOIN LATERAL jsonb_array_elements_text(ps.question_ids::jsonb) AS qid_arr
      JOIN questions q ON q.id = qid_arr.value::integer
      WHERE er.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY q.subject`
    );

    res.json({
      code: 200,
      data: {
        byDate: byDate.rows,
        bySubject: bySubject.rows,
      },
    });
  } catch (err) {
    console.error('[Admin] 获取使用数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/dashboard/retention - 留存率
router.get('/dashboard/retention', adminAuth, async (req, res) => {
  try {
    const retention = await db.query(`
      WITH user_activity AS (
        SELECT
          user_id,
          MIN(DATE(created_at)) as first_date
        FROM usage_events
        GROUP BY user_id
      ),
      daily_retention AS (
        SELECT
          ua.first_date,
          COUNT(DISTINCT ua.user_id) as new_users,
          COUNT(DISTINCT ue.user_id) FILTER (WHERE DATE(ue.created_at) = ua.first_date + 1) as d1,
          COUNT(DISTINCT ue.user_id) FILTER (WHERE DATE(ue.created_at) = ua.first_date + 7) as d7,
          COUNT(DISTINCT ue.user_id) FILTER (WHERE DATE(ue.created_at) = ua.first_date + 30) as d30
        FROM user_activity ua
        LEFT JOIN usage_events ue ON ua.user_id = ue.user_id AND DATE(ue.created_at) > ua.first_date
        WHERE ua.first_date >= CURRENT_DATE - INTERVAL '60 days'
        GROUP BY ua.first_date
        ORDER BY ua.first_date
      )
      SELECT
        first_date,
        new_users,
        ROUND(d1::numeric / NULLIF(new_users, 0) * 100, 1) as d1_rate,
        ROUND(d7::numeric / NULLIF(new_users, 0) * 100, 1) as d7_rate,
        ROUND(d30::numeric / NULLIF(new_users, 0) * 100, 1) as d30_rate
      FROM daily_retention
    `);

    res.json({
      code: 200,
      data: retention.rows,
    });
  } catch (err) {
    console.error('[Admin] 留存分析失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/dashboard/subjects - 科目分布
router.get('/dashboard/subjects', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        q.subject,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT er.id) as practice_count,
        COALESCE(AVG(er.total_score), 0) as avg_score
      FROM questions q
      LEFT JOIN practice_sets ps ON q.id = ANY(ARRAY(SELECT jsonb_array_elements_text(ps.question_ids::jsonb)::integer FROM practice_sets ps WHERE ps.id IS NOT NULL))
      LEFT JOIN exam_records er ON er.set_id = ps.id AND er.status = 'completed'
      GROUP BY q.subject
    `);

    res.json({
      code: 200,
      data: result.rows.map(r => ({
        subject: r.subject,
        questionCount: parseInt(r.question_count),
        practiceCount: parseInt(r.practice_count),
        avgScore: parseFloat(r.avg_score).toFixed(1),
      })),
    });
  } catch (err) {
    console.error('[Admin] 科目分布失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/feedback - 反馈列表
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (status) {
      where.push(`uf.status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM user_feedback uf ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT
        uf.id, uf.content, uf.contact, uf.images, uf.status, uf.reply, uf.replied_at, uf.created_at,
        u.nickname, u.avatar_url
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      ${whereClause}
      ORDER BY uf.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows.map(row => ({
          id: row.id,
          content: row.content,
          contact: row.contact,
          images: row.images,
          status: row.status,
          reply: row.reply,
          repliedAt: row.replied_at,
          createdAt: row.created_at,
          user: { nickname: row.nickname, avatarUrl: row.avatar_url },
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取反馈列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// PUT /api/admin/feedback/:id/reply - 回复反馈
router.put('/feedback/:id/reply', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ code: 400, message: '回复内容不能为空' });
    }

    const feedback = (await db.query(
      'SELECT * FROM user_feedback WHERE id = $1',
      [id]
    )).rows[0];

    if (!feedback) {
      return res.status(404).json({ code: 404, message: '反馈不存在' });
    }

    await db.query(
      `UPDATE user_feedback SET
        reply = $2,
        status = 'replied',
        replied_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id, reply]
    );

    res.json({
      code: 200,
      data: { feedbackId: id, status: 'replied' },
    });
  } catch (err) {
    console.error('[Admin] 回复反馈失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/questions - 待审核题目列表
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (status) {
      where.push(`status = $${paramIdx++}`);
      params.push(status);
    } else {
      where.push(`status = $${paramIdx++}`);
      params.push('pending');
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM questions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, subject, type, difficulty, title, content, options, answer, status, created_at, uploaded_by
      FROM questions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取题目列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// PUT /api/admin/questions/:id/approve - 通过题目
router.put('/questions/:id/approve', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE questions SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    res.json({ code: 200, data: { id: parseInt(req.params.id), status: 'approved' } });
  } catch (err) {
    console.error('[Admin] 审核通过失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// PUT /api/admin/questions/:id/reject - 驳回题目
router.put('/questions/:id/reject', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE questions SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    res.json({ code: 200, data: { id: parseInt(req.params.id), status: 'rejected' } });
  } catch (err) {
    console.error('[Admin] 驳回失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// 订单管理
// ============================================================

// GET /api/admin/orders - 订单列表
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (status) {
      where.push(`o.status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`, params
    );

    const result = await db.query(
      `SELECT o.id, o.order_no, o.plan_type, o.amount, o.status, o.paid_at, o.created_at,
        u.nickname, u.openid
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取订单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/subscriptions - 订阅列表
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (status) {
      where.push(`s.status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM subscriptions s ${whereClause}`, params
    );

    const result = await db.query(
      `SELECT s.id, s.plan_type, s.start_date, s.end_date, s.status, s.auto_renew, s.created_at,
        u.nickname, u.openid, u.membership
      FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取订阅失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/ad-analytics - 广告效果分析
router.get('/ad-analytics', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ code: 400, message: '缺少日期范围参数' });
    }
    const adService = require('../services/adService');
    const analytics = await adService.getAdAnalyticsWithRevenue(startDate, endDate);
    res.json({ code: 200, data: analytics });
  } catch (err) {
    console.error('[Admin] 广告分析失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/admin/logs - 操作日志
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query('SELECT COUNT(*) FROM admin_logs');

    const result = await db.query(
      `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at,
        a.username
      FROM admin_logs l LEFT JOIN admin_users a ON l.admin_id = a.id
      ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
      },
    });
  } catch (err) {
    console.error('[Admin] 获取日志失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;