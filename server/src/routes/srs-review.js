const express = require('express');
const router = express.Router();

/**
 * Round 28: Enhanced SRS (间隔重复复习系统)
 * 
 * 功能：
 * 1. 基于艾宾浩斯遗忘曲线的智能复习调度
 * 2. 卡片复习评分 (再次/困难/良好/简单)
 * 3. 复习进度追踪
 * 4. 记忆保留率统计
 * 5. 每日复习计划
 */

// SRS 参数配置 (基于 FSRS 简化版)
const SRS_CONFIG = {
  intervals: {
    again: { multiplier: 1, maxInterval: 1 }, // 1天
    hard: { multiplier: 1.2, maxInterval: 7 },
    good: { multiplier: 2.5, maxInterval: 30 },
    easy: { multiplier: 4, maxInterval: 90 },
  },
  decay: 0.9, // 记忆衰减率
  difficulty: {
    again: 1.0,
    hard: 1.0,
    good: 0.8,
    easy: 0.5,
  },
};

// 模拟卡片数据 (生词卡片)
const flashcards = [
  {
    id: 1,
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    meaning: 'adj. 无处不在的',
    example: 'Smartphones are ubiquitous in modern society.',
    category: 'TOEFL核心词汇',
    level: 'advanced',
    easeFactor: 2.5,
    stability: 5.2,
    difficulty: 7.0,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    timesCorrect: 0,
    timesIncorrect: 0,
  },
  {
    id: 2,
    word: 'ephemeral',
    phonetic: '/ɪˈfemərəl/',
    meaning: 'adj. 短暂的',
    example: 'Fame is ephemeral in the entertainment industry.',
    category: 'TOEFL核心词汇',
    level: 'advanced',
    easeFactor: 2.3,
    stability: 3.1,
    difficulty: 8.0,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    timesCorrect: 0,
    timesIncorrect: 0,
  },
  {
    id: 3,
    word: 'pragmatic',
    phonetic: '/præɡˈmætɪk/',
    meaning: 'adj. 务实的',
    example: 'We need a pragmatic approach to solve this problem.',
    category: 'TOEFL核心词汇',
    level: 'intermediate',
    easeFactor: 2.6,
    stability: 8.5,
    difficulty: 5.0,
    interval: 3,
    repetitions: 2,
    nextReview: new Date().toISOString(),
    lastReview: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    timesCorrect: 2,
    timesIncorrect: 0,
  },
  {
    id: 4,
    word: 'juxtapose',
    phonetic: '/ˌdʒʌkstəˈpoʊz/',
    meaning: 'v. 并列；并置',
    example: 'The artist juxtaposed light and dark colors.',
    category: 'TOEFL高频词汇',
    level: 'advanced',
    easeFactor: 2.2,
    stability: 1.5,
    difficulty: 9.0,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    timesCorrect: 0,
    timesIncorrect: 1,
  },
  {
    id: 5,
    word: 'ameliorate',
    phonetic: '/əˈmiːliəreɪt/',
    meaning: 'v. 改善；改进',
    example: 'Steps were taken to ameliorate the situation.',
    category: 'TOEFL高频词汇',
    level: 'advanced',
    easeFactor: 2.4,
    stability: 4.2,
    difficulty: 7.5,
    interval: 1,
    repetitions: 1,
    nextReview: new Date().toISOString(),
    lastReview: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    timesCorrect: 1,
    timesIncorrect: 0,
  },
];

// 计算下次复习时间
function calculateNextInterval(currentInterval, rating, easeFactor) {
  let newInterval;
  
  switch (rating) {
    case 'again':
      newInterval = 1; // 下次复习
      break;
    case 'hard':
      newInterval = Math.min(
        Math.round(currentInterval * SRS_CONFIG.intervals.hard.multiplier),
        SRS_CONFIG.intervals.hard.maxInterval
      );
      break;
    case 'good':
      newInterval = Math.min(
        Math.round(currentInterval * SRS_CONFIG.intervals.good.multiplier),
        SRS_CONFIG.intervals.good.maxInterval
      );
      break;
    case 'easy':
      newInterval = Math.min(
        Math.round(currentInterval * SRS_CONFIG.intervals.easy.multiplier),
        SRS_CONFIG.intervals.easy.maxInterval
      );
      break;
    default:
      newInterval = currentInterval || 1;
  }
  
  return newInterval || 1;
}

// 更新卡片 SRS 参数
function updateCardParams(card, rating) {
  const config = SRS_CONFIG.difficulty[rating] || SRS_CONFIG.difficulty.good;
  
  const newEaseFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - config) * (0.08 + (5 - config) * 0.02)));
  const newDifficulty = Math.min(10, Math.max(1, card.difficulty + (1 - config) * 0.3));
  const newStability = card.stability * (1 + 0.1 * (rating === 'easy' ? 1 : rating === 'good' ? 0.5 : rating === 'hard' ? -0.3 : -0.8));
  const newRepetitions = rating === 'again' ? 0 : card.repetitions + 1;
  const newInterval = calculateNextInterval(card.interval || 1, rating, card.easeFactor);
  
  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    difficulty: Math.round(newDifficulty * 100) / 100,
    stability: Math.round(newStability * 100) / 100,
    repetitions: newRepetitions,
    interval: newInterval,
    nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString(),
    lastReview: new Date().toISOString(),
    timesCorrect: rating !== 'again' ? card.timesCorrect + 1 : card.timesCorrect,
    timesIncorrect: rating === 'again' ? card.timesIncorrect + 1 : card.timesIncorrect,
  };
}

// 获取今日需复习卡片
function getDueCards() {
  const now = new Date();
  return flashcards.filter(card => {
    const nextReview = new Date(card.nextReview);
    return nextReview <= now;
  });
}

// 获取复习统计
function getReviewStats() {
  const dueCards = getDueCards();
  const totalCards = flashcards.length;
  const masteredCards = flashcards.filter(c => c.interval >= 21 && c.repetitions >= 3);
  const learningCards = flashcards.filter(c => c.repetitions < 3);
  const retentionRate = flashcards.reduce((sum, card) => {
    const total = card.timesCorrect + card.timesIncorrect;
    return sum + (total > 0 ? card.timesCorrect / total : 1);
  }, 0) / totalCards;

  return {
    totalCards,
    dueCards: dueCards.length,
    masteredCards: masteredCards.length,
    learningCards: learningCards.length,
    retentionRate: Math.round(retentionRate * 100),
    todayProgress: {
      reviewed: Math.floor(Math.random() * 10) + 5,
      target: 20,
      percent: Math.min(100, Math.round(((Math.floor(Math.random() * 10) + 5) / 20) * 100)),
    },
  };
}

// === API 路由 ===

// GET / - 获取 SRS 配置
router.get('/', (req, res) => {
  res.json({
    code: 0,
    data: {
      config: SRS_CONFIG,
      cardCount: flashcards.length,
    },
  });
});

// GET /due - 获取今日待复习卡片
router.get('/due', (req, res) => {
  const dueCards = getDueCards();
  
  res.json({
    code: 0,
    data: {
      cards: dueCards.map(card => ({
        id: card.id,
        word: card.word,
        phonetic: card.phonetic,
        meaning: card.meaning,
        example: card.example,
        category: card.category,
        level: card.level,
      })),
      total: dueCards.length,
    },
  });
});

// POST /review - 提交复习评分
router.post('/review', (req, res) => {
  const { cardId, rating } = req.body;
  const card = flashcards.find(c => c.id === cardId);
  
  if (!card) {
    return res.status(404).json({
      code: 404,
      message: '卡片不存在',
    });
  }

  if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
    return res.status(400).json({
      code: 400,
      message: '无效的评分选项',
    });
  }

  const oldParams = {
    easeFactor: card.easeFactor,
    stability: card.stability,
    difficulty: card.difficulty,
    interval: card.interval,
    repetitions: card.repetitions,
  };

  const updatedParams = updateCardParams(card, rating);
  Object.assign(card, updatedParams);

  res.json({
    code: 0,
    data: {
      cardId,
      rating,
      previous: oldParams,
      current: updatedParams,
      nextReview: card.nextReview,
    },
  });
});

// GET /stats - 获取复习统计
router.get('/stats', (req, res) => {
  const stats = getReviewStats();
  
  // 添加历史数据用于趋势图
  const history = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date: date.toISOString().split('T')[0],
      reviewed: Math.floor(Math.random() * 15) + 5,
      correct: Math.floor(Math.random() * 12) + 3,
      retention: Math.floor(Math.random() * 20) + 70,
    };
  });

  res.json({
    code: 0,
    data: {
      ...stats,
      history,
    },
  });
});

// GET /card/:id - 获取卡片详情
router.get('/card/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const card = flashcards.find(c => c.id === cardId);
  
  if (!card) {
    return res.status(404).json({
      code: 404,
      message: '卡片不存在',
    });
  }

  res.json({
    code: 0,
    data: {
      ...card,
      retention: card.timesCorrect + card.timesIncorrect > 0
        ? Math.round((card.timesCorrect / (card.timesCorrect + card.timesIncorrect)) * 100)
        : 100,
    },
  });
});

// GET /progress - 获取学习进度
router.get('/progress', (req, res) => {
  const totalCards = flashcards.length;
  const masteredCards = flashcards.filter(c => c.interval >= 21 && c.repetitions >= 3);
  const learningCards = flashcards.filter(c => c.repetitions > 0 && c.repetitions < 3);
  const newCards = flashcards.filter(c => c.repetitions === 0);

  res.json({
    code: 0,
    data: {
      total: totalCards,
      mastered: masteredCards.length,
      learning: learningCards.length,
      new: newCards.length,
      masteredPercent: Math.round((masteredCards.length / totalCards) * 100),
      streak: {
        current: 12,
        longest: 28,
        lastReview: new Date().toISOString(),
      },
      weeklyGoal: {
        target: 100,
        completed: 67,
        percent: 67,
        daysRemaining: 3,
      },
    },
  });
});

// GET /schedule - 获取复习计划
router.get('/schedule', (req, res) => {
  const today = new Date();
  const schedule = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dueCount = Math.floor(Math.random() * 15) + 5;
    return {
      date: date.toISOString().split('T')[0],
      isToday: i === 0,
      dueCards: dueCount,
      newCards: Math.floor(Math.random() * 5) + 1,
      estimatedTime: dueCount * 2, // 假设每题2分钟
    };
  });

  res.json({
    code: 0,
    data: { schedule },
  });
});

module.exports = router;
