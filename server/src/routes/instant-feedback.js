const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/instant-feedback - 即时解题反馈
router.post('/submit', auth, async (req, res) => {
  try {
    const { questionId, userAnswer, subject, attemptNumber } = req.body;
    
    if (!questionId || !userAnswer) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 获取题目
    const question = await db.query('SELECT * FROM questions WHERE id = $1', [questionId]);
    if (!question.rows.length) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    const q = question.rows[0];
    const isCorrect = userAnswer === q.correct || userAnswer === q.correct_answer;

    // 获取正确答案文本
    const correctText = getOptionText(q.options, q.correct || q.correct_answer);
    const userText = getOptionText(q.options, userAnswer);

    // 记录答题历史
    await db.query(
      `INSERT INTO instant_feedback_records (user_id, question_id, user_answer, correct_answer, is_correct, subject, attempt_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, questionId, userAnswer, q.correct || q.correct_answer, isCorrect, subject || q.subject, attemptNumber || 1]
    );

    // 生成即时反馈
    const feedback = generateInstantFeedback(q, userAnswer, isCorrect);

    res.json({
      code: 200,
      data: {
        isCorrect,
        correctAnswer: q.correct || q.correct_answer,
        correctText,
        userText,
        feedback,
        hasNext: true, // 前端决定是否继续
      },
    });
  } catch (err) {
    console.error('[InstantFeedback] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/instant-feedback/history - 获取即时反馈历史
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ifr.id, ifr.question_id, ifr.subject, ifr.is_correct, ifr.attempt_number, ifr.created_at
       FROM instant_feedback_records ifr
       WHERE ifr.user_id = $1
       ORDER BY ifr.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: result.rows,
    });
  } catch (err) {
    console.error('[InstantFeedback] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Generate instant feedback
function generateInstantFeedback(question, userAnswer, isCorrect) {
  const { type, options, correct, correct_answer, analysis } = question;
  const correctLetter = correct || correct_answer;
  const correctText = getOptionText(options, correctLetter);

  if (isCorrect) {
    return {
      type: 'correct',
      title: '✓ 回答正确！',
      message: `你选择了 ${userAnswer}，正确答案是 ${correctLetter}。你的判断很准确！`,
      explanation: getDetailedExplanation(question),
    };
  } else {
    const wrongReason = getWrongReason(question, userAnswer, correctLetter);
    return {
      type: 'incorrect',
      title: '✗ 回答错误',
      message: `你选择了 ${userAnswer}，但正确答案是 ${correctLetter}。`,
      explanation: `${wrongReason}\n\n${getDetailedExplanation(question)}`,
    };
  }
}

function getDetailedExplanation(question) {
  let exp = '';
  if (question.passage_text) {
    exp += '本题出自阅读篇章，根据文章内容，正确答案为上述选项。';
  }
  if (question.analysis) {
    exp += `\n考点分析：${question.analysis}`;
  }
  return exp;
}

function getOptionText(options, correctLetter) {
  if (!options || !Array.isArray(options)) return correctLetter;
  const idx = correctLetter.charCodeAt(0) - 65;
  return options[idx] || correctLetter;
}

function getWrongReason(question, userAnswer, correctAnswer) {
  const reasons = [
    `选项 ${userAnswer} 具有迷惑性，但它忽略了文章中的关键限定词。`,
    `选项 ${userAnswer} 过于绝对化，而文章中使用了相对委婉的表达。`,
    `选项 ${userAnswer} 与文章中的具体细节相矛盾。`,
    `这是一个常见的推断错误，将个别情况推广到了整体。`,
    `选项 ${userAnswer} 偷换了概念，与原文表述不一致。`,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

module.exports = router;
