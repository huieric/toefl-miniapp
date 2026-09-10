const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

const CHALLENGE_TASKS = [
  { id: 'read_practice', title: '阅读练习', icon: '📖', target: 5, xp: 25, type: 'practice', subject: 'reading' },
  { id: 'listen_practice', title: '听力练习', icon: '🎧', target: 5, xp: 25, type: 'practice', subject: 'listening' },
  { id: 'speak_practice', title: '口语练习', icon: '🎤', target: 3, xp: 30, type: 'practice', subject: 'speaking' },
  { id: 'write_practice', title: '写作练习', icon: '✍️', target: 2, xp: 30, type: 'practice', subject: 'writing' },
  { id: 'vocab_review', title: '单词复习', icon: '📝', target: 10, xp: 20, type: 'vocab_review' },
  { id: 'wrong_review', title: '错题重做', icon: '❌➡️✅', target: 3, xp: 25, type: 'wrong_review' },
  { id: 'mock_exam', title: '完成模考', icon: '🏆', target: 1, xp: 50, type: 'exam' },
  { id: 'study_time', title: '学习30分钟', icon: '⏱️', target: 30, xp: 30, type: 'study_minutes' },
];

// GET /api/daily-challenge — 获取今日挑战列表
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 获取或创建今日挑战任务
    let challenge = await db.query(
      `SELECT * FROM daily_challenges WHERE user_id = $1 AND challenge_date = $2`,
      [req.user.id, today]
    );

    if (!challenge.rows.length) {
      // 创建今日挑战
      challenge = await db.query(
        `INSERT INTO daily_challenges (user_id, challenge_date, tasks)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, challenge_date, tasks, completed_at`,
        [
          req.user.id,
          today,
          JSON.stringify(CHALLENGE_TASKS.map(t => ({
            ...t,
            progress: 0,
            completed: false,
          })))
        ]
      );
    }

    const tasks = JSON.parse(challenge.rows[0].tasks);
    const completed = challenge.rows[0].completed_at ? true : false;
    const completedCount = tasks.filter(t => t.completed).length;
    const totalXP = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xp, 0);
    const allCompleted = completedCount === tasks.length;

    res.json({
      code: 200,
      data: {
        challengeDate: challenge.rows[0].challenge_date,
        tasks,
        completed,
        completedCount,
        totalCompleted: completedCount,
        totalTasks: tasks.length,
        totalXP,
        allCompleted,
      },
    });
  } catch (err) {
    console.error('[DailyChallenge] 获取挑战失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/daily-challenge/:taskId/progress — 更新挑战进度
router.post('/:taskId/progress', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const challenge = await db.query(
      `SELECT tasks FROM daily_challenges WHERE user_id = $1 AND challenge_date = $2`,
      [req.user.id, today]
    );

    if (!challenge.rows.length) {
      return res.status(404).json({ code: 404, message: '今日挑战不存在' });
    }

    const tasks = JSON.parse(challenge.rows[0].tasks);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({ code: 404, message: '挑战任务不存在' });
    }

    if (task.completed) {
      return res.json({
        code: 200,
        data: { alreadyCompleted: true, task, completedCount: tasks.filter(t => t.completed).length },
      });
    }

    // 根据任务类型获取实际进度
    let progress = 0;
    let earnedXP = 0;

    switch (task.type) {
      case 'practice': {
        const res2 = await db.query(
          `SELECT COUNT(*) as cnt FROM practice_records
           WHERE user_id = $1 AND created_at::date = $2 AND subject = $3`,
          [req.user.id, today, task.subject]
        );
        progress = parseInt(res2.rows[0]?.cnt || 0);
        break;
      }
      case 'vocab_review': {
        const res2 = await db.query(
          `SELECT COUNT(*) as cnt FROM vocabulary
           WHERE user_id = $1 AND last_review_at::date = $2`,
          [req.user.id, today]
        );
        progress = parseInt(res2.rows[0]?.cnt || 0);
        break;
      }
      case 'wrong_review': {
        const res2 = await db.query(
          `SELECT COUNT(*) as cnt FROM exam_records
           WHERE user_id = $1 AND subject = 'wrong_book_replay' AND completed_at::date = $2`,
          [req.user.id, today]
        );
        progress = parseInt(res2.rows[0]?.cnt || 0);
        break;
      }
      case 'exam': {
        const res2 = await db.query(
          `SELECT COUNT(*) as cnt FROM exam_records
           WHERE user_id = $1 AND completed_at::date = $2`,
          [req.user.id, today]
        );
        progress = parseInt(res2.rows[0]?.cnt || 0);
        break;
      }
      case 'study_minutes': {
        const res2 = await db.query(
          `SELECT COALESCE(SUM(time_spent), 0) as mins FROM practice_records
           WHERE user_id = $1 AND created_at::date = $2`,
          [req.user.id, today]
        );
        const examRes = await db.query(
          `SELECT COALESCE(SUM(time_spent), 0) as mins FROM exam_records
           WHERE user_id = $1 AND completed_at::date = $2`,
          [req.user.id, today]
        );
        progress = Math.round(((res2.rows[0]?.mins || 0) + (examRes.rows[0]?.mins || 0)) / 60);
        break;
      }
    }

    task.progress = Math.min(progress, task.target);
    if (task.progress >= task.target) {
      task.completed = true;
      earnedXP = task.xp;

      // 奖励 XP
      await db.query(
        `UPDATE user_stats SET xp_points = COALESCE(xp_points, 0) + $2
         WHERE user_id = $1`,
        [req.user.id, task.xp]
      );

      // 检查成就解锁
      const achievementService = db.query ? null : null;
      // 检查是否所有挑战完成
      const allDone = tasks.filter(t => t.id !== taskId || t.completed || t.progress >= t.target).length === tasks.length;
      if (allDone) {
        // 全部完成额外奖励
        const bonusXP = 50;
        await db.query(
          `UPDATE user_stats SET xp_points = COALESCE(xp_points, 0) + $2
           WHERE user_id = $1`,
          [req.user.id, bonusXP]
        );
        earnedXP += bonusXP;
      }
    }

    // 更新挑战状态
    const allComplete = tasks.every(t => t.completed || t.progress >= t.target);
    await db.query(
      `UPDATE daily_challenges
       SET tasks = $2, completed = $3
       WHERE user_id = $1 AND challenge_date = $4`,
      [req.user.id, JSON.stringify(tasks), allComplete, today]
    );

    const completedCount = tasks.filter(t => t.completed).length;

    res.json({
      code: 200,
      data: {
        task,
        progress,
        earnedXP,
        completedCount,
        allComplete,
      },
    });
  } catch (err) {
    console.error('[DailyChallenge] 更新进度失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/daily-challenge/history — 获取历史挑战记录
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT challenge_date, completed_at FROM daily_challenges
       WHERE user_id = $1 AND completed_at IS NOT NULL
       ORDER BY challenge_date DESC
       LIMIT 30`,
      [req.user.id]
    );

    const history = result.rows.map(r => ({
      date: r.challenge_date,
      completedAt: r.completed_at,
    }));

    res.json({ code: 200, data: history });
  } catch (err) {
    console.error('[DailyChallenge] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
