const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/plan/create - 创建学习计划
router.post('/create', auth, async (req, res) => {
  try {
    const { targetScore, currentScore, examDate, dailyMinutes, weakSubjects } = req.body;

    if (!targetScore || !examDate) {
      return res.status(400).json({ code: 400, message: '缺少必要参数：目标分数和考试日期' });
    }

    if (![80, 90, 100, 110, 120].includes(parseInt(targetScore))) {
      return res.status(400).json({ code: 400, message: '目标分数需为80/90/100/110/120' });
    }

    // 更新用户目标
    await db.query(
      'UPDATE users SET target_score = $2, exam_date = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id, targetScore, examDate]
    );

    // 生成三阶段计划
    const { generatePhasePlan } = require('../services/planner');
    const phases = generatePhasePlan(
      parseInt(targetScore),
      parseInt(currentScore) || 0,
      new Date(examDate),
      weakSubjects || ['reading', 'listening', 'speaking', 'writing']
    );

    // 检查是否有活跃计划
    const existing = (await db.query(
      'SELECT id FROM study_plans WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    )).rows[0];

    if (existing) {
      await db.query(
        'UPDATE study_plans SET status = $2 WHERE id = $1',
        [existing.id, 'completed']
      );
    }

    // 创建新计划
    const result = await db.query(
      `INSERT INTO study_plans (user_id, target_score, current_score, exam_date, daily_minutes, weak_subjects, phases, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *`,
      [
        req.user.id,
        targetScore,
        currentScore || 0,
        examDate,
        dailyMinutes || 60,
        JSON.stringify(weakSubjects || ['reading', 'listening', 'speaking', 'writing']),
        JSON.stringify(phases),
      ]
    );

    res.json({
      code: 200,
      data: {
        planId: result.rows[0].id,
        targetScore: result.rows[0].target_score,
        examDate: result.rows[0].exam_date,
        dailyMinutes: result.rows[0].daily_minutes,
        phases,
      },
    });
  } catch (err) {
    console.error('[Plan] 创建计划失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/plan/current - 获取当前计划
router.get('/current', auth, async (req, res) => {
  try {
    const plan = (await db.query(
      'SELECT * FROM study_plans WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [req.user.id, 'active']
    )).rows[0];

    if (!plan) {
      return res.json({ code: 200, data: null, message: '尚未创建学习计划' });
    }

    // 计算考试倒计时
    const examDate = new Date(plan.exam_date);
    const now = new Date();
    const daysRemaining = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

    // 计算当前阶段
    const phases = plan.phases || [];
    const totalDays = daysRemaining > 0 ? daysRemaining : 1;
    let currentPhase = 1;
    if (phases.length === 3) {
      const phase1Days = phases[0]?.days || 0;
      const phase1End = new Date(examDate);
      phase1End.setDate(phase1End.getDate() - (phases[1]?.days || 0) - (phases[2]?.days || 0));

      const phase2End = new Date(examDate);
      phase2End.setDate(phase2End.getDate() - (phases[2]?.days || 0));

      if (now >= phase2End) currentPhase = 3;
      else if (now >= phase1End) currentPhase = 2;
      else currentPhase = 1;
    }

    res.json({
      code: 200,
      data: {
        id: plan.id,
        targetScore: plan.target_score,
        currentScore: plan.current_score,
        examDate: plan.exam_date,
        dailyMinutes: plan.daily_minutes,
        weakSubjects: plan.weak_subjects,
        phases,
        currentPhase,
        daysRemaining: Math.max(0, daysRemaining),
        status: plan.status,
      },
    });
  } catch (err) {
    console.error('[Plan] 获取计划失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/plan/daily/:date - 获取某天任务
router.get('/daily/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;

    const tasks = (await db.query(
      `SELECT id, plan_id, subject, task_type, title, description, target_count, completed_count, is_completed, completed_at
      FROM daily_tasks
      WHERE user_id = $1 AND task_date = $2
      ORDER BY subject, task_type`,
      [req.user.id, date]
    )).rows;

    // 统计完成情况
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;

    res.json({
      code: 200,
      data: {
        date,
        totalTasks: total,
        completedTasks: completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        tasks: tasks.map(t => ({
          id: t.id,
          planId: t.plan_id,
          subject: t.subject,
          taskType: t.task_type,
          title: t.title,
          description: t.description,
          targetCount: t.target_count,
          completedCount: t.completed_count,
          isCompleted: t.is_completed,
          completedAt: t.completed_at,
        })),
      },
    });
  } catch (err) {
    console.error('[Plan] 获取每日任务失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// PUT /api/plan/daily/:date/task/:id - 更新任务完成状态
router.put('/daily/:date/task/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    const task = (await db.query(
      'SELECT * FROM daily_tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )).rows[0];

    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    await db.query(
      `UPDATE daily_tasks SET
        is_completed = $2,
        completed_count = CASE WHEN $2 = true THEN target_count ELSE 0 END,
        completed_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id, isCompleted === true]
    );

    // 更新用户学习统计
    if (isCompleted) {
      await db.query(
        `UPDATE user_stats SET
          total_study_minutes = total_study_minutes + 30,
          last_study_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1`,
        [req.user.id]
      );
    }

    res.json({
      code: 200,
      data: {
        taskId: id,
        isCompleted: isCompleted === true,
        completedAt: isCompleted ? new Date().toISOString() : null,
      },
    });
  } catch (err) {
    console.error('[Plan] 更新任务失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;