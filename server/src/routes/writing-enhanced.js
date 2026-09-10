const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保必要列存在
db.query('ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS rubric_score JSONB').catch(() => {});

// POST /api/writing-enhanced/ai-score - AI 增强写作评分（基于 TOEFL 官方评分标准）
router.post('/ai-score', auth, async (req, res) => {
  try {
    const { essay, essayType, topic, previousScore } = req.body;
    if (!essay || !essayType) {
      return res.status(400).json({ code: 400, message: '缺少文章或文章类型' });
    }

    // TOEFL 官方评分标准
    const rubric = {
      integrated: {
        name: '综合写作',
        criteria: [
          { name: '内容完整性', maxScore: 5, weight: 0.4, description: '是否完整转述讲座要点' },
          { name: '逻辑连贯性', maxScore: 5, weight: 0.3, description: '文章结构是否清晰，逻辑是否连贯' },
          { name: '语言准确性', maxScore: 5, weight: 0.2, description: '语法和用词是否准确' },
          { name: '引用准确性', maxScore: 5, weight: 0.1, description: '是否准确引用原文要点' },
        ],
      },
      academic: {
        name: '学术讨论写作',
        criteria: [
          { name: '观点表达', maxScore: 5, weight: 0.35, description: '观点是否明确、有说服力' },
          { name: '论据充分性', maxScore: 5, weight: 0.3, description: '论据是否充分、有说服力' },
          { name: '语言准确性', maxScore: 5, weight: 0.2, description: '语法和用词是否准确' },
          { name: '语言多样性', maxScore: 5, weight: 0.15, description: '句式是否多样，用词是否丰富' },
        ],
      },
    };

    const rubricType = rubric[essayType] || rubric.integrated;
    
    // 模拟评分（实际应调用 AI 服务）
    const scoreResult = calculateRubricScore(essay, essayType, rubricType, previousScore);

    res.json({
      code: 200,
      data: {
        score: scoreResult,
        rubric: rubricType,
        improvement: generateImprovementTips(essay, scoreResult, essayType),
      },
    });
  } catch (err) {
    console.error('[WritingEnhanced] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/writing-enhanced/history - 获取写作评分历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT ws.id, ws.essay_type, ws.rubric_score, ws.ai_score, 
              ws.ai_feedback, ws.word_count, ws.created_at
       FROM writing_submissions ws
       WHERE ws.user_id = $1
       ORDER BY ws.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM writing_submissions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        submissions: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[WritingEnhanced] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Calculate rubric-based score
function calculateRubricScore(essay, essayType, rubric, previousScore) {
  const wordCount = essay.split(/\s+/).length;
  const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // 基于特征的模拟评分（实际应调用 AI）
  const hasTransitionWords = /however|therefore|moreover|furthermore|in addition|on the other hand/i.test(essay);
  const hasComplexSentence = /although|because|while|since|when|if|that which|which|who|whose/i.test(essay);
  const hasSpecificVocab = /\b(analyze|demonstrate|significant|consequently|subsequently|furthermore)\b/i.test(essay);

  // 计算各维度得分
  const scores = rubric.criteria.map(criterion => {
    let baseScore = 3.0; // 基础分

    if (essayType === 'integrated') {
      switch (criterion.name) {
        case '内容完整性':
          baseScore = hasTransitionWords ? 3.5 : 3.0;
          break;
        case '逻辑连贯性':
          baseScore = hasComplexSentence ? 3.5 : 2.8;
          break;
        case '语言准确性':
          baseScore = avgSentenceLength > 15 && avgSentenceLength < 30 ? 3.5 : 3.0;
          break;
        case '引用准确性':
          baseScore = hasSpecificVocab ? 3.5 : 2.8;
          break;
      }
    } else {
      switch (criterion.name) {
        case '观点表达':
          baseScore = hasComplexSentence ? 3.8 : 3.2;
          break;
        case '论据充分性':
          baseScore = wordCount > 100 ? 3.5 : 2.8;
          break;
        case '语言准确性':
          baseScore = avgSentenceLength > 15 && avgSentenceLength < 30 ? 3.5 : 3.0;
          break;
        case '语言多样性':
          baseScore = hasComplexSentence && hasSpecificVocab ? 3.8 : 3.0;
          break;
      }
    }

    // 根据字数调整
    if (wordCount > 200) baseScore = Math.min(5, baseScore + 0.3);
    if (wordCount < 50) baseScore = Math.max(1, baseScore - 0.5);

    return {
      name: criterion.name,
      score: Math.round(baseScore * 10) / 10,
      maxScore: criterion.maxScore,
      description: criterion.description,
    };
  });

  // 加权总分
  const totalScore = rubric.criteria.reduce((sum, criterion, idx) => {
    return sum + scores[idx].score * criterion.weight;
  }, 0);

  // 转换为 TOEFL 分数 (0-30)
  const toeflScore = Math.round(totalScore * 6); // 5分制转换为30分制

  // 生成等级
  let level, levelColor;
  if (toeflScore >= 26) { level = 'Excellent'; levelColor = '#10b981'; }
  else if (toeflScore >= 22) { level = 'Good'; levelColor = '#3b82f6'; }
  else if (toeflScore >= 18) { level = 'Fair'; levelColor = '#f59e0b'; }
  else { level = 'Limited'; levelColor = '#ef4444'; }

  return {
    toeflScore,
    level,
    levelColor,
    rawScore: Math.round(totalScore * 10) / 10,
    maxRawScore: 5,
    criteria: scores,
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

// Helper: Generate improvement tips
function generateImprovementTips(essay, scoreResult, essayType) {
  const tips = [];
  const { wordCount, avgSentenceLength, criteria } = scoreResult;

  if (wordCount < 100) {
    tips.push('文章内容可以更充实，建议扩展论据和细节。');
  }

  if (avgSentenceLength < 12) {
    tips.push('句子偏短，可以尝试使用复合句和复杂句来增加句式的多样性。');
  } else if (avgSentenceLength > 35) {
    tips.push('平均句子过长，建议适当拆分长句，使表达更清晰。');
  }

  criteria.forEach(criterion => {
    if (criterion.score < 3.5) {
      tips.push(`${criterion.name}：${criterion.description}，建议加强这方面的训练。`);
    }
  });

  if (tips.length === 0) {
    tips.push('整体表现不错，继续保持！');
  }

  return tips;
}

module.exports = router;
