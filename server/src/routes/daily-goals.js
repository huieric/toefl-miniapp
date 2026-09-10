const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * GET /api/daily-goals
 * 获取每日目标
 */
router.get('/', auth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    let goal = await db.query(
      `SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2`,
      [req.user.id, todayStr]
    );

    if (!goal.rows.length) {
      // 今天还没有目标，创建默认目标
      goal = await db.query(
        `INSERT INTO daily_goals (user_id, goal_date, study_minutes, target_questions, reading_count, listening_count, speaking_count, writing_count, completed)
         VALUES ($1, $2, 30, 20, 5, 5, 2, 2, FALSE)
         RETURNING *`,
        [req.user.id, todayStr]
      );
    }

    // 获取今日实际进度
    const progress = await db.query(
      `SELECT 
        COALESCE((SELECT SUM(time_spent) FROM practice_records WHERE user_id = $1 AND created_at::date = $2), 0) as practice_min,
        COALESCE((SELECT SUM(time_spent) FROM exam_records WHERE user_id = $1 AND created_at::date = $2), 0) as exam_min,
        COALESCE((SELECT COUNT(*) FROM practice_records WHERE user_id = $1 AND created_at::date = $2), 0) as practice_count,
        COALESCE((SELECT COUNT(*) FROM exam_records WHERE user_id = $1 AND created_at::date = $2), 0) as exam_count
       `,
      [req.user.id, todayStr]
    );

    const todayProgress = progress.rows[0];
    const totalMinutes = Math.round(((todayProgress?.practice_min || 0) + (todayProgress?.exam_min || 0)) / 60);
    const totalQuestions = (todayProgress?.practice_count || 0) + (todayProgress?.exam_count || 0);

    const g = goal.rows[0];

    res.json({
      code: 200,
      data: {
        goal: {
          studyMinutes: parseInt(g?.study_minutes || 30),
          targetQuestions: parseInt(g?.target_questions || 20),
          readingCount: parseInt(g?.reading_count || 5),
          listeningCount: parseInt(g?.listening_count || 5),
          speakingCount: parseInt(g?.speaking_count || 2),
          writingCount: parseInt(g?.writing_count || 2),
          completed: g?.completed || false,
        },
        progress: {
          studyMinutes: totalMinutes,
          totalQuestions,
          practiceCount: todayProgress?.practice_count || 0,
          examCount: todayProgress?.exam_count || 0,
        },
      },
    });
  } catch (err) {
    console.error('[DailyGoals] 获取目标失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/daily-goals
 * 更新每日目标
 */
router.put('/', auth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { studyMinutes, targetQuestions, readingCount, listeningCount, speakingCount, writingCount } = req.body;

    const result = await db.query(
      `UPDATE daily_goals 
       SET study_minutes = COALESCE($2, study_minutes),
           target_questions = COALESCE($3, target_questions),
           reading_count = COALESCE($4, reading_count),
           listening_count = COALESCE($5, listening_count),
           speaking_count = COALESCE($6, speaking_count),
           writing_count = COALESCE($7, writing_count),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND goal_date = $2
       RETURNING *`,
      [req.user.id, studyMinutes, targetQuestions, readingCount, listeningCount, speakingCount, writingCount, todayStr]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '今日目标不存在' });
    }

    res.json({
      code: 200,
      data: { updated: true, goal: result.rows[0] },
    });
  } catch (err) {
    console.error('[DailyGoals] 更新失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/daily-goals/history
 * 获取目标完成历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT goal_date, study_minutes, target_questions, reading_count, listening_count, 
              speaking_count, writing_count, completed, completed_at
       FROM daily_goals
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY goal_date DESC
       LIMIT 30`,
      [req.user.id]
    );

    const history = result.rows.map(r => ({
      date: r.goal_date,
      studyMinutes: parseInt(r.study_minutes || 0),
      questions: parseInt(r.target_questions || 0),
      completed: r.completed,
      completedAt: r.completed_at,
    }));

    // 计算完成率
    const total = history.length;
    const completed = history.filter(h => h.completed).length;
    const streak = computeStreak(history);

    res.json({
      code: 200,
      data: {
        history,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        currentStreak: streak,
      },
    });
  } catch (err) {
    console.error('[DailyGoals] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * 计算连续完成天数
 */
function computeStreak(history) {
  let streak = 0;
  let expectedDate = new Date();

  for (const h of history) {
    const historyDate = new Date(h.date);
    const diffDays = Math.floor((expectedDate - historyDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      expectedDate = new Date(historyDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}

module.exports = router;
