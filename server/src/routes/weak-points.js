const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/weak-points - 分析用户薄弱点
router.get('/', auth, async (req, res) => {
  try {
    // 按科目统计正确率
    const subjectStats = await db.query(
      `SELECT subject, 
              COUNT(*) as total,
              SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
              ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 1) as accuracy
       FROM practice_records
       WHERE user_id = $1
       GROUP BY subject`,
      [req.user.id]
    );

    // 按主题统计正确率
    const topicStats = await db.query(
      `SELECT 
          q.subject,
          q.difficulty,
          COUNT(pr.id) as total,
          SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct,
          ROUND(AVG(CASE WHEN pr.is_correct THEN 100.0 ELSE 0.0 END), 1) as accuracy
       FROM practice_records pr
       JOIN questions q ON q.id = pr.question_id
       WHERE pr.user_id = $1
       GROUP BY q.subject, q.difficulty
       ORDER BY accuracy ASC`,
      [req.user.id]
    );

    // 识别薄弱项（正确率 < 60%）
    const weakPoints = [];
    const strongPoints = [];

    subjectStats.rows.forEach(s => {
      const point = {
        subject: s.subject,
        total: parseInt(s.total),
        correct: parseInt(s.correct),
        accuracy: parseFloat(s.accuracy),
      };

      if (point.accuracy < 60) {
        point.level = 'weak';
        weakPoints.push(point);
      } else if (point.accuracy >= 85) {
        point.level = 'strong';
        strongPoints.push(point);
      } else {
        point.level = 'average';
      }
    });

    res.json({
      code: 200,
      data: {
        weakPoints,
        strongPoints,
        subjectStats: subjectStats.rows,
        topicStats: topicStats.rows,
      },
    });
  } catch (err) {
    console.error('[WeakPoints] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/adaptive-recommendations - 获取自适应推荐
router.get('/recommend', auth, async (req, res) => {
  try {
    const recommendations = {
      immediate: [], // 立即需要练习的
      daily: [], // 今日推荐
      weakTopics: [], // 薄弱主题
      reviewWords: [], // 需要复习的词汇
    };

    // 获取用户最近做错的题目科目
    const wrongSubjects = await db.query(
      `SELECT pr.subject, COUNT(*) as wrong_count
       FROM practice_records pr
       WHERE pr.user_id = $1 AND pr.is_correct = false
       GROUP BY pr.subject
       ORDER BY wrong_count DESC
       LIMIT 3`,
      [req.user.id]
    );

    // 获取需要复习的词汇（SRS到期）
    const reviewWords = await db.query(
      `SELECT word, phonetic, meaning, next_review
       FROM vocab
       WHERE user_id = $1 AND next_review <= NOW()
       ORDER BY next_review ASC
       LIMIT 20`,
      [req.user.id]
    );

    // 获取薄弱主题的练习推荐
    const subjectList = wrongSubjects.rows.map(s => s.subject);
    if (subjectList.length > 0) {
      recommendations.immediate = subjectList.map(s => ({
        subject: s.subject,
        type: 'practice',
        reason: `该科目最近做错 ${s.wrong_count} 题`,
        priority: 'high',
      }));
    }

    // 每日推荐
    recommendations.daily = [
      { type: 'vocab', title: '词汇复习', count: reviewWords.rows.length || 15 },
      { type: 'practice', title: '专项练习', count: 10 },
      { type: 'review', title: '错题重做', count: 5 },
    ];

    // 薄弱主题
    recommendations.weakTopics = subjectList.map(s => ({
      subject: s.subject,
      wrongCount: parseInt(s.wrong_count),
      suggestion: `建议加强${getSubjectName(s.subject)}练习`,
    }));

    // 词汇复习
    recommendations.reviewWords = reviewWords.rows;

    res.json({
      code: 200,
      data: recommendations,
    });
  } catch (err) {
    console.error('[WeakPoints] Recommendations Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

function getSubjectName(subject) {
  const map = {
    reading: '阅读',
    listening: '听力',
    speaking: '口语',
    writing: '写作',
  };
  return map[subject] || subject;
}

module.exports = router;
