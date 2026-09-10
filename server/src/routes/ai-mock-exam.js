const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保 mock exam 表存在
db.query(`CREATE TABLE IF NOT EXISTS mock_exam_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  reading_score DECIMAL(5,2),
  listening_score DECIMAL(5,2),
  speaking_score DECIMAL(5,2),
  writing_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/ai-mock-exam/config - 获取模拟考试配置
router.get('/config', auth, async (req, res) => {
  try {
    const config = {
      reading: {
        questionCount: 10,
        timeLimit: 20,
        available: true,
      },
      listening: {
        questionCount: 8,
        timeLimit: 15,
        available: true,
      },
      speaking: {
        questionCount: 2,
        timeLimit: 10,
        available: true,
      },
      writing: {
        questionCount: 1,
        timeLimit: 30,
        available: true,
      },
    };

    res.json({
      code: 200,
      data: { config },
    });
  } catch (err) {
    console.error('[AiMockExam] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-mock-exam/start - 开始模拟考试
router.post('/start', auth, async (req, res) => {
  try {
    const { sections } = req.body;

    // 生成随机题目（模拟）
    const questions = generateMockQuestions(sections);

    res.json({
      code: 200,
      data: {
        examId: `exam_${Date.now()}`,
        questions,
        totalDuration: calculateTotalDuration(sections),
      },
    });
  } catch (err) {
    console.error('[AiMockExam] Start Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/ai-mock-exam/submit - 提交模拟考试
router.post('/submit', auth, async (req, res) => {
  try {
    const { examId, answers, duration } = req.body;

    // 评分（模拟）
    const scores = calculateMockScores(answers);

    // 保存结果
    await db.query(
      `INSERT INTO mock_exam_results (user_id, reading_score, listening_score, speaking_score, writing_score, total_score, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, scores.reading, scores.listening, scores.speaking, scores.writing, scores.total, duration]
    );

    res.json({
      code: 200,
      data: {
        scores,
        suggestion: generateScoreSuggestion(scores),
      },
    });
  } catch (err) {
    console.error('[AiMockExam] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ai-mock-exam/history - 获取考试历史
router.get('/history', auth, async (req, res) => {
  try {
    const history = await db.query(
      `SELECT id, reading_score, listening_score, speaking_score, writing_score, total_score, duration_minutes, created_at
       FROM mock_exam_results
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { results: history.rows },
    });
  } catch (err) {
    console.error('[AiMockExam] History Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Generate mock questions
function generateMockQuestions(sections) {
  const questions = [];
  
  if (sections.includes('reading')) {
    questions.push({
      id: 1,
      section: 'reading',
      type: 'multiple-choice',
      passage: 'The industrial revolution marked a major turning point in history...',
      question: 'What is the main idea of the passage?',
      options: ['A. Technology changed society', 'B. Industrialization had negative effects', 'C. Urbanization increased', 'D. Workers faced challenges'],
      timeLimit: 10,
    });
  }
  
  if (sections.includes('listening')) {
    questions.push({
      id: 2,
      section: 'listening',
      type: 'multiple-choice',
      audioUrl: '/audio/sample.mp3',
      question: 'What does the professor mainly discuss?',
      options: ['A. Climate change effects', 'B. Ocean pollution', 'C. Marine conservation', 'D. Fishing industry'],
      timeLimit: 8,
    });
  }
  
  return questions;
}

// Helper: Calculate scores
function calculateMockScores(answers) {
  const scores = {
    reading: Math.round((30 + Math.random() * 15) * 10) / 10,
    listening: Math.round((28 + Math.random() * 17) * 10) / 10,
    speaking: Math.round((25 + Math.random() * 20) * 10) / 10,
    writing: Math.round((26 + Math.random() * 19) * 10) / 10,
  };
  scores.total = Math.round((scores.reading + scores.listening + scores.speaking + scores.writing) * 10) / 10;
  return scores;
}

// Helper: Generate suggestion
function generateScoreSuggestion(scores) {
  const minSubject = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b);
  return `建议重点加强${minSubject[0]}部分，其他科目表现良好。`;
}

// Helper: Calculate total duration
function calculateTotalDuration(sections) {
  const duration = {
    reading: 20,
    listening: 15,
    speaking: 10,
    writing: 30,
  };
  return sections.reduce((total, section) => total + (duration[section] || 0), 0);
}

module.exports = router;
