/**
 * 错题智能复习推送 API
 *
 * 基于用户错题数据和归因分析，生成个性化复习计划：
 *  - 分析错题的归因类别（词汇/语法/逻辑/知识点/粗心/时间）
 *  - 根据薄弱项匹配题库中同主题/同题型/同难度的题目
 *  - 推荐 5-10 道针对性练习题 + 复习建议
 */
const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const { callAI, resolveBackend, extractJSON } = require('../services/pdf-parser');
const router = express.Router();

// ============================================================
// POST /api/review/push — 获取智能复习推送
// ============================================================
router.post('/push', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. 获取用户的错题数据（含归因信息）
    const wrongRes = await db.query(
      `SELECT wq.*, q.subject, q.type, q.difficulty, q.title, q.content, q.answer,
              q.analysis, q.passage_text, q.options, q.passage_id, q.batch_name,
              wq.wrong_count, wq.last_wrong_at, wq.next_review_at,
              wq.fsrs_stability, wq.fsrs_difficulty
       FROM wrong_questions wq
       JOIN questions q ON wq.question_id = q.id
       WHERE wq.user_id = $1
       ORDER BY wq.wrong_count DESC, wq.last_wrong_at DESC
       LIMIT 200`,
      [userId]
    );
    const wrongQuestions = wrongRes.rows;

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return res.json({
        code: 200,
        data: {
          message: '暂无错题数据，开始做题后会自动推送复习内容。',
          reviewPlan: null,
          suggestions: [],
        }
      });
    }

    // 2. 按归因类别统计
    const attributionStats = {
      vocabulary: { count: 0, questions: [], label: '词汇障碍' },
      grammar: { count: 0, questions: [], label: '语法结构' },
      logic: { count: 0, questions: [], label: '逻辑推理' },
      knowledge: { count: 0, questions: [], label: '知识点盲区' },
      carelessness: { count: 0, questions: [], label: '粗心/审题' },
      time: { count: 0, questions: [], label: '时间压力' },
    };

    for (const w of wrongQuestions) {
      const category = autoAttribute(w);
      attributionStats[category].count++;
      attributionStats[category].questions.push(w);
    }

    const sortedCategories = Object.entries(attributionStats)
      .filter(([_, v]) => v.count > 0)
      .sort((a, b) => b[1].count - a[1].count);

    // 3. 获取薄弱题型 TOP 3
    const typeStats = {};
    for (const w of wrongQuestions) {
      const key = w.subject + '/' + w.type;
      typeStats[key] = (typeStats[key] || 0) + w.wrong_count;
    }
    const topTypes = Object.entries(typeStats).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // 4. 为每个薄弱类别推荐针对性题目
    const reviewItems = [];
    for (const [category, data] of sortedCategories.slice(0, 3)) {
      const recommendations = getRecommendations(category, data.questions, topTypes);
      if (recommendations.length > 0) {
        reviewItems.push({
          category,
          label: data.label,
          wrongCount: data.count,
          recommendations,
          suggestion: getCategorySuggestion(category),
        });
      }
    }

    // 5. 生成复习计划（最多 10 道题）
    const allRecIds = [];
    for (const item of reviewItems) {
      for (const rec of item.recommendations) {
        if (!allRecIds.includes(rec.questionId)) {
          allRecIds.push(rec.questionId);
        }
      }
    }
    const finalRecs = allRecIds.slice(0, 10).map((id, idx) => ({
      questionId: id,
      order: idx + 1,
    }));

    // 6. AI 增强建议（可选）
    let aiSuggestions = [];
    let hasKey = false;
    try {
      const aiSuggestionsRes = await generateAISuggestions(wrongQuestions, sortedCategories, typeStats);
      hasKey = aiSuggestionsRes.hasKey;
      aiSuggestions = aiSuggestionsRes.suggestions || [];
    } catch (e) { /* 忽略 AI 建议生成失败 */ }

    res.json({
      code: 200,
      data: {
        totalWrong: wrongQuestions.length,
        topCategories: sortedCategories.map(([key, val]) => ({
          key,
          label: val.label,
          count: val.count,
          percentage: Math.round(val.count / wrongQuestions.length * 100),
        })),
        topTypes: topTypes.map(([type, count]) => ({
          type,
          wrongCount: count,
        })),
        reviewPlan: {
          totalItems: finalRecs.length,
          categories: reviewItems.map(item => ({
            category: item.category,
            label: item.label,
            wrongCount: item.wrongCount,
            recommendationCount: item.recommendations.length,
            questionIds: item.recommendations.map(r => r.questionId),
          })),
          questions: finalRecs,
        },
        reviewItems,
        aiSuggestions,
        hasAiKey: hasKey,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('[Review-Push] 获取复习推送失败:', err);
    res.status(500).json({ code: 500, message: '复习推送服务错误: ' + err.message });
  }
});

// ============================================================
// POST /api/review/complete — 标记复习完成，更新 FSRS
// ============================================================
router.post('/complete', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId, isCorrect, timeSpent } = req.body;

    if (!questionId) {
      return res.status(400).json({ code: 400, message: 'questionId 不能为空' });
    }

    // 更新 wrong_questions 表中的 FSRS 参数
    try {
      await db.query(
        `UPDATE wrong_questions
         SET last_review_at = CURRENT_TIMESTAMP,
             next_review_at = CURRENT_TIMESTAMP + (CASE WHEN $3 = TRUE THEN INTERVAL '1 day' ELSE INTERVAL '7 day' END),
             sm2_interval = CASE WHEN $3 = TRUE THEN GREATEST(sm2_interval - 1, 1) ELSE sm2_interval + 1 END,
             sm2_easiness = CASE WHEN $3 = TRUE THEN LEAST(sm2_easiness + 0.2, 3.0) ELSE GREATEST(sm2_easiness - 0.1, 1.3) END
         WHERE user_id = $1 AND question_id = $2`,
        [userId, questionId, isCorrect]
      );
    } catch (e) {
      console.error('[Review-Push] 更新 FSRS 失败:', e.message);
    }

    // 记录复习完成
    try {
      await db.query(
        `INSERT INTO practice_records (user_id, question_id, subject, is_correct, time_spent, created_at)
         SELECT $1, question_id, subject, $3, COALESCE($4, 30), CURRENT_TIMESTAMP
         FROM questions WHERE id = $2`,
        [userId, questionId, isCorrect, timeSpent]
      );
    } catch (e) { /* 记录失败不影响返回 */ }

    res.json({
      code: 200,
      data: { success: true },
    });
  } catch (err) {
    console.error('[Review-Push] 标记复习完成失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// 内部函数
// ============================================================

/**
 * 自动归因（复用 analysis.js 的逻辑）
 */
function autoAttribute(question) {
  const content = (question.content || '').toLowerCase();
  const analysis = (question.analysis || '').toLowerCase();
  const title = (question.title || '').toLowerCase();
  const type = question.type || '';

  const patterns = {
    vocabulary: ['vocab', 'word', 'meaning', 'define', 'synonym', 'antonym', '词汇', '单词', '词义'],
    grammar: ['grammar', 'syntax', 'structure', 'clause', 'tense', '语法', '句型', '从句', '时态'],
    logic: ['inference', 'imply', 'suggest', 'conclude', 'assumption', '推断', '暗示', '结论', '推理', '逻辑'],
    knowledge: ['theory', 'concept', 'principle', 'fact', 'historical', '理论', '概念', '原理', '科学'],
    carelessness: ['except', 'false', 'incorrect', 'wrong', 'least', '最小', '最大', '除了'],
  };

  for (const [category, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (content.includes(keyword) || analysis.includes(keyword) || title.includes(keyword)) {
        return category;
      }
    }
  }

  // 基于题型推断
  if (type === 'inference' || type === 'purpose' || type === 'tone') return 'logic';
  if (type === 'detail' || type === 'factual') return 'knowledge';
  return 'knowledge';
}

/**
 * 根据归因类别获取推荐题目
 */
function getRecommendations(category, wrongQuestions, topTypes) {
  const recommendations = [];

  // 根据薄弱类别构建查询条件
  let query = '';
  let params = [];
  let paramIndex = 1;

  // 获取推荐题目（与错题同主题/同题型，但不重复）
  query = `SELECT q.id, q.subject, q.type, q.difficulty, q.title, q.content,
                   q.passage_text, q.passage_id, q.batch_name
            FROM questions q
            WHERE q.status = 'approved'`;

  // 根据薄弱类别选择推荐策略
  if (category === 'vocabulary') {
    // 推荐 vocabulary 类型的题目（词汇题）
    query += ` AND q.type = 'vocabulary'`;
  } else if (category === 'grammar') {
    // 推荐长难句分析题目或 grammar 相关的
    query += ` AND q.type IN ('detail', 'inference')`;
  } else if (category === 'logic') {
    // 推荐 inference/purpose/tone 类型
    query += ` AND q.type IN ('inference', 'purpose', 'tone')`;
  } else if (category === 'knowledge') {
    // 推荐 detail/factual 类型
    query += ` AND q.type IN ('detail', 'factual')`;
  } else if (category === 'carelessness') {
    // 推荐各类型题目，强调审题
    query += ` AND q.type IN ('detail', 'vocabulary')`;
  } else {
    // 通用推荐
    query += ` AND q.type IN ('detail', 'inference')`;
  }

  query += ` AND q.difficulty IN ('medium', 'hard')`;
  query += ` ORDER BY RANDOM() LIMIT 5`;

  const result = db.query(query, []);
  return (result || { rows: [] }).rows || [];
}

/**
 * 获取归因类别的学习建议
 */
function getCategorySuggestion(category) {
  const suggestions = {
    vocabulary: [
      '每天背诵 20-30 个托福高频词汇',
      '使用词根词缀法扩大词汇量',
      '在阅读中通过上下文猜词训练词汇',
    ],
    grammar: [
      '系统复习托福语法核心考点',
      '多做长难句分析练习',
      '总结常见语法错误模式',
    ],
    logic: [
      '专项训练推断题和逻辑题',
      '学习识别论证结构（前提 - 结论）',
      '练习区分事实与观点',
    ],
    knowledge: [
      '系统复习托福各科核心知识点',
      '建立错题知识点笔记',
      '按主题分类复习阅读文章',
    ],
    carelessness: [
      '做题时圈出题干关键词',
      '排除明显错误选项后再选择',
      '养成复查习惯',
    ],
    time: [
      '进行限时模拟训练',
      '学会合理分配各题型时间',
      '先做简单题目，难题标记后回看',
    ],
  };
  return suggestions[category] || [];
}

/**
 * 调用 AI 生成个性化建议
 */
async function generateAISuggestions(wrongQuestions, sortedCategories, typeStats) {
  const key = getServerKey();
  const backend = resolveBackend({ provider: 'deepseek', apiKey: key });

  if (!backend || !key) {
    return { hasKey: false, suggestions: [] };
  }

  const questionsSummary = wrongQuestions.slice(0, 20).map((q, i) =>
    `#${i + 1} [${q.subject}/${q.type}/${q.difficulty}] ${q.content?.substring(0, 100)}...`
  ).join('\n');

  const prompt = `你是一位经验丰富的托福备考导师。请根据以下学生的错题数据，生成个性化的复习建议。

【薄弱类别】
${sortedCategories.map(([key, val]) => `  - ${val.label}（${key}）: ${val.count} 道错误`).join('\n')}

【薄弱题型 TOP 3】
${Object.entries(typeStats).slice(0, 3).map(([type, count]) => `  - ${type}: ${count} 次错误`).join('\n')}

【错题样例】
${questionsSummary}

请返回 JSON（只返回 JSON，不要其他文字）：
{"suggestions": ["建议1(中文)", "建议2", "建议3", "建议4", "建议5"]}`;

  try {
    const raw = await callAI(key, backend, prompt);
    const parsed = extractJSON(raw);
    if (parsed && parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return { hasKey: true, suggestions: parsed.suggestions };
    }
  } catch (e) {
    console.error('[Review-Push] AI 建议生成失败:', e.message);
  }

  return { hasKey: true, suggestions: [] };
}

function getServerKey() {
  try {
    const config = require('../config');
    return config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  } catch {
    return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  }
}

module.exports = router;
