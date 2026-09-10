const express = require('express');
const router = express.Router();

/**
 * Round 30: Intensive Listening Mode (听力精听模式)
 * 
 * 功能：
 * 1. 逐句播放/暂停
 * 2. 听写模式（盲听填写）
 * 3. 变速播放 (0.5x - 1.5x)
 * 4. 关键词高亮
 * 5. 听写评分
 */

// 精听段落库
const INTENSIVE_PASSES = [
  {
    id: 'listen-001',
    title: '校园公告 - 图书馆搬迁',
    difficulty: 'easy',
    level: 'pre',
    sections: [
      {
        index: 1,
        text: 'Attention all students, this is an announcement from the university library.',
        keywords: ['attention', 'students', 'announcement', 'university', 'library'],
        vocabulary: [
          { word: 'announcement', meaning: 'n. 公告', phonetic: '/əˌnaʊnsˈmənt/' },
          { word: 'university', meaning: 'n. 大学', phonetic: '/ˌjuːnɪˈvɜːrsəti/' },
        ],
        wordCount: 12,
      },
      {
        index: 2,
        text: 'Due to the upcoming renovation project, the main library will be closed from March 1st to April 15th.',
        keywords: ['renovation', 'closed', 'March', 'April'],
        vocabulary: [
          { word: 'renovation', meaning: 'n. 翻新', phonetic: '/ˌrenəˈveɪʃn/' },
          { word: 'upcoming', meaning: 'adj. 即将发生的', phonetic: '/ʌpˌkʌmɪŋ/' },
        ],
        wordCount: 16,
      },
      {
        index: 3,
        text: 'During this period, all services including book borrowing and returns will be temporarily suspended.',
        keywords: ['services', 'borrowing', 'returns', 'temporarily', 'suspended'],
        vocabulary: [
          { word: 'temporarily', meaning: 'adv. 暂时地', phonetic: '/ˈtempəreri/' },
          { word: 'suspended', meaning: 'v. 暂停', phonetic: '/səˈspendɪd/' },
        ],
        wordCount: 14,
      },
      {
        index: 4,
        text: 'Students with urgent needs can use the branch library on the north campus.',
        keywords: ['urgent', 'branch', 'library', 'north', 'campus'],
        vocabulary: [
          { word: 'urgent', meaning: 'adj. 紧急的', phonetic: '/ˈɜːrdʒənt/' },
          { word: 'branch', meaning: 'n. 分支', phonetic: '/bræntʃ/' },
        ],
        wordCount: 13,
      },
    ],
    totalWordCount: 55,
    estimatedDuration: 45, // seconds
  },
  {
    id: 'listen-002',
    title: '学术讲座 - 气候变化',
    difficulty: 'hard',
    level: 'advanced',
    sections: [
      {
        index: 1,
        text: 'Good morning everyone. Today I want to talk about the accelerating pace of climate change and its impact on biodiversity.',
        keywords: ['accelerating', 'climate', 'change', 'impact', 'biodiversity'],
        vocabulary: [
          { word: 'accelerating', meaning: 'v. 加速', phonetic: '/əkˈseləreɪtɪŋ/' },
          { word: 'biodiversity', meaning: 'n. 生物多样性', phonetic: '/ˌbaɪoʊdaɪˈvɜːrsəti/' },
        ],
        wordCount: 16,
      },
      {
        index: 2,
        text: 'Recent studies indicate that species extinction rates are now 1000 times higher than the natural background rate.',
        keywords: ['studies', 'indicate', 'species', 'extinction', 'natural'],
        vocabulary: [
          { word: 'indicate', meaning: 'v. 表明', phonetic: '/ˈɪndɪkeɪt/' },
          { word: 'extinction', meaning: 'n. 灭绝', phonetic: '/ɪkˈstɪŋkʃn/' },
        ],
        wordCount: 14,
      },
      {
        index: 3,
        text: 'The primary drivers include habitat destruction, pollution, and rising global temperatures.',
        keywords: ['primary', 'drivers', 'habitat', 'destruction', 'pollution', 'temperatures'],
        vocabulary: [
          { word: 'destruction', meaning: 'n. 破坏', phonetic: '/dɪˈstrʌkʃn/' },
          { word: 'pollution', meaning: 'n. 污染', phonetic: '/pəˈluːʃn/' },
        ],
        wordCount: 11,
      },
    ],
    totalWordCount: 41,
    estimatedDuration: 35,
  },
];

// 听写答案
const DICTATION_ANSWERS = {
  'listen-001': [
    'Attention all students, this is an announcement from the university library.',
    'Due to the upcoming renovation project, the main library will be closed from March first to April fifteenth.',
    'During this period, all services including book borrowing and returns will be temporarily suspended.',
    'Students with urgent needs can use the branch library on the north campus.',
  ],
  'listen-002': [
    'Good morning everyone. Today I want to talk about the accelerating pace of climate change and its impact on biodiversity.',
    'Recent studies indicate that species extinction rates are now one thousand times higher than the natural background rate.',
    'The primary drivers include habitat destruction, pollution, and rising global temperatures.',
  ],
};

// 变速设置
const PLAYBACK_RATES = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0, default: true },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

// 用户听写记录
const dictationRecords = [
  {
    id: 1,
    passId: 'listen-001',
    date: '2024-02-15T10:00:00Z',
    mode: 'dictation',
    accuracy: 85,
    totalTime: 300,
    completed: true,
  },
  {
    id: 2,
    passId: 'listen-001',
    date: '2024-02-18T14:00:00Z',
    mode: 'intensive',
    accuracy: 92,
    totalTime: 420,
    completed: true,
  },
];

// 计算听写准确率
function calculateDictationAccuracy(transcript, answer) {
  const transcriptWords = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const answerWords = answer.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  
  let correct = 0;
  const maxLen = Math.max(transcriptWords.length, answerWords.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (transcriptWords[i] === answerWords[i]) correct++;
  }
  
  return Math.round((correct / maxLen) * 100);
}

// 获取精听统计
function getIntensiveStats() {
  const totalSessions = dictationRecords.length;
  const avgAccuracy = totalSessions > 0 
    ? Math.round(dictationRecords.reduce((sum, r) => sum + r.accuracy, 0) / totalSessions)
    : 0;
  const totalTime = dictationRecords.reduce((sum, r) => sum + r.totalTime, 0);
  const totalMinutes = Math.round(totalTime / 60);
  const avgTimePerSession = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  return {
    totalSessions,
    avgAccuracy,
    totalMinutes,
    avgTimePerSession: `${Math.round(avgTimePerSession / 60)}分钟`,
    recentTrend: [80, 85, 90, 88, 92].map((a, i) => ({
      day: ['周一', '周二', '周三', '周四', '周五'][i],
      accuracy: a,
    })),
    levelBreakdown: {
      easy: dictationRecords.filter(r => INTENSIVE_PASSES.find(p => p.id === r.passId)?.difficulty === 'easy').length,
      medium: dictationRecords.filter(r => INTENSIVE_PASSES.find(p => p.id === r.passId)?.difficulty === 'medium').length,
      hard: dictationRecords.filter(r => INTENSIVE_PASSES.find(p => p.id === r.passId)?.difficulty === 'hard').length,
    },
  };
}

// === API 路由 ===

// GET / - 获取精听段落列表
router.get('/', (req, res) => {
  res.json({
    code: 0,
    data: {
      passes: INTENSIVE_PASSES.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        level: p.level,
        sectionCount: p.sections.length,
        totalWordCount: p.totalWordCount,
        estimatedDuration: p.estimatedDuration,
      })),
      stats: getIntensiveStats(),
    },
  });
});

// GET /:id - 获取精听段落详情
router.get('/:id', (req, res) => {
  const pass = INTENSIVE_PASSES.find(p => p.id === req.params.id);
  
  if (!pass) {
    return res.status(404).json({
      code: 404,
      message: '精听段落不存在',
    });
  }

  res.json({
    code: 0,
    data: {
      id: pass.id,
      title: pass.title,
      difficulty: pass.difficulty,
      level: pass.level,
      sections: pass.sections,
      totalWordCount: pass.totalWordCount,
      estimatedDuration: pass.estimatedDuration,
      playbackRates: PLAYBACK_RATES,
    },
  });
});

// POST /dictation - 提交听写答案
router.post('/dictation', (req, res) => {
  const { passId, answers } = req.body;
  
  const trueAnswers = DICTATION_ANSWERS[passId];
  if (!trueAnswers) {
    return res.status(404).json({ code: 404, message: '段落不存在' });
  }

  const sectionAccuracies = answers.map((userAnswer, idx) => ({
    sectionIndex: idx + 1,
    accuracy: calculateDictationAccuracy(userAnswer, trueAnswers[idx]),
  }));

  const overallAccuracy = Math.round(
    sectionAccuracies.reduce((sum, s) => sum + s.accuracy, 0) / sectionAccuracies.length
  );

  const record = {
    id: dictationRecords.length + 1,
    passId,
    date: new Date().toISOString(),
    mode: 'dictation',
    accuracy: overallAccuracy,
    totalTime: Object.values(answers).reduce((sum, a) => sum + (a.length * 10), 0),
    completed: true,
  };

  dictationRecords.push(record);

  res.json({
    code: 0,
    data: {
      ...record,
      sectionAccuracies,
      overallAccuracy,
      rating: overallAccuracy >= 95 ? 'S' : 
              overallAccuracy >= 85 ? 'A' : 
              overallAccuracy >= 70 ? 'B' : 'C',
    },
  });
});

// GET /records - 获取听写记录
router.get('/records', (req, res) => {
  res.json({
    code: 0,
    data: {
      records: dictationRecords,
      total: dictationRecords.length,
      stats: getIntensiveStats(),
    },
  });
});

// POST /start - 开始精听会话
router.post('/start', (req, res) => {
  const { passId, mode, playbackRate } = req.body;
  
  res.json({
    code: 0,
    data: {
      sessionId: 'session-' + Date.now(),
      passId,
      mode: mode || 'intensive',
      playbackRate: playbackRate || 1.0,
      status: 'active',
      startTime: new Date().toISOString(),
    },
  });
});

// POST /section/complete - 完成单句精听
router.post('/section/complete', (req, res) => {
  const { sessionId, sectionIndex, transcription, mode } = req.body;
  
  res.json({
    code: 0,
    data: {
      sectionIndex,
      mode,
      status: 'completed',
      wordCount: transcription?.split(/\s+/).length || 0,
      timeSpent: 30, // 模拟
    },
  });
});

// GET /stats - 获取统计
router.get('/stats', (req, res) => {
  res.json({
    code: 0,
    data: getIntensiveStats(),
  });
});

module.exports = router;
