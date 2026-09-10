const express = require('express');
const router = express.Router();

/**
 * Round 29: Full Mock Exam (全真模拟考试系统)
 * 
 * 功能：
 * 1. 全真模拟考试环境（计时、无提示）
 * 2. 四科完整套题（阅读+听力+口语+写作）
 * 3. 自动评分与解析
 * 4. 成绩对比与历史记录
 * 5. 考试设置（可配置科目/时间）
 */

// 科目配置
const SECTION_CONFIG = {
  reading: {
    name: '阅读',
    icon: '📖',
    duration: 60 * 60 * 1000, // 60分钟
    questions: 3,
    minScore: 0,
    maxScore: 30,
  },
  listening: {
    name: '听力',
    icon: '🎧',
    duration: 60 * 60 * 1000, // 60分钟
    questions: 2,
    minScore: 0,
    maxScore: 30,
  },
  speaking: {
    name: '口语',
    icon: '🗣️',
    duration: 20 * 60 * 1000, // 20分钟
    questions: 4,
    minScore: 0,
    maxScore: 30,
  },
  writing: {
    name: '写作',
    icon: '✍️',
    duration: 50 * 60 * 1000, // 50分钟
    questions: 2,
    minScore: 0,
    maxScore: 30,
  },
};

// 模拟考试配置
const MOCK_EXAM_CONFIG = [
  {
    id: 'mock-001',
    name: '托福全真模考 #1',
    level: 'standard',
    sections: ['reading', 'listening', 'speaking', 'writing'],
    totalDuration: 190 * 60 * 1000, // 190分钟
    questionCounts: { reading: 3, listening: 2, speaking: 4, writing: 2 },
    description: '完整托福考试模拟，含四科',
  },
  {
    id: 'mock-002',
    name: '托福阅读专项模考',
    level: 'practice',
    sections: ['reading'],
    totalDuration: 60 * 60 * 1000,
    questionCounts: { reading: 5 },
    description: '阅读专项训练，5篇长篇章',
  },
  {
    id: 'mock-003',
    name: '托福听力专项模考',
    level: 'practice',
    sections: ['listening'],
    totalDuration: 60 * 60 * 1000,
    questionCounts: { listening: 3 },
    description: '听力专项训练，含讲座和对话',
  },
  {
    id: 'mock-004',
    name: '托福口语冲刺模考',
    level: 'practice',
    sections: ['speaking'],
    totalDuration: 20 * 60 * 1000,
    questionCounts: { speaking: 6 },
    description: '口语专项训练，独立+综合',
  },
  {
    id: 'mock-005',
    name: '托福写作冲刺模考',
    level: 'practice',
    sections: ['writing'],
    totalDuration: 50 * 60 * 1000,
    questionCounts: { writing: 3 },
    description: '写作专项训练，综合+独立',
  },
];

// 模拟考试历史记录
const examHistory = [
  {
    id: 1,
    examId: 'mock-001',
    examName: '托福全真模考 #1',
    date: '2024-02-10T10:00:00Z',
    scores: { reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 },
    duration: 10800, // 180分钟
    status: 'completed',
  },
  {
    id: 2,
    examId: 'mock-001',
    examName: '托福全真模考 #2',
    date: '2024-02-17T10:00:00Z',
    scores: { reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
    duration: 10200, // 170分钟
    status: 'completed',
  },
  {
    id: 3,
    examId: 'mock-002',
    examName: '托福阅读专项模考',
    date: '2024-02-20T14:00:00Z',
    scores: { reading: 26, total: 26 },
    duration: 3420, // 57分钟
    status: 'completed',
  },
];

// 创建模拟考试实例
function createExamSession(examId) {
  const examTemplate = MOCK_EXAM_CONFIG.find(e => e.id === examId);
  if (!examTemplate) {
    throw new Error('模拟考试不存在');
  }

  return {
    sessionId: 'session-' + Date.now(),
    examId,
    examName: examTemplate.name,
    startTime: new Date().toISOString(),
    status: 'in-progress',
    sectionProgress: examTemplate.sections.reduce((acc, section) => {
      acc[section] = { status: 'not-started', currentQuestion: 0, totalQuestions: examTemplate.questionCounts[section] };
      return acc;
    }, {}),
    timer: examTemplate.totalDuration,
  };
}

// 计算考试分数
function calculateExamScores(sectionResults) {
  const scores = {};
  let total = 0;
  let count = 0;

  for (const [section, result] of Object.entries(sectionResults)) {
    if (SECTION_CONFIG[section]) {
      const config = SECTION_CONFIG[section];
      // 模拟分数计算（基于正确率和用时）
      const baseScore = (result.correctAnswers / result.totalQuestions) * config.maxScore;
      const timeBonus = result.elapsedTime < config.duration * 0.8 ? 2 : 0;
      scores[section] = Math.min(config.maxScore, Math.round(baseScore + timeBonus));
      total += scores[section];
      count++;
    }
  }

  scores.total = count > 0 ? Math.round(total / count) : 0;
  return scores;
}

// 获取考试等级
function getExamLevel(totalScore) {
  if (totalScore >= 100) return { level: '专家级', emoji: '👑', color: '#FFD700' };
  if (totalScore >= 90) return { level: '高级', emoji: '🌟', color: '#4ECDC4' };
  if (totalScore >= 80) return { level: '中高级', emoji: '🌳', color: '#95E1D3' };
  if (totalScore >= 70) return { level: '中级', emoji: '🌿', color: '#A8E6CF' };
  if (totalScore >= 60) return { level: '中级', emoji: '🌱', color: '#DCEDC1' };
  return { level: '初级', emoji: '🌰', color: '#FFB7B2' };
}

// 获取答题统计
function getExamStats(examId) {
  const relevantExams = examHistory.filter(e => e.examId === examId);
  const totalExams = relevantExams.length;
  
  if (totalExams === 0) {
    return { totalExams: 0, avgScore: 0, highestScore: 0, lowestScore: 0, trend: 'N/A' };
  }

  const scores = relevantExams.map(e => e.scores.total);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalExams);
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const trend = scores[scores.length - 1] > scores[0] ? '📈 上升' : 
                scores[scores.length - 1] < scores[0] ? '📉 下降' : '➡️ 持平';

  return { totalExams, avgScore, highestScore, lowestScore, trend };
}

// === API 路由 ===

// GET / - 获取模拟考试列表
router.get('/', (req, res) => {
  res.json({
    code: 0,
    data: {
      exams: MOCK_EXAM_CONFIG,
      totalExams: MOCK_EXAM_CONFIG.length,
      recommendedExam: MOCK_EXAM_CONFIG[0], // 推荐全真模考
    },
  });
});

// GET /:examId - 获取考试详情
router.get('/:examId', (req, res) => {
  const examId = req.params.examId;
  const exam = MOCK_EXAM_CONFIG.find(e => e.id === examId);
  
  if (!exam) {
    return res.status(404).json({
      code: 404,
      message: '模拟考试不存在',
    });
  }

  const stats = getExamStats(examId);

  res.json({
    code: 0,
    data: {
      ...exam,
      statistics: stats,
      sectionConfig: exam.sections.map(s => SECTION_CONFIG[s]),
    },
  });
});

// POST /start - 开始模拟考试
router.post('/start', (req, res) => {
  const { examId, config } = req.body;

  try {
    const session = createExamSession(examId);
    res.json({
      code: 0,
      data: {
        session,
        examTemplate: MOCK_EXAM_CONFIG.find(e => e.id === examId),
        message: '模拟考试已开启，请按要求完成',
      },
    });
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
});

// GET /session/:sessionId - 获取考试会话状态
router.get('/session/:sessionId', (req, res) => {
  // 模拟获取会话状态
  res.json({
    code: 0,
    data: {
      sessionId: req.params.sessionId,
      status: 'in-progress',
      elapsed: 3600, // 已用1小时
      remaining: 6600, // 剩余1小时50分钟
      currentSection: 'reading',
      currentQuestion: 2,
      totalQuestions: 11,
      progress: {
        reading: { completed: 1, total: 3 },
        listening: { completed: 0, total: 2 },
        speaking: { completed: 0, total: 4 },
        writing: { completed: 0, total: 2 },
      },
    },
  });
});

// POST /section/complete - 完成单个科目
router.post('/section/complete', (req, res) => {
  const { sessionId, section, answers, elapsedTime } = req.body;
  
  const sectionConfig = SECTION_CONFIG[section];
  if (!sectionConfig) {
    return res.status(400).json({ code: 400, message: '无效科目' });
  }

  // 模拟评分
  const correctAnswers = Math.floor(Math.random() * 3) + 2;
  const score = Math.min(sectionConfig.maxScore, Math.round((correctAnswers / 3) * sectionConfig.maxScore));

  res.json({
    code: 0,
    data: {
      section,
      score,
      maxScore: sectionConfig.maxScore,
      correctAnswers,
      totalQuestions: 3,
      elapsedTime,
      message: `${sectionConfig.name}科目已完成`,
    },
  });
});

// POST /submit - 提交完整考试
router.post('/submit', (req, res) => {
  const { sessionId, sectionResults } = req.body;
  
  const scores = calculateExamScores(sectionResults);
  const level = getExamLevel(scores.total);
  const now = new Date();

  const record = {
    id: examHistory.length + 1,
    examId: 'mock-001',
    examName: '全真模考',
    date: now.toISOString(),
    scores,
    duration: Object.values(sectionResults).reduce((sum, r) => sum + r.elapsedTime, 0),
    status: 'completed',
  };

  examHistory.push(record);

  res.json({
    code: 0,
    data: {
      ...record,
      level,
      recommendations: [
        { priority: 'high', suggestion: '加强阅读长难句分析', target: 28 },
        { priority: 'medium', suggestion: '提升听力笔记技巧', target: 25 },
        { priority: 'medium', suggestion: '口语独立任务多练习', target: 24 },
        { priority: 'low', suggestion: '写作增加词汇多样性', target: 24 },
      ],
      comparison: {
        previousScore: scores.total > 0 ? scores.total - Math.floor(Math.random() * 5) + 2 : null,
        improvement: scores.total - (scores.total > 0 ? scores.total - Math.floor(Math.random() * 5) + 2 : 0),
      },
    },
  });
});

// GET /history - 获取历史记录
router.get('/history', (req, res) => {
  res.json({
    code: 0,
    data: {
      records: examHistory.map(h => ({
        ...h,
        level: getExamLevel(h.scores.total),
      })),
      total: examHistory.length,
      latestScore: examHistory.length > 0 ? examHistory[examHistory.length - 1].scores.total : 0,
    },
  });
});

// GET /stats - 获取考试统计
router.get('/stats', (req, res) => {
  const totalExams = examHistory.length;
  const completedExams = examHistory.filter(e => e.status === 'completed').length;
  const avgScore = totalExams > 0 
    ? Math.round(examHistory.reduce((sum, e) => sum + e.scores.total, 0) / totalExams)
    : 0;
  const highestScore = totalExams > 0 
    ? Math.max(...examHistory.map(e => e.scores.total))
    : 0;
  const avgDuration = totalExams > 0
    ? Math.round(examHistory.reduce((sum, e) => sum + e.duration, 0) / totalExams)
    : 0;

  res.json({
    code: 0,
    data: {
      totalExams,
      completedExams,
      avgScore,
      highestScore,
      avgDuration: `${Math.round(avgDuration / 60)}分钟`,
      scoreDistribution: {
        '90-120': examHistory.filter(e => e.scores.total >= 90).length,
        '80-89': examHistory.filter(e => e.scores.total >= 80 && e.scores.total < 90).length,
        '70-79': examHistory.filter(e => e.scores.total >= 70 && e.scores.total < 80).length,
        '<70': examHistory.filter(e => e.scores.total < 70).length,
      },
      sectionAvg: {
        reading: totalExams > 0 ? Math.round(examHistory.reduce((s, e) => s + (e.scores.reading || 0), 0) / totalExams) : 0,
        listening: totalExams > 0 ? Math.round(examHistory.reduce((s, e) => s + (e.scores.listening || 0), 0) / totalExams) : 0,
        speaking: totalExams > 0 ? Math.round(examHistory.reduce((s, e) => s + (e.scores.speaking || 0), 0) / totalExams) : 0,
        writing: totalExams > 0 ? Math.round(examHistory.reduce((s, e) => s + (e.scores.writing || 0), 0) / totalExams) : 0,
      },
    },
  });
});

// GET /templates - 获取考试模板
router.get('/templates', (req, res) => {
  res.json({
    code: 0,
    data: {
      templates: MOCK_EXAM_CONFIG,
      customConfig: {
        maxSections: 4,
        minDuration: 30 * 60 * 1000,
        maxDuration: 240 * 60 * 1000,
        availableSections: Object.keys(SECTION_CONFIG),
      },
    },
  });
});

module.exports = router;
