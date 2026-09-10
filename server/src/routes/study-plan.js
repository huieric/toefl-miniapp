const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保学习计划表存在
db.query(`CREATE TABLE IF NOT EXISTS study_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  target_date DATE,
  target_score INTEGER,
  current_score INTEGER,
  daily_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

db.query(`CREATE TABLE IF NOT EXISTS study_tasks (
  id SERIAL PRIMARY KEY,
  study_plan_id INTEGER REFERENCES study_plans(id),
  task_date DATE NOT NULL,
  subject VARCHAR(20),
  title VARCHAR(200),
  description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/study-plan - 获取当前计划
router.get('/', auth, async (req, res) => {
  try {
    const plan = await db.query(
      `SELECT * FROM study_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!plan.rows.length) {
      return res.json({ code: 200, data: { plan: null } });
    }

    const p = plan.rows[0];
    const daysRemaining = Math.max(0, Math.ceil((new Date(p.target_date) - new Date()) / 86400000));
    
    // 计算阶段
    const totalDays = Math.max(daysRemaining, 1);
    let currentPhase = 1;
    if (daysRemaining <= totalDays * 0.2) currentPhase = 3;
    else if (daysRemaining <= totalDays * 0.6) currentPhase = 2;

    const phaseProgress = Math.round((1 - daysRemaining / totalDays) * 100);

    const phases = [
      {
        name: '基础巩固',
        description: '夯实基础，熟悉题型，建立解题框架',
        focusAreas: ['词汇积累', '听力精听', '口语跟读', '阅读技巧'],
        dailyTasks: [
          { title: '背单词', description: '新词30 + 复习60' },
          { title: '精听练习', description: '1篇 + 听写' },
          { title: '阅读练习', description: '2篇 + 分析' },
        ],
      },
      {
        name: '强化提升',
        description: '针对性突破弱项，提高解题速度',
        focusAreas: ['薄弱科目', '时间管理', '错题复盘'],
        dailyTasks: [
          { title: '背单词', description: '新词20 + 复习80' },
          { title: '综合写作', description: '1篇练习' },
          { title: '口语模拟', description: '2题 + 录音' },
        ],
      },
      {
        name: '冲刺模考',
        description: '全真模拟考试，适应考试节奏',
        focusAreas: ['全真模考', '时间控制', '心态调整'],
        dailyTasks: [
          { title: '全真模考', description: '完整模拟1套' },
          { title: '错题复盘', description: '分析所有错题' },
          { title: '口语写作', description: '各练习2题' },
        ],
      },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = await db.query(
      `SELECT * FROM study_tasks
       WHERE study_plan_id = $1 AND task_date = $2`,
      [p.id, todayStr]
    );

    const todayCompleted = todayTasks.rows.filter(t => t.completed).length;

    const weeklyProgress = await db.query(
      `SELECT task_date,
              COUNT(*) FILTER (WHERE completed = true) as completed,
              COUNT(*) as total
       FROM study_tasks
       WHERE study_plan_id = $1
         AND task_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY task_date
       ORDER BY task_date`,
      [p.id]
    );

    const allTasks = await db.query(
      `SELECT COUNT(*) FROM study_tasks WHERE study_plan_id = $1`,
      [p.id]
    );

    const completedTasks = await db.query(
      `SELECT COUNT(*) FROM study_tasks
       WHERE study_plan_id = $1 AND completed = true`,
      [p.id]
    );

    const weakSubjects = await db.query(
      `SELECT subject,
              AVG(score) as avg_score,
              COUNT(*) as attempts
       FROM mock_exam_results
       WHERE user_id = $1
       GROUP BY subject
       ORDER BY avg_score ASC
       LIMIT 3`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        plan: {
          ...p,
          daysRemaining,
          currentScore: p.current_score,
          weakSubjects: weakSubjects.rows.map(r => r.subject),
          currentPhase,
          phaseProgress,
          phases,
        },
        dailyProgress: {
          tasks: todayTasks.rows,
          completedTasks: todayCompleted,
          totalTasks: todayTasks.rows.length,
        },
        weeklyProgress: weeklyProgress.rows,
        completionRate: Math.round((parseInt(completedTasks.rows[0].count) / parseInt(allTasks.rows[0].count)) * 100) || 0,
      },
    });
  } catch (err) {
    console.error('[StudyPlan] Get Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/study-plan/create - 创建学习计划
router.post('/create', auth, async (req, res) => {
  try {
    const { targetDate, targetScore, currentScore, dailyMinutes } = req.body;
    
    if (!targetDate) {
      return res.status(400).json({ code: 400, message: '需要指定目标考试日期' });
    }

    // 关闭旧计划
    await db.query(
      "UPDATE study_plans SET status = 'inactive' WHERE user_id = $1 AND status = 'active'",
      [req.user.id]
    );

    const plan = await db.query(
      `INSERT INTO study_plans (user_id, target_date, target_score, current_score, daily_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, targetDate, targetScore, currentScore || null, dailyMinutes || 60]
    );

    const planId = plan.rows[0].id;
    const daysRemaining = Math.max(1, Math.ceil((new Date(targetDate) - new Date()) / 86400000));

    // 生成今日和接下来7天的任务
    for (let i = 0; i < Math.min(7, daysRemaining); i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      await db.query(
        `INSERT INTO study_tasks (study_plan_id, task_date, subject, title, description) VALUES
         ($1, $2, 'reading', '阅读练习', '完成2篇阅读并分析'),
         ($1, $2, 'listening', '听力精听', '完成1篇精听和听写'),
         ($1, $2, 'speaking', '口语练习', '练习2个口语题目'),
         ($1, $2, 'writing', '写作练习', '完成1篇写作'),
         ($1, $2, 'vocab', '词汇学习', '背新词30个并复习')
         ON CONFLICT DO NOTHING`,
        [planId, dateStr]
      );
    }

    res.json({ code: 200, data: { plan: plan.rows[0] } });
  } catch (err) {
    console.error('[StudyPlan] Create Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/study-plan/task/:id/complete - 完成任务
router.post('/task/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const result = await db.query(
      `UPDATE study_tasks
       SET completed = $2, completed_at = CASE WHEN $2 = true THEN NOW() ELSE completed_at END
       WHERE id = $1 AND study_plan_id IN (
         SELECT id FROM study_plans WHERE user_id = $3 AND status = 'active'
       )
       RETURNING *`,
      [id, completed, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    res.json({ code: 200, data: { task: result.rows[0] } });
  } catch (err) {
    console.error('[StudyPlan] Complete Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
