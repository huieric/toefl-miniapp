const axios = require('axios');
const config = require('../config');
const db = require('../config/db');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * 收集用户学习数据，用于 AI 分析
 */
async function gatherUserData(userId) {
  // 练习统计（按科目）
  const practiceStats = (await db.query(
    `SELECT subject,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE is_correct = true) as correct,
       AVG(score) FILTER (WHERE score IS NOT NULL) as avg_score
     FROM practice_records
     WHERE user_id = $1
     GROUP BY subject`,
    [userId]
  )).rows;

  // 最近 30 天练习趋势
  const trend = (await db.query(
    `SELECT DATE(created_at) as date,
       COUNT(*) as count,
       AVG(score) FILTER (WHERE score IS NOT NULL) as avg_score
     FROM practice_records
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [userId]
  )).rows;

  // 模考成绩
  const exams = (await db.query(
    `SELECT total_score, scores, started_at
     FROM exam_records
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY started_at DESC
     LIMIT 10`,
    [userId]
  )).rows;

  // 错题分布（按科目和题型，关联 questions 表获取科目信息）
  const wrongDist = (await db.query(
    `SELECT q.subject, q.type,
       COUNT(*) as wrong_count
     FROM wrong_questions wq
     JOIN questions q ON wq.question_id = q.id
     WHERE wq.user_id = $1
     GROUP BY q.subject, q.type
     ORDER BY wrong_count DESC`,
    [userId]
  )).rows;

  // 总体统计
  const overall = (await db.query(
    `SELECT
       (SELECT COUNT(*) FROM practice_records WHERE user_id = $1) as total_practice,
       (SELECT COUNT(*) FROM exam_records WHERE user_id = $1 AND status = 'completed') as total_exams,
       (SELECT COUNT(*) FROM wrong_questions WHERE user_id = $1) as total_wrong`,
    [userId]
  )).rows[0];

  return {
    practiceStats: practiceStats.map(r => ({
      subject: r.subject,
      total: parseInt(r.total),
      correct: parseInt(r.correct),
      accuracy: r.total > 0 ? Math.round((parseInt(r.correct) / parseInt(r.total)) * 100) : 0,
      avgScore: r.avg_score ? Math.round(parseFloat(r.avg_score) * 10) / 10 : null,
    })),
    trend: trend.map(r => ({
      date: r.date,
      count: parseInt(r.count),
      avgScore: r.avg_score ? Math.round(parseFloat(r.avg_score) * 10) / 10 : null,
    })),
    exams: exams.map(r => ({
      totalScore: r.total_score,
      scores: r.scores,
      date: r.started_at,
    })),
    wrongDist: wrongDist.map(r => ({
      subject: r.subject,
      type: r.type,
      count: parseInt(r.wrong_count),
    })),
    overall: {
      totalPractice: parseInt(overall.total_practice),
      totalExams: parseInt(overall.total_exams),
      totalWrong: parseInt(overall.total_wrong),
    },
  };
}

/**
 * 生成分数预测和薄弱环节分析
 */
async function generateAnalysis(userData) {
  const prompt = `你是一位资深托福备考导师，请根据以下用户学习数据，生成分数预测和个性化备考分析。

用户数据：
${JSON.stringify(userData, null, 2)}

请分析并输出以下内容（JSON格式）：

{
  "predictedScore": {
    "total": <0-120的预测总分>,
    "reading": <0-30>,
    "listening": <0-30>,
    "speaking": <0-30>,
    "writing": <0-30>
  },
  "weakAreas": [
    {
      "subject": "科目",
      "issue": "具体薄弱点描述",
      "severity": "high|medium|low",
      "suggestion": "改进建议"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "建议标题",
      "description": "详细说明",
      "action": "具体行动步骤",
      "estimatedTime": "预计所需时间"
    }
  ],
  "studyPlan": {
    "weeklyGoal": "本周目标",
    "dailyTasks": ["每日任务1", "每日任务2", "每日任务3"]
  },
  "encouragement": "一段鼓励的话"
}

注意：
- 如果数据不足（总练习量<10），给出基础评估并建议先多练习
- 分数预测要基于实际表现，不要过度乐观或悲观
- 建议要具体可执行，不要泛泛而谈
- 所有文字使用中文`;

  try {
    const response = await callOpenAI(prompt, 2000);
    const result = JSON.parse(response);
    return {
      predictedScore: result.predictedScore || { total: 0, reading: 0, listening: 0, speaking: 0, writing: 0 },
      weakAreas: result.weakAreas || [],
      recommendations: result.recommendations || [],
      studyPlan: result.studyPlan || { weeklyGoal: '', dailyTasks: [] },
      encouragement: result.encouragement || '继续加油！',
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[AI-Tutor] 分析生成失败:', err.message);
    return getDefaultAnalysis(userData);
  }
}

/**
 * 自由问答 - 用户可以向 AI 导师提问关于托福备考的问题
 */
async function askQuestion(userId, question, conversationHistory = []) {
  // 获取用户简要数据作为上下文
  const userData = await gatherUserData(userId);
  const contextSummary = `用户已练习${userData.overall.totalPractice}题，模考${userData.overall.totalExams}次，错题${userData.overall.totalWrong}道。各科正确率：${userData.practiceStats.map(s => `${s.subject} ${s.accuracy}%`).join('，') || '暂无数据'}`;

  // 构建对话消息
  const messages = [
    {
      role: 'system',
      content: `你是一位专业的托福备考导师，擅长根据学生的实际情况提供个性化指导。请用简洁、专业、鼓励的语气回答问题。

学生概况：${contextSummary}

回答要求：
- 回答控制在300字以内
- 如果问题与托福备考相关，结合学生实际数据给出针对性建议
- 如果问题无关托福，礼貌引导回备考话题
- 使用中文回答`,
    },
  ];

  // 添加历史对话（最近5轮）
  const recentHistory = conversationHistory.slice(-10);
  recentHistory.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });

  messages.push({ role: 'user', content: question });

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.5,
        max_tokens: 600,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return {
      answer: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  } catch (err) {
    console.error('[AI-Tutor] 问答失败:', err.message);
    return {
      answer: '抱歉，AI 导师暂时无法回复。请稍后再试，或先去练习几道题积累数据，我能给你更精准的建议。',
    };
  }
}

/**
 * 调用 OpenAI API
 */
async function callOpenAI(prompt, maxTokens = 1000) {
  if (!config.openaiApiKey) {
    throw new Error('未配置OPENAI_API_KEY');
  }

  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: maxTokens,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * 默认分析（API 不可用时的降级）
 */
function getDefaultAnalysis(userData) {
  const subjects = ['reading', 'listening', 'speaking', 'writing'];
  const subjectNames = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' };

  // 基于练习数据计算粗略预测
  const predictedScore = { total: 0, reading: 0, listening: 0, speaking: 0, writing: 0 };
  subjects.forEach(sub => {
    const stat = userData.practiceStats.find(s => s.subject === sub);
    if (stat && stat.avgScore) {
      predictedScore[sub] = stat.avgScore;
    } else if (stat && stat.accuracy) {
      predictedScore[sub] = Math.round(stat.accuracy / 100 * 30);
    } else {
      predictedScore[sub] = 15;
    }
  });
  predictedScore.total = predictedScore.reading + predictedScore.listening +
    predictedScore.speaking + predictedScore.writing;

  const weakAreas = subjects
    .map(sub => {
      const stat = userData.practiceStats.find(s => s.subject === sub);
      const accuracy = stat ? stat.accuracy : 0;
      const wrongCount = userData.wrongDist.filter(w => w.subject === sub).reduce((sum, w) => sum + w.count, 0);
      return {
        subject: subjectNames[sub],
        issue: accuracy < 50 ? `${subjectNames[sub]}正确率偏低(${accuracy}%)，需要加强基础` :
               accuracy < 70 ? `${subjectNames[sub]}有一定基础但不够稳定` :
               wrongCount > 5 ? `${subjectNames[sub]}错题较多，需要针对性复习` :
               `${subjectNames[sub]}表现尚可，保持练习`,
        severity: accuracy < 50 ? 'high' : accuracy < 70 ? 'medium' : 'low',
        suggestion: accuracy < 50 ? '建议从基础题型开始，每天练习并仔细分析错因' :
                    '建议针对薄弱题型进行专项训练',
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

  return {
    predictedScore,
    weakAreas,
    recommendations: [
      { priority: 1, title: '坚持每日练习', description: '保持每天至少30分钟的练习量', action: '从薄弱科目开始练习', estimatedTime: '30分钟/天' },
      { priority: 2, title: '定期模考', description: '每周进行一次完整模考检验水平', action: '在模拟考试模块开始', estimatedTime: '2小时/周' },
      { priority: 3, title: '错题复盘', description: '定期回顾错题本，避免重复犯错', action: '在错题本模块重做错题', estimatedTime: '15分钟/天' },
    ],
    studyPlan: {
      weeklyGoal: '本周完成各科至少20道练习题',
      dailyTasks: ['薄弱科目专项练习 30分钟', '错题复习 15分钟', '听力/阅读精练 20分钟'],
    },
    encouragement: '数据积累还不够多，继续练习，AI 导师会给你更精准的分析！',
    generatedAt: new Date().toISOString(),
    isDefault: true,
  };
}

module.exports = { gatherUserData, generateAnalysis, askQuestion };
