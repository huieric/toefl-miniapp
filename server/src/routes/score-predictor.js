const express = require('express');
const router = express.Router();

/**
 * Round 28: Magoosh 风格托福分数预测系统
 * 
 * 功能：
 * 1. 基于练习数据的 TOEFL 总分预测
 * 2. 四科分数细分 (阅读/听力/口语/写作)
 * 3. 进步趋势分析
 * 4. 提分建议
 * 5. 目标分数追踪
 */

// 托福分数映射 (练习分数 → TOEFL 分数)
const SCORE_MAPPING = {
  reading: {
    min: 0,
    max: 30,
    conversion: (rawScore) => Math.min(30, Math.max(0, Math.round(rawScore * 0.85 + 3))),
  },
  listening: {
    min: 0,
    max: 30,
    conversion: (rawScore) => Math.min(30, Math.max(0, Math.round(rawScore * 0.82 + 3.5))),
  },
  speaking: {
    min: 0,
    max: 30,
    conversion: (rawScore) => Math.min(30, Math.max(0, Math.round(rawScore * 0.78 + 4))),
  },
  writing: {
    min: 0,
    max: 30,
    conversion: (rawScore) => Math.min(30, Math.max(0, Math.round(rawScore * 0.75 + 4.5))),
  },
};

// 模拟用户练习数据
const practiceData = {
  totalProblems: 458,
  correctProblems: 342,
  overallAccuracy: 74.7,
  streak: 12,
  lastPractice: new Date().toISOString(),
  sections: {
    reading: {
      problems: 125,
      correct: 95,
      accuracy: 76.0,
      avgTimePerQuestion: 18.5, // 分钟
      topicDistribution: {
        facts: 82,
        inferences: 68,
        vocabulary: 71,
        negative: 65,
        proseSummary: 58,
        fillBlanks: 52,
      },
    },
    listening: {
      problems: 118,
      correct: 88,
      accuracy: 74.6,
      avgTimePerQuestion: 1.5, // 分钟
      topicDistribution: {
        conversations: 78,
        lectures: 71,
        noteTaking: 69,
        inference: 73,
      },
    },
    speaking: {
      problems: 102,
      completed: 87,
      avgScore: 22.5, // TOEFL scale
      categories: {
        independent: { count: 45, avgScore: 23.2 },
        integrated: { count: 42, avgScore: 21.8 },
      },
    },
    writing: {
      problems: 113,
      completed: 72,
      avgScore: 21.0, // TOEFL scale
      categories: {
        integrated: { count: 38, avgScore: 22.1 },
        independent: { count: 34, avgScore: 19.9 },
      },
    },
  },
  history: [
    { date: '2024-01-01', reading: 22, listening: 21, speaking: 20, writing: 19, total: 82 },
    { date: '2024-01-08', reading: 23, listening: 22, speaking: 21, writing: 20, total: 86 },
    { date: '2024-01-15', reading: 23, listening: 22, speaking: 21, writing: 20, total: 86 },
    { date: '2024-01-22', reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 },
    { date: '2024-01-29', reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 },
    { date: '2024-02-05', reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
    { date: '2024-02-12', reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
  ],
};

// 计算预测分数
function calculatePredictedScore() {
  const readingScore = SCORE_MAPPING.reading.conversion(practiceData.sections.reading.accuracy);
  const listeningScore = SCORE_MAPPING.listening.conversion(practiceData.sections.listening.accuracy);
  const speakingScore = Math.round(practiceData.sections.speaking.avgScore * 10) / 10;
  const writingScore = Math.round(practiceData.sections.writing.avgScore * 10) / 10;
  const total = Math.round((readingScore + listeningScore + speakingScore + writingScore) * 10) / 10;

  return {
    reading: Math.round(readingScore * 10) / 10,
    listening: Math.round(listeningScore * 10) / 10,
    speaking: Math.round(speakingScore * 10) / 10,
    writing: Math.round(writingScore * 10) / 10,
    total: Math.round(total * 10) / 10,
  };
}

// 生成提分建议
function generateRecommendations(predictedScore) {
  const recommendations = [];
  const sections = predictedScore;

  // 阅读建议
  if (sections.reading < 25) {
    recommendations.push({
      priority: 'high',
      section: 'reading',
      suggestion: '加强长难句分析练习，重点提升推理题和句子插入题的正确率',
      targetPractice: '每天1篇阅读，限时完成',
      improvementWeeks: 2,
    });
  } else if (sections.reading < 28) {
    recommendations.push({
      priority: 'medium',
      section: 'reading',
      suggestion: '提升词汇量，练习快速定位答案的能力',
      targetPractice: '增加高频词汇背诵，练习略读和扫读',
      improvementWeeks: 1,
    });
  }

  // 听力建议
  if (sections.listening < 25) {
    recommendations.push({
      priority: 'high',
      section: 'listening',
      suggestion: '加强笔记技巧，多听学术讲座',
      targetPractice: '每天30分钟听力练习，侧重TPO讲座',
      improvementWeeks: 3,
    });
  } else if (sections.listening < 28) {
    recommendations.push({
      priority: 'medium',
      section: 'listening',
      suggestion: '提升多任务处理能力，边听边记笔记',
      targetPractice: '练习边听边总结要点',
      improvementWeeks: 2,
    });
  }

  // 口语建议
  if (sections.speaking < 24) {
    recommendations.push({
      priority: 'high',
      section: 'speaking',
      suggestion: '增加口语练习频率，重点练习综合口语的笔记整合',
      targetPractice: '每天15分钟口语练习，录音自测',
      improvementWeeks: 3,
    });
  } else if (sections.speaking < 26) {
    recommendations.push({
      priority: 'medium',
      section: 'speaking',
      suggestion: '优化回答结构，提升流利度',
      targetPractice: '使用模板练习，注意时间控制',
      improvementWeeks: 2,
    });
  }

  // 写作建议
  if (sections.writing < 24) {
    recommendations.push({
      priority: 'high',
      section: 'writing',
      suggestion: '加强综合写作的笔记整理，独立写作多积累素材',
      targetPractice: '每周2篇写作，对照范文修改',
      improvementWeeks: 3,
    });
  } else if (sections.writing < 27) {
    recommendations.push({
      priority: 'medium',
      section: 'writing',
      suggestion: '提升词汇多样性，注意语法准确性',
      targetPractice: '练习替换常用词汇，检查语法错误',
      improvementWeeks: 2,
    });
  }

  // 按优先级排序
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return recommendations;
}

// 获取等级评估
function getLevelAssessment(score) {
  const levels = [
    { min: 0, max: 50, level: '初级', emoji: '🌱' },
    { min: 51, max: 70, level: '中级', emoji: '🌿' },
    { min: 71, max: 85, level: '中高级', emoji: '🌳' },
    { min: 86, max: 95, level: '高级', emoji: '🌟' },
    { min: 96, max: 101, level: '专家级', emoji: '👑' },
  ];

  return levels.find(l => score >= l.min && score <= l.max) || levels[levels.length - 1];
}

// === API 路由 ===

// GET / - 获取预测分数概览
router.get('/', (req, res) => {
  const predictedScore = calculatePredictedScore();
  const recommendations = generateRecommendations(predictedScore);
  const level = getLevelAssessment(predictedScore.total);

  res.json({
    code: 0,
    data: {
      predictedScore,
      level,
      practiceStats: {
        totalProblems: practiceData.totalProblems,
        accuracy: practiceData.overallAccuracy,
        streak: practiceData.streak,
        lastPractice: practiceData.lastPractice,
      },
      recommendations: recommendations.slice(0, 3), // 只显示前3条建议
    },
  });
});

// GET /sections - 获取四科详细分析
router.get('/sections', (req, res) => {
  const sections = practiceData.sections;
  
  // 计算各科分数
  const readingScore = SCORE_MAPPING.reading.conversion(sections.reading.accuracy);
  const listeningScore = SCORE_MAPPING.listening.conversion(sections.listening.accuracy);

  res.json({
    code: 0,
    data: {
      reading: {
        ...sections.reading,
        toeflScore: Math.round(readingScore * 10) / 10,
        scorePercent: Math.round((readingScore / 30) * 100),
      },
      listening: {
        ...sections.listening,
        toeflScore: Math.round(listeningScore * 10) / 10,
        scorePercent: Math.round((listeningScore / 30) * 100),
      },
      speaking: {
        ...sections.speaking,
        toeflScore: Math.round(sections.speaking.avgScore * 10) / 10,
        scorePercent: Math.round((sections.speaking.avgScore / 30) * 100),
      },
      writing: {
        ...sections.writing,
        toeflScore: Math.round(sections.writing.avgScore * 10) / 10,
        scorePercent: Math.round((sections.writing.avgScore / 30) * 100),
      },
    },
  });
});

// GET /trend - 获取趋势数据
router.get('/trend', (req, res) => {
  res.json({
    code: 0,
    data: {
      history: practiceData.history,
      trend: {
        reading: { direction: 'up', change: 3, weeks: 7 },
        listening: { direction: 'up', change: 3, weeks: 7 },
        speaking: { direction: 'up', change: 3, weeks: 7 },
        writing: { direction: 'up', change: 3, weeks: 7 },
        total: { direction: 'up', change: 12, weeks: 7 },
      },
      averageWeeklyImprovement: 1.7,
      projectedScore: {
        date: '2024-04-01',
        total: 100,
        reading: 27,
        listening: 26,
        speaking: 25,
        writing: 24,
      },
    },
  });
});

// GET /recommendations - 获取完整提分建议
router.get('/recommendations', (req, res) => {
  const predictedScore = calculatePredictedScore();
  const recommendations = generateRecommendations(predictedScore);

  res.json({
    code: 0,
    data: {
      recommendations,
      totalScore: predictedScore.total,
      targetScore: 100,
      gap: Math.max(0, 100 - predictedScore.total),
      estimatedWeeks: recommendations.reduce((sum, r) => sum + r.improvementWeeks, 0),
    },
  });
});

// GET /mock-exam-prediction - 模拟考试分数预测
router.get('/mock-exam-prediction', (req, res) => {
  const mockResults = {
    reading: { rawScore: 28, totalQuestions: 40 },
    listening: { rawScore: 25, totalQuestions: 35 },
    speaking: { estimatedScore: 23 },
    writing: { estimatedScore: 22 },
  };

  const predictedScore = {
    reading: Math.min(30, Math.round(mockResults.reading.rawScore * 0.75 + 5)),
    listening: Math.min(30, Math.round(mockResults.listening.rawScore * 0.71 + 5)),
    speaking: mockResults.speaking.estimatedScore,
    writing: mockResults.writing.estimatedScore,
    total: 0,
  };

  predictedScore.total = predictedScore.reading + predictedScore.listening + 
                          predictedScore.speaking + predictedScore.writing;

  res.json({
    code: 0,
    data: {
      mockResults,
      predictedScore,
      level: getLevelAssessment(predictedScore.total),
      confidence: 85, // 预测置信度
      disclaimer: '此分数为基于练习数据的估算值，实际考试分数可能有所差异',
    },
  });
});

// POST /set-goal - 设置目标分数
router.post('/set-goal', (req, res) => {
  const { targetTotal, targetReading, targetListening, targetSpeaking, targetWriting } = req.body;

  res.json({
    code: 0,
    data: {
      goal: {
        targetTotal,
        targetReading: targetReading || targetTotal / 4,
        targetListening: targetListening || targetTotal / 4,
        targetSpeaking: targetSpeaking || targetTotal / 4,
        targetWriting: targetWriting || targetTotal / 4,
      },
      currentScore: calculatePredictedScore(),
      gap: {
        total: Math.max(0, (targetReading || 0) + (targetListening || 0) + 
                         (targetSpeaking || 0) + (targetWriting || 0) - 
                         calculatePredictedScore().total),
      },
    },
  });
});

module.exports = router;
