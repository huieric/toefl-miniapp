const express = require('express');
const router = express.Router();

/**
 * Round 28: Duolingo 风格联赛系统
 * 
 * 功能：
 * 1. 联赛段位系统 (青铜→白银→黄金→铂金→钻石→大师)
 * 2. 周赛排名和积分计算
 * 3. 升级/降级机制
 * 4. 联赛成就
 * 5. 排行榜
 */

// 联赛段位配置
const LEAGUE_TIERS = [
  { name: '青铜联赛', icon: '🥉', minXP: 0, color: '#CD7F32' },
  { name: '白银联赛', icon: '🥈', minXP: 500, color: '#C0C0C0' },
  { name: '黄金联赛', icon: '🥇', minXP: 1500, color: '#FFD700' },
  { name: '铂金联赛', icon: '💎', minXP: 3000, color: '#B9F2FF' },
  { name: '钻石联赛', icon: '💠', minXP: 6000, color: '#B9F2FF' },
  { name: '大师联赛', icon: '👑', minXP: 10000, color: '#FF6B6B' },
];

// 每周重置日期计算
function getWeeklyResetDate() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  const daysUntilSunday = 7 - dayOfWeek;
  const resetDate = new Date(now);
  resetDate.setDate(now.getDate() + (dayOfWeek === 0 ? 0 : daysUntilSunday));
  resetDate.setHours(23, 59, 59, 999);
  return resetDate;
}

// 获取用户当前段位
function getUserTier(xp) {
  let currentTier = LEAGUE_TIERS[0];
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].minXP) {
      currentTier = LEAGUE_TIERS[i];
      break;
    }
  }
  return currentTier;
}

// 模拟用户数据 (实际应查数据库)
const leagueUsers = [
  { id: 1, name: '小明', xp: 12500, correctRate: 88, streak: 45 },
  { id: 2, name: '小红', xp: 11200, correctRate: 85, streak: 32 },
  { id: 3, name: '小李', xp: 9800, correctRate: 82, streak: 28 },
  { id: 4, name: '小王', xp: 8500, correctRate: 80, streak: 21 },
  { id: 5, name: '小张', xp: 7200, correctRate: 78, streak: 18 },
  { id: 6, name: '小赵', xp: 6500, correctRate: 76, streak: 15 },
  { id: 7, name: '小刘', xp: 5800, correctRate: 75, streak: 12 },
  { id: 8, name: '小陈', xp: 4500, correctRate: 73, streak: 10 },
  { id: 9, name: '小杨', xp: 3200, correctRate: 70, streak: 8 },
  { id: 10, name: '小周', xp: 2100, correctRate: 68, streak: 5 },
  { id: 11, name: '小吴', xp: 1500, correctRate: 65, streak: 4 },
  { id: 12, name: '小郑', xp: 800, correctRate: 62, streak: 3 },
];

// === API 路由 ===

// GET / - 获取联赛段位配置
router.get('/', (req, res) => {
  res.json({
    code: 0,
    data: {
      tiers: LEAGUE_TIERS,
      weeklyReset: getWeeklyResetDate().toISOString(),
    },
  });
});

// GET /leaderboard - 获取排行榜 (分页)
router.get('/leaderboard', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const tierFilter = req.query.tier; // 可按段位筛选

  let filteredUsers = [...leagueUsers];
  
  // 按段位筛选
  if (tierFilter) {
    const tierConfig = LEAGUE_TIERS.find(t => t.name === tierFilter);
    if (tierConfig) {
      filteredUsers = filteredUsers.filter(u => 
        u.xp >= tierConfig.minXP && 
        (LEAGUE_TIERS[LEAGUE_TIERS.indexOf(tierConfig) + 1] 
          ? u.xp < LEAGUE_TIERS[LEAGUE_TIERS.indexOf(tierConfig) + 1].minXP 
          : true)
      );
    }
  }

  // 按 XP 排序
  filteredUsers.sort((a, b) => b.xp - a.xp);

  const total = filteredUsers.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  res.json({
    code: 0,
    data: {
      users: paginatedUsers.map((user, index) => ({
        rank: startIndex + index + 1,
        ...user,
        tier: getUserTier(user.xp),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      weeklyReset: getWeeklyResetDate().toISOString(),
    },
  });
});

// GET /user/:userId - 获取用户联赛信息
router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = leagueUsers.find(u => u.id === userId) || leagueUsers[0];
  const tier = getUserTier(user.xp);
  const userIndex = leagueUsers.findIndex(u => u.id === userId);
  const nextTier = LEAGUE_TIERS[LEAGUE_TIERS.indexOf(tier) + 1];

  res.json({
    code: 0,
    data: {
      user: {
        ...user,
        tier,
      },
      progress: {
        currentXP: user.xp,
        nextTierXP: nextTier ? nextTier.minXP : null,
        progressPercent: nextTier 
          ? Math.min(100, ((user.xp - tier.minXP) / (nextTier.minXP - tier.minXP)) * 100)
          : 100,
        rank: userIndex + 1,
        totalUsers: leagueUsers.length,
      },
      weeklyStats: {
        xpEarned: Math.floor(Math.random() * 200) + 100,
        problemsSolved: Math.floor(Math.random() * 50) + 20,
        correctRate: user.correctRate,
        streak: user.streak,
      },
    },
  });
});

// POST /add-xp - 添加 XP (练习/答题获得)
router.post('/add-xp', (req, res) => {
  const { userId, xp, reason } = req.body;
  const user = leagueUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      code: 404,
      message: '用户不存在',
    });
  }

  const oldTier = getUserTier(user.xp);
  user.xp += xp;
  const newTier = getUserTier(user.xp);
  const promoted = oldTier.name !== newTier.name;

  res.json({
    code: 0,
    data: {
      xpAdded: xp,
      totalXP: user.xp,
      previousTier: oldTier,
      currentTier: newTier,
      promoted,
      reason,
    },
  });
});

// GET /achievements - 获取联赛成就
router.get('/achievements', (req, res) => {
  const achievements = [
    {
      id: 1,
      name: '初登赛场',
      description: '首次参加联赛',
      icon: '🏁',
      condition: 'Enter any league',
      unlocked: true,
    },
    {
      id: 2,
      name: '连胜勇士',
      description: '连续7天参加练习',
      icon: '🔥',
      condition: '7-day streak',
      unlocked: false,
    },
    {
      id: 3,
      name: '段位晋升',
      description: '晋升到更高段位',
      icon: '⬆️',
      condition: 'Reach new tier',
      unlocked: false,
    },
    {
      id: 4,
      name: '全服前十',
      description: '进入全服排行榜前十',
      icon: '🏆',
      condition: 'Top 10 global rank',
      unlocked: false,
    },
    {
      id: 5,
      name: '准确率达人',
      description: '单次练习正确率100%',
      icon: '🎯',
      condition: '100% accuracy',
      unlocked: false,
    },
    {
      id: 6,
      name: '马拉松选手',
      description: '累计完成1000道题',
      icon: '🏃',
      condition: '1000 problems solved',
      unlocked: false,
    },
  ];

  res.json({
    code: 0,
    data: { achievements },
  });
});

// GET /ranks/:userId - 获取用户相对排名
router.get('/ranks/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = leagueUsers.find(u => u.id === userId) || leagueUsers[0];
  const userIndex = leagueUsers.findIndex(u => u.id === userId);
  
  // 获取前后各2名用户
  const prevUsers = leagueUsers.slice(Math.max(0, userIndex - 2), userIndex);
  const nextUsers = leagueUsers.slice(userIndex + 1, Math.min(leagueUsers.length, userIndex + 3));

  res.json({
    code: 0,
    data: {
      user: {
        ...user,
        rank: userIndex + 1,
        tier: getUserTier(user.xp),
      },
      prevUsers: prevUsers.map(u => ({
        ...u,
        rank: leagueUsers.findIndex(ul => ul.id === u.id) + 1,
        tier: getUserTier(u.xp),
      })),
      nextUsers: nextUsers.map(u => ({
        ...u,
        rank: leagueUsers.findIndex(ul => ul.id === u.id) + 1,
        tier: getUserTier(u.xp),
      })),
      xpDiffToPrev: prevUsers.length > 0 
        ? user.xp - prevUsers[prevUsers.length - 1].xp 
        : null,
      xpDiffToNext: nextUsers.length > 0 
        ? nextUsers[0].xp - user.xp 
        : null,
    },
  });
});

module.exports = router;
