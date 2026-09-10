const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保 dictation 表存在
db.query(`CREATE TABLE IF NOT EXISTS listening_dictation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  text TEXT NOT NULL,
  audio_url TEXT,
  user_answer TEXT,
  score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/listening-dictation/sessions - 获取听写课程列表
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = [
      {
        id: 1,
        title: '学术讲座听写 - 基础',
        description: '适合 TOEFL 听力基础练习',
        difficulty: 'easy',
        questionCount: 5,
        completedCount: 0,
        icon: '🎧',
      },
      {
        id: 2,
        title: '课堂讨论听写 - 中等',
        description: '模拟真实课堂对话',
        difficulty: 'medium',
        questionCount: 5,
        completedCount: 0,
        icon: '🗣️',
      },
      {
        id: 3,
        title: '学术讲座听写 - 困难',
        description: '高难度学术内容，挑战听力极限',
        difficulty: 'hard',
        questionCount: 5,
        completedCount: 0,
        icon: '📚',
      },
    ];

    // 获取用户完成进度
    const progress = await db.query(
      `SELECT COUNT(DISTINCT session_id) as completed 
       FROM listening_dictation 
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { sessions, completed: parseInt(progress.rows[0].completed) || 0 },
    });
  } catch (err) {
    console.error('[ListeningDictation] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/listening-dictation/session/:sessionId - 获取听写题目
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // 模拟听写题目（实际应从数据库或音频服务获取）
    const questions = getDictationQuestions(parseInt(sessionId) || 1);

    res.json({
      code: 200,
      data: { questions },
    });
  } catch (err) {
    console.error('[ListeningDictation] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/listening-dictation/submit - 提交听写答案
router.post('/submit', auth, async (req, res) => {
  try {
    const { sessionId, questionId, userAnswer, correctAnswer, score } = req.body;
    
    if (!userAnswer) {
      return res.status(400).json({ code: 400, message: '缺少听写答案' });
    }

    // 计算匹配度得分
    const matchScore = calculateMatchScore(userAnswer, correctAnswer || userAnswer);

    // 记录听写结果
    await db.query(
      `INSERT INTO listening_dictation (user_id, session_id, question_id, text, user_answer, score)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, sessionId, questionId, correctAnswer || userAnswer, userAnswer, matchScore]
    );

    res.json({
      code: 200,
      data: {
        submitted: true,
        score: matchScore,
        suggestion: matchScore >= 90 ? '完美！继续保持！' : matchScore >= 70 ? '不错，注意细节！' : '继续练习，注意听清每个词！',
      },
    });
  } catch (err) {
    console.error('[ListeningDictation] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/listening-dictation/stats - 获取统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT COUNT(*) as total_attempts,
              AVG(score) as avg_score,
              SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) as perfect_count
       FROM listening_dictation 
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: stats.rows[0],
    });
  } catch (err) {
    console.error('[ListeningDictation] Stats Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Get dictation questions
function getDictationQuestions(sessionId) {
  const questions = {
    1: [
      { id: 1, text: 'The biodiversity of ecosystems is essential for environmental stability.', hint: '生态系统的生物多样性对环境稳定性至关重要' },
      { id: 2, text: 'Scientists have observed a correlation between habitat loss and species extinction.', hint: '科学家观察到栖息地丧失与物种灭绝之间的相关性' },
      { id: 3, text: 'The adaptation of organisms to their environment is a fundamental concept in biology.', hint: '生物对环境的适应是生物学的基本概念' },
      { id: 4, text: 'Climate change has significant impacts on global weather patterns.', hint: '气候变化对全球天气模式有重大影响' },
      { id: 5, text: 'The hypothesis was supported by extensive experimental evidence.', hint: '这个假设得到了大量实验证据的支持' },
    ],
    2: [
      { id: 6, text: 'In the lecture, the professor discussed the impact of urbanization on wildlife populations.', hint: '教授讨论了城市化对野生动植物种群的影响' },
      { id: 7, text: 'The student asked about the effectiveness of conservation efforts.', hint: '学生询问了保护措施的有效性' },
      { id: 8, text: 'According to the research, there has been a decline in bird species over the past decade.', hint: '研究表明过去十年鸟类物种有所下降' },
      { id: 9, text: 'The professor recommended implementing stricter environmental regulations.', hint: '教授建议实施更严格的环境法规' },
      { id: 10, text: 'Both students agreed that more funding is needed for conservation programs.', hint: '两位学生都认为保护项目需要更多资金' },
    ],
    3: [
      { id: 11, text: 'The anthropogenic factors contributing to atmospheric pollution include industrial emissions and vehicular exhaust.', hint: '导致大气污染的anthropogenic因素包括工业排放和汽车尾气' },
      { id: 12, text: 'Photosynthetic organisms play a crucial role in carbon sequestration and oxygen production.', hint: '光合生物在碳封存和氧气生产中发挥关键作用' },
      { id: 13, text: 'The geological formation of the canyon occurred over millions of years through erosion processes.', hint: '峡谷的地质形成经过数百万年的侵蚀过程' },
      { id: 14, text: 'Neuroplasticity refers to the brain\'s ability to reorganize itself by forming new neural connections.', hint: '神经可塑性是指大脑通过形成新的神经连接来重新组织自己的能力' },
      { id: 15, text: 'The economic implications of this policy change extend beyond immediate financial considerations.', hint: '这项政策变化的经济影响超出了直接的财务考虑' },
    ],
  };
  
  return questions[sessionId] || questions[1];
}

// Helper: Calculate match score
function calculateMatchScore(userAnswer, correctAnswer) {
  if (!correctAnswer) return Math.round((3.0 + Math.random() * 2.0) * 10) / 10;

  const userWords = userAnswer.toLowerCase().trim().split(/\s+/).filter(w => w);
  const correctWords = correctAnswer.toLowerCase().trim().split(/\s+/).filter(w => w);
  
  let matches = 0;
  userWords.forEach(word => {
    if (correctWords.some(cw => cw.includes(word) || word.includes(cw))) {
      matches++;
    }
  });

  const ratio = matches / Math.max(userWords.length, correctWords.length);
  return Math.round(ratio * 100);
}

module.exports = router;
