const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保必要列存在（幂等操作）
db.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer TEXT').catch(() => {});
db.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT').catch(() => {});

// POST /api/question-explanation/ai - AI 生成题目解析
router.post('/ai', auth, async (req, res) => {
  try {
    const { questionId, userAnswer, correctAnswer, subject } = req.body;
    if (!questionId) {
      return res.status(400).json({ code: 400, message: '缺少题目 ID' });
    }

    // 获取题目信息
    const question = await db.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );
    
    if (!question.rows.length) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    const q = question.rows[0];

    // 如果有预存的解析则直接返回
    if (q.explanation) {
      return res.json({
        code: 200,
        data: {
          questionId,
          explanation: q.explanation,
          source: 'predefined',
        },
      });
    }

    // 生成 AI 解析（模拟，实际调用 AI 服务）
    const subjectMap = {
      reading: '阅读',
      listening: '听力',
      speaking: '口语',
      writing: '写作',
    };
    const subjectName = subjectMap[subject] || subject;

    // 模拟 AI 解析生成（实际应调用 AI 服务）
    const explanation = generateExplanation(q, userAnswer, correctAnswer, subject);

    // 更新题目解析
    await db.query(
      'UPDATE questions SET explanation = $1 WHERE id = $2',
      [explanation, questionId]
    );

    res.json({
      code: 200,
      data: {
        questionId,
        explanation,
        source: 'ai',
      },
    });
  } catch (err) {
    console.error('[QuestionExplanation] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/question-explanation/history - 获取题目解析历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT qe.id, qe.question_id, qe.explanation, qe.subject, 
              qe.user_answer, qe.correct_answer, qe.created_at
       FROM question_explanations qe
       WHERE qe.user_id = $1
       ORDER BY qe.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM question_explanations WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        explanations: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[QuestionExplanation] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Generate AI explanation for a question
function generateExplanation(question, userAnswer, correctAnswer, subject) {
  const { type, options, correct, analysis } = question;
  const correctText = getOptionText(options, correct);

  // 基础解析模板
  let explanation = `【正确答案】${correctText}\n\n`;
  explanation += `【题目解析】\n`;
  
  if (question.passage_text) {
    explanation += `本题出自阅读篇章，文章主要讨论了相关知识点。根据文章内容，正确答案为 "${correctText}"。\n\n`;
  }

  // 选项分析
  if (options && options.length > 0) {
    explanation += `【选项分析】\n`;
    options.forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      if (letter === correct) {
        explanation += `${letter}. ${opt} ✓ 正确。这是基于文章内容的正确推断。\n`;
      } else if (userAnswer && letter === userAnswer) {
        explanation += `${letter}. ${opt} ✗ 你的选择。这个选项具有迷惑性，但 ${getWrongReason(opt, correct, options)}。\n`;
      } else {
        explanation += `${letter}. ${opt} ✗ 错误。这个选项与文章内容不符。\n`;
      }
    });
  }

  // 补充分析
  if (analysis) {
    explanation += `\n【考点分析】\n${analysis}`;
  }

  return explanation;
}

function getOptionText(options, correctLetter) {
  if (!options || !Array.isArray(options)) return correctLetter;
  const idx = correctLetter.charCodeAt(0) - 65;
  return options[idx] || correctLetter;
}

function getWrongReason(wrongOption, correctOption, allOptions) {
  const reasons = [
    '它忽略了文章中的关键限定词',
    '这个选项过于绝对化，而文章中使用了相对委婉的表达',
    '这个选项与文章中的具体细节相矛盾',
    '这是一个常见的推断错误，将个别情况推广到了整体',
    '这个选项偷换了概念，与原文表述不一致',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

module.exports = router;
