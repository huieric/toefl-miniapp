const express = require('express');
const router = express.Router();

/**
 * Round 29: Daily Micro-learning (每日碎片学习系统)
 * 
 * 功能：
 * 1. 每日一句（TOEFL高频句型）
 * 2. 每日词汇（语境中学词）
 * 3. 每日挑战（3-5分钟练习）
 * 4. 连续打卡追踪
 * 5. 学习周报
 */

// 每日一句模板
const DAILY_QUOTES = [
  {
    id: 1,
    quote: 'The ability to think and think is the most basic tool of our survival.',
    translation: '思考的能力是我们生存的最基本工具。',
    source: '《TOEFL阅读真题》',
    keywords: ['ability', 'survival', 'basic'],
    vocabulary: [
      { word: 'ability', meaning: 'n. 能力', phonetic: '/əˈbɪləti/' },
      { word: 'survival', meaning: 'n. 生存', phonetic: '/səˈvaɪvl/' },
    ],
    difficulty: 'medium',
    type: 'sentence',
  },
  {
    id: 2,
    quote: 'Communication between cells is essential for the development of complex organisms.',
    translation: '细胞之间的交流对于复杂生物体的发展至关重要。',
    source: '《TOEFL听力讲座》',
    keywords: ['communication', 'essential', 'organism'],
    vocabulary: [
      { word: 'communication', meaning: 'n. 交流', phonetic: '/kəˌmjuːnɪˈkeɪʃn/' },
      { word: 'essential', meaning: 'adj. 必要的', phonetic: '/ɪˈsenʃl/' },
    ],
    difficulty: 'hard',
    type: 'sentence',
  },
  {
    id: 3,
    quote: 'The process of photosynthesis is fundamental to life on Earth.',
    translation: '光合作用过程是地球上生命的基础。',
    source: '《TOEFL阅读科学》',
    keywords: ['photosynthesis', 'fundamental', 'process'],
    vocabulary: [
      { word: 'photosynthesis', meaning: 'n. 光合作用', phonetic: '/ˌfoʊtoʊˈsɪnθəsɪs/' },
      { word: 'fundamental', meaning: 'adj. 基本的', phonetic: '/ˌfʌndəˈmentl/' },
    ],
    difficulty: 'hard',
    type: 'sentence',
  },
];

// 每日词汇
const DAILY_WORDS = [
  {
    id: 1,
    word: 'pragmatic',
    phonetic: '/præɡˈmætɪk/',
    meaning: 'adj. 务实的，实用的',
    example: 'We need a pragmatic approach to solve this problem.',
    context: 'In business meetings, pragmatic solutions are often preferred over idealistic ones.',
    synonyms: ['practical', 'realistic', 'sensible'],
    antonyms: ['idealistic', 'impractical'],
    collocations: ['pragmatic approach', 'pragmatic solution'],
    difficulty: 'medium',
  },
  {
    id: 2,
    word: 'meticulous',
    phonetic: '/məˈtɪkjələs/',
    meaning: 'adj. 一丝不苟的，细致的',
    example: 'The meticulous researcher spent years collecting data.',
    context: 'A meticulous student pays attention to every detail in their studies.',
    synonyms: ['thorough', 'careful', 'precise'],
    antonyms: ['careless', 'sloppy'],
    collocations: ['meticulous attention', 'meticulous work'],
    difficulty: 'hard',
  },
  {
    id: 3,
    word: 'ambiguous',
    phonetic: '/æmˈbɪɡjuəs/',
    meaning: 'adj. 模棱两可的，含糊的',
    example: 'The instructions were ambiguous and confusing.',
    context: 'In academic writing, ambiguous statements should be avoided.',
    synonyms: ['vague', 'unclear', 'equivocal'],
    antonyms: ['clear', 'definite', 'explicit'],
    collocations: ['ambiguous language', 'ambiguous result'],
    difficulty: 'medium',
  },
];

// 每日挑战模板
const DAILY_CHALLENGES = [
  {
    id: 'challenge-001',
    name: '快速词汇挑战',
    type: 'vocabulary',
    duration: 180, // 3分钟
    questions: 5,
    description: '在3分钟内完成5个词汇挑战',
    xpReward: 10,
  },
  {
    id: 'challenge-002',
    name: '长难句解析',
    type: 'grammar',
    duration: 300, // 5分钟
    questions: 3,
    description: '解析3个复杂长难句',
    xpReward: 15,
  },
  {
    id: 'challenge-003',
    name: '听力微训练',
    type: 'listening',
    duration: 240, // 4分钟
    questions: 2,
    description: '听一段短文并回答2个问题',
    xpReward: 12,
  },
  {
    id: 'challenge-004',
    name: '口语一句话',
    type: 'speaking',
    duration: 120, // 2分钟
    questions: 1,
    description: '用英语描述一个观点',
    xpReward: 8,
  },
];

// 用户打卡记录
const checkinRecords = [
  { date: '2024-02-05', completed: true, xpEarned: 25 },
  { date: '2024-02-06', completed: true, xpEarned: 30 },
  { date: '2024-02-07', completed: true, xpEarned: 20 },
  { date: '2024-02-08', completed: false, xpEarned: 0 },
  { date: '2024-02-09', completed: true, xpEarned: 28 },
  { date: '2024-02-10', completed: true, xpEarned: 35 },
  { date: '2024-02-11', completed: true, xpEarned: 22 },
];

// 获取当前连续打卡天数
function getStreak() {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < checkinRecords.length; i++) {
    const record = checkinRecords[checkinRecords.length - 1 - i];
    if (record.completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// 获取今日内容
function getTodaysContent(date) {
  const dayIndex = date.getDate() % DAILY_QUOTES.length;
  const wordIndex = date.getDate() % DAILY_WORDS.length;
  const challengeIndex = date.getDate() % DAILY_CHALLENGES.length;

  return {
    quote: DAILY_QUOTES[dayIndex],
    word: DAILY_WORDS[wordIndex],
    challenge: DAILY_CHALLENGES[challengeIndex],
  };
}

// 获取学习周报
function getWeeklyReport() {
  const weekRecords = checkinRecords.slice(-7);
  const totalXP = weekRecords.reduce((sum, r) => sum + r.xpEarned, 0);
  const totalCorrect = Math.floor(totalXP * 0.8); // 模拟数据
  const totalWords = weekRecords.filter(r => r.completed).length * 3; // 每天3个词
  const averageAccuracy = 85;

  return {
    totalXP,
    totalCorrect,
    totalWords,
    averageAccuracy,
    dailyAverages: {
      xp: Math.round(totalXP / weekRecords.length),
      words: totalWords / weekRecords.length,
      exercises: weekRecords.filter(r => r.completed).length * 3,
    },
    improvement: '+12% 相比上周',
    highlights: [
      '最长连续打卡：7天',
      '总词汇学习：87个',
      '总练习次数：45次',
    ],
  };
}

// === API 路由 ===

// GET /daily-quote - 获取每日一句
router.get('/daily-quote', (req, res) => {
  const content = getTodaysContent(new Date());
  
  res.json({
    code: 0,
    data: {
      quote: content.quote,
      date: new Date().toISOString().split('T')[0],
      isCompleted: checkinRecords[checkinRecords.length - 1]?.completed || false,
    },
  });
});

// GET /daily-word - 获取每日词汇
router.get('/daily-word', (req, res) => {
  const content = getTodaysContent(new Date());
  
  res.json({
    code: 0,
    data: {
      word: content.word,
      date: new Date().toISOString().split('T')[0],
      flashcard: {
        front: content.word,
        back: {
          meaning: content.word.meaning,
          example: content.word.example,
          phonetic: content.word.phonetic,
        },
      },
    },
  });
});

// GET /daily-challenge - 获取今日挑战
router.get('/daily-challenge', (req, res) => {
  const content = getTodaysContent(new Date());
  
  res.json({
    code: 0,
    data: {
      challenge: content.challenge,
      date: new Date().toISOString().split('T')[0],
      status: checkinRecords[checkinRecords.length - 1]?.completed ? 'completed' : 'pending',
      xpReward: content.challenge.xpReward,
    },
  });
});

// POST /complete-challenge - 完成挑战
router.post('/complete-challenge', (req, res) => {
  const { challengeId, score, accuracy } = req.body;
  const challenge = DAILY_CHALLENGES.find(c => c.id === challengeId);

  if (!challenge) {
    return res.status(404).json({
      code: 404,
      message: '挑战不存在',
    });
  }

  const xpEarned = Math.round(challenge.xpReward * (accuracy / 100));

  res.json({
    code: 0,
    data: {
      challengeId,
      xpEarned,
      streak: getStreak() + 1,
      message: '挑战完成！获得 ' + xpEarned + ' XP',
    },
  });
});

// GET /checkin - 获取打卡状态
router.get('/checkin', (req, res) => {
  const streak = getStreak();
  const longestStreak = Math.max(
    ...checkinRecords.filter((_, i, arr) => {
      // 计算最长连续打卡
      let maxStreak = 0;
      let currentStreak = 0;
      for (const record of arr) {
        currentStreak = record.completed ? currentStreak + 1 : 0;
        maxStreak = Math.max(maxStreak, currentStreak);
      }
      return maxStreak;
    })[0] || 0
  );

  res.json({
    code: 0,
    data: {
      currentStreak: streak,
      longestStreak: Math.max(streak, 7),
      totalDays: checkinRecords.filter(r => r.completed).length,
      todayStatus: checkinRecords[checkinRecords.length - 1]?.completed || false,
      calendar: checkinRecords.map(r => ({
        date: r.date,
        completed: r.completed,
      })),
    },
  });
});

// GET /week-report - 获取学习周报
router.get('/week-report', (req, res) => {
  res.json({
    code: 0,
    data: getWeeklyReport(),
  });
});

// GET /achievements - 获取碎片学习成就
router.get('/achievements', (req, res) => {
  res.json({
    code: 0,
    data: {
      achievements: [
        {
          id: 1,
          name: '初出茅庐',
          description: '完成第一次碎片学习',
          icon: '🎯',
          unlocked: true,
          date: '2024-01-15',
        },
        {
          id: 2,
          name: '三天打卡',
          description: '连续打卡3天',
          icon: '🔥',
          unlocked: true,
          date: '2024-01-18',
        },
        {
          id: 3,
          name: '一周达人',
          description: '连续打卡7天',
          icon: '⭐',
          unlocked: false,
          target: 7,
          progress: 7,
        },
        {
          id: 4,
          name: '词汇达人',
          description: '累计学习100个词汇',
          icon: '📚',
          unlocked: false,
          target: 100,
          progress: 67,
        },
        {
          id: 5,
          name: '百日冲刺',
          description: '连续打卡100天',
          icon: '🏆',
          unlocked: false,
          target: 100,
          progress: 12,
        },
      ],
      totalUnlocked: 2,
      totalAvailable: 5,
    },
  });
});

// GET /stats - 获取学习统计
router.get('/stats', (req, res) => {
  const completedRecords = checkinRecords.filter(r => r.completed);
  const totalXP = completedRecords.reduce((sum, r) => sum + r.xpEarned, 0);
  const totalWords = completedRecords.length * 3;
  const avgDailyXP = completedRecords.length > 0 
    ? Math.round(totalXP / completedRecords.length) 
    : 0;

  res.json({
    code: 0,
    data: {
      totalDays: completedRecords.length,
      currentStreak: getStreak(),
      totalXP,
      totalWords,
      avgDailyXP,
      challengeCompletion: Math.round(
        (completedRecords.length / checkinRecords.length) * 100
      ),
      weeklyTrend: [25, 30, 20, 0, 28, 35, 22].map((val, i) => ({
        day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        xp: val,
      })),
    },
  });
});

// GET /content/:date - 获取指定日期内容
router.get('/content/:date', (req, res) => {
  const date = new Date(req.params.date);
  const content = getTodaysContent(date);
  
  res.json({
    code: 0,
    data: {
      date: req.params.date,
      quote: content.quote,
      word: content.word,
      challenge: content.challenge,
    },
  });
});

module.exports = router;
