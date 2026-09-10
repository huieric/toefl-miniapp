/**
 * 错题本 AI 分析报告路由
 * GET/POST /api/analysis/wrong-book - 获取用户错题薄弱点分析报告
 * 基于 FSRS 错题数据和做题记录，生成薄弱点分析 + 改进建议
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const { callAI, resolveBackend, extractJSON } = require('../services/pdf-parser');
const db = require('../config/db');
const router = express.Router();

// GET/POST /api/analysis/wrong-book
router.route('/wrong-book')
  .get(auth, analyzeWrongBook)
  .post(auth, analyzeWrongBook);

async function analyzeWrongBook(req, res) {
  try {
    const userId = req.user.id;

    // 获取用户的错题数据（含题目信息）
    const wrongRes = await db.query(
      `SELECT wq.*, q.subject, q.type, q.difficulty, q.title, q.content, q.answer, q.analysis, q.passage_text
       FROM wrong_questions wq
       JOIN questions q ON wq.question_id = q.id
       WHERE wq.user_id = $1
       ORDER BY wq.created_at DESC
       LIMIT 100`,
      [userId]
    );
    const wrongQuestions = wrongRes.rows;

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return res.json({
        code: 200,
        data: {
          message: '暂无错题数据，开始做题后自动生成分析报告。',
          subjects: [],
          weakPoints: [],
          suggestions: [],
          focus: '请先完成至少 5 道练习，系统会自动记录错题并生成分析。',
        }
      });
    }

    // 获取用户的 FSRS 统计数据
    const statsRes = await db.query(
      `SELECT fsrs_stability, fsrs_difficulty, fsrs_interval, fsrs_reps, last_review_at
       FROM wrong_questions 
       WHERE user_id = $1
       ORDER BY last_review_at DESC NULLS LAST`,
      [userId]
    );
    const fsrsData = statsRes.rows;

    // 按科目统计
    const subjectStats = {};
    wrongQuestions.forEach(q => {
      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { total: 0, errors: 0, types: {} };
      }
      subjectStats[q.subject].total += 1;
      subjectStats[q.subject].errors += 1;
      const type = q.type || 'unknown';
      subjectStats[q.subject].types[type] = (subjectStats[q.subject].types[type] || 0) + 1;
    });

    const subjectSummary = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      errorCount: stats.errors,
      typeDistribution: stats.types,
      avgDifficulty: 'medium',
    }));

    // 按类型统计
    const typeStats = {};
    wrongQuestions.forEach(q => {
      const type = q.type || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    // 调用 AI 生成分析报告
    const aiResult = await generateAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData);

    res.json({
      code: 200,
      data: {
        totalWrong: wrongQuestions.length,
        subjects: subjectSummary,
        typeDistribution: typeStats,
        ...aiResult,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (e) {
    console.error('[WrongBook-Analysis] 路由错误:', e.message);
    res.status(500).json({ code: 500, message: '分析服务错误: ' + e.message });
  }
}

/**
 * 调用 AI 生成错题分析报告
 */
async function generateAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData) {
  const key = getServerKey();
  const backend = resolveBackend({ provider: 'deepseek', apiKey: key });

  if (!backend || !key) {
    // 降级为本地分析
    return generateLocalAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData);
  }

  // 构建错题摘要（限制长度避免 token 超限）
  const questionsSummary = wrongQuestions.slice(0, 30).map((q, i) => {
    const passage = q.passage_text ? ` [阅读篇章: ${q.passage_text.substring(0, 100)}...]` : '';
    return `#${i + 1} [${q.subject}/${q.type}] ${q.content?.substring(0, 150)}${passage}`;
  }).join('\n');

  const prompt = `你是一位经验丰富的托福备考导师。请根据以下学生的错题数据，生成一份薄弱点分析报告。

【错题统计】
总错题数：${wrongQuestions.length} 道

【各科错题分布】
${subjectSummary.map(s => `  - ${s.subject}: ${s.errorCount} 道 (题型: ${JSON.stringify(s.typeDistribution)})`).join('\n')}

【题型分布】
${Object.entries(typeStats).map(([type, count]) => `  - ${type}: ${count} 道`).join('\n')}

【错题样例（前30道）】
${questionsSummary}

【FSRS 数据摘要】
平均稳定性: ${fsrsData.filter(r => r.fsrs_stability).reduce((sum, r) => sum + parseFloat(r.fsrs_stability), 0) / Math.max(1, fsrsData.filter(r => r.fsrs_stability).length).toFixed(2)}
平均难度: ${fsrsData.filter(r => r.fsrs_difficulty).reduce((sum, r) => sum + parseFloat(r.fsrs_difficulty), 0) / Math.max(1, fsrsData.filter(r => r.fsrs_difficulty).length).toFixed(2)}

请返回 JSON 格式，不要添加任何额外文字：
{
  "subjects": [
    {"subject": "reading/listening/speaking/writing", "errorCount": 数字, "weakness": "薄弱点描述"}
  ],
  "weakPoints": ["薄弱点1(中文)", "薄弱点2", "薄弱点3"],
  "suggestions": ["改进建议1", "改进建议2", "改进建议3", "改进建议4"],
  "focus": "核心改进方向（1-2句话，中文）"
}`;

  try {
    const raw = await callAI(key, backend, prompt);
    const parsed = extractJSON(raw);
    if (parsed && parsed.subjects && parsed.weakPoints && parsed.suggestions && parsed.focus) {
      return parsed;
    }
    return generateLocalAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData);
  } catch (e) {
    console.error('[WrongBook-Analysis] AI 分析失败:', e.message);
    return generateLocalAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData);
  }
}

/**
 * 本地分析（降级方案，无需 AI）
 */
function generateLocalAnalysis(wrongQuestions, subjectSummary, typeStats, fsrsData) {
  const subjects = subjectSummary.map(s => ({
    subject: s.subject,
    errorCount: s.errorCount,
    weakness: s.subject === 'reading' ? '阅读理解细节题薄弱' :
              s.subject === 'listening' ? '听力笔记和细节抓取能力需提升' :
              s.subject === 'speaking' ? '口语表达流利度和逻辑性待加强' :
              '写作结构和词汇丰富度需要提升',
  }));

  const topType = Object.entries(typeStats).sort((a, b) => b[1] - a[1])[0];
  const weakPoints = [
    `${topType[0]} 类型题目错误最多（${topType[1]} 道）`,
    ...subjects.slice(0, 2).map(s => `${s.subject} 共 ${s.errorCount} 道错题`),
  ];

  const suggestions = [
    '针对薄弱环节进行专项训练，不要盲目刷题',
    '每道错题都要分析错因：知识盲区 / 理解偏差 / 粗心 / 时间不够',
    '利用 FSRS 复习排程，在遗忘临界点及时复习错题',
    '听力练习建议精听 + 跟读，阅读练习建议长难句分析',
  ];

  const focus = topType[0] === 'detail'
    ? '优先提升细节理解题的正确率，这是阅读和听力的基础'
    : topType[0] === 'inference'
    ? '加强推断题训练，学会从文章隐含信息中得出结论'
    : '全面提升各项能力，按错题数量优先处理薄弱科目';

  return { subjects, weakPoints, suggestions, focus };
}

/**
 * 错题自动归因分析
 * 分析每道错题的根本原因分类（词汇/语法/逻辑/知识点/粗心/时间）
 * GET /api/analysis/attribution
 */
router.get('/attribution', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const wrongRes = await db.query(
      `SELECT wq.*, q.subject, q.type, q.difficulty, q.title, q.content, q.answer, q.analysis, q.passage_text, q.options
       FROM wrong_questions wq
       JOIN questions q ON wq.question_id = q.id
       WHERE wq.user_id = $1
       ORDER BY wq.wrong_count DESC
       LIMIT 100`,
      [userId]
    );
    const wrongQuestions = wrongRes.rows;

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return res.json({
        code: 200,
        data: {
          message: '暂无错题数据，无法进行归因分析。',
          categories: [],
          perQuestion: [],
          summary: null,
        }
      });
    }

    // 自动归因分类
    const categories = {
      vocabulary: { count: 0, questions: [], label: '词汇障碍' },
      grammar: { count: 0, questions: [], label: '语法结构' },
      logic: { count: 0, questions: [], label: '逻辑推理' },
      knowledge: { count: 0, questions: [], label: '知识点盲区' },
      carelessness: { count: 0, questions: [], label: '粗心/审题' },
      time: { count: 0, questions: [], label: '时间压力' },
    };

    const perQuestion = wrongQuestions.map((w, i) => {
      const attribution = autoAttribute(w);
      categories[attribution.category].count++;
      categories[attribution.category].questions.push({
        index: i + 1,
        title: w.title,
        subject: w.subject,
        type: w.type,
        reason: attribution.reason,
        wrongCount: w.wrong_count,
      });
      return {
        index: i + 1,
        questionId: w.question_id,
        title: w.title,
        subject: w.subject,
        type: w.type,
        wrongCount: w.wrong_count,
        category: attribution.category,
        categoryLabel: categories[attribution.category].label,
        reason: attribution.reason,
      };
    });

    // 构建总结
    const sortedCategories = Object.entries(categories)
      .filter(([_, v]) => v.count > 0)
      .sort((a, b) => b[1].count - a[1].count);

    const totalWrong = wrongQuestions.length;
    const topCategories = sortedCategories.slice(0, 3).map(([key, val]) => ({
      key,
      label: val.label,
      count: val.count,
      percentage: Math.round(val.count / totalWrong * 100),
      suggestions: getCategorySuggestion(key),
    }));

    // 高频错题（wrong_count >= 2）
    const highFreqWrong = wrongQuestions
      .filter(w => w.wrong_count >= 2)
      .slice(0, 10)
      .map(w => ({
        questionId: w.question_id,
        title: w.title,
        subject: w.subject,
        wrongCount: w.wrong_count,
        attribution: perQuestion.find(p => p.questionId === w.question_id)?.categoryLabel,
      }));

    res.json({
      code: 200,
      data: {
        totalWrong,
        categories: topCategories,
        perQuestion,
        summary: {
          totalWrong,
          avgWrongCount: (wrongQuestions.reduce((s, w) => s + w.wrong_count, 0) / totalWrong).toFixed(1),
          topReason: topCategories[0]?.label || '暂无数据',
          topReasonCount: topCategories[0]?.count || 0,
          highFreqWrongCount: highFreqWrong.length,
        },
        highFreqWrong,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('[Attribution] 归因分析失败:', err);
    res.status(500).json({ code: 500, message: '归因分析服务错误: ' + err.message });
  }
});

/**
 * 自动归因：根据题目内容和错因线索推断原因
 */
function autoAttribute(question) {
  const content = (question.content || '').toLowerCase();
  const analysis = (question.analysis || '').toLowerCase();
  const title = (question.title || '').toLowerCase();
  const type = question.type || '';
  const subject = question.subject || '';

  // 关键词匹配规则
  const patterns = {
    vocabulary: [
      'vocab', 'word', 'meaning', 'define', 'definition', 'synonym', 'antonym',
      'vocabulary', 'terminology', 'jargon', 'connotation', 'denotation',
      '词汇', '单词', '词义', '同义词', '反义词', '词汇量',
    ],
    grammar: [
      'grammar', 'syntax', 'structure', 'sentence', 'clause', 'tense',
      'subject-verb', 'passive voice', 'conditional', 'parallel',
      '语法', '句型', '从句', '时态', '主谓', '被动语态', '倒装',
    ],
    logic: [
      'inference', 'imply', 'suggest', 'conclude', 'assumption',
      'strengthen', 'weaken', 'parallel', 'flaw', 'reasoning',
      '推断', '暗示', '结论', '假设', '加强', '削弱', '推理', '逻辑',
    ],
    knowledge: [
      'theory', 'concept', 'principle', 'fact', 'historical',
      'scientific', 'according to', 'research shows',
      '理论', '概念', '原理', '历史', '科学', '研究表明',
    ],
    carelessness: [
      'not', 'except', 'false', 'incorrect', 'wrong', 'least', 'maximum',
      '最小', '最大', 'except', '除了', '不正确的',
    ],
  };

  // 检查匹配
  for (const [category, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (content.includes(keyword) || analysis.includes(keyword) || title.includes(keyword)) {
        return {
          category,
          reason: getAttributionExplanation(category),
        };
      }
    }
  }

  // 基于题型推断
  if (type === 'inference' || type === 'purpose' || type === 'tone') {
    return {
      category: 'logic',
      reason: '推断题/主旨题错误，可能逻辑推理能力需要加强',
    };
  }
  if (type === 'detail' || type === 'factual') {
    return {
      category: 'knowledge',
      reason: '细节题错误，可能是相关知识点掌握不牢固',
    };
  }

  // 默认归因
  return {
    category: 'knowledge',
    reason: '综合分析后判断为知识点理解偏差',
  };
}

function getAttributionExplanation(category) {
  const explanations = {
    vocabulary: '题目涉及词汇或语义理解，建议扩大词汇量并学习词根词缀',
    grammar: '题目涉及语法结构分析，建议系统复习托福常考语法点',
    logic: '题目涉及逻辑推理，建议加强推断题和逻辑题训练',
    knowledge: '题目涉及特定知识点，建议系统复习相关学科背景',
    carelessness: '可能是审题不清或看错选项，建议养成标注关键词的习惯',
    time: '可能是时间压力导致判断失误，建议加强限时训练',
  };
  return explanations[category] || '待进一步分析';
}

function getCategorySuggestion(category) {
  const suggestions = {
    vocabulary: [
      '每天背诵20-30个托福高频词汇',
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
      '学习识别论证结构（前提-结论）',
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

function getServerKey() {
  try {
    const config = require('../config');
    return config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  } catch {
    return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  }
}

module.exports = router;
