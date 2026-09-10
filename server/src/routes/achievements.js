const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// ============================================================
// 成就/徽章定义表 (achievements)
// ============================================================

// 预设成就定义（Duolingo 风格）
const PRESET_ACHIEVEMENTS = [
  // 学习类
  { id: 'first_login', title: '初次见面', icon: '👋', desc: '首次登录', condition: 'once', xp_reward: 10 },
  { id: 'first_study', title: '学海无涯', icon: '📚', desc: '完成第一次练习', condition: 'once', xp_reward: 20 },
  { id: 'streak_3', title: '初露锋芒', icon: '🔥', desc: '连续学习3天', condition: 'streak', threshold: 3, xp_reward: 30 },
  { id: 'streak_7', title: '坚持就是胜利', icon: '🔥', desc: '连续学习7天', condition: 'streak', threshold: 7, xp_reward: 50 },
  { id: 'streak_30', title: '学习达人', icon: '🌟', desc: '连续学习30天', condition: 'streak', threshold: 30, xp_reward: 150 },
  { id: 'streak_100', title: '百日筑基', icon: '🏆', desc: '连续学习100天', condition: 'streak', threshold: 100, xp_reward: 500 },
  // 答题类
  { id: 'questions_50', title: '小试牛刀', icon: '✏️', desc: '完成50道题', condition: 'total_questions', threshold: 50, xp_reward: 30 },
  { id: 'questions_200', title: '题海战术', icon: '📝', desc: '完成200道题', condition: 'total_questions', threshold: 200, xp_reward: 80 },
  { id: 'questions_500', title: '学富五车', icon: '🎯', desc: '完成500道题', condition: 'total_questions', threshold: 500, xp_reward: 200 },
  { id: 'questions_1000', title: '题王之王', icon: '👑', desc: '完成1000道题', condition: 'total_questions', threshold: 1000, xp_reward: 500 },
  // 正确率类
  { id: 'accuracy_70', title: '初具水准', icon: '✅', desc: '正确率达70%', condition: 'accuracy', threshold: 70, xp_reward: 40 },
  { id: 'accuracy_80', title: '出类拔萃', icon: '🎉', desc: '正确率达80%', condition: 'accuracy', threshold: 80, xp_reward: 80 },
  { id: 'accuracy_90', title: '炉火纯青', icon: '💎', desc: '正确率达90%', condition: 'accuracy', threshold: 90, xp_reward: 150 },
  // 科目类
  { id: 'reading_first', title: '阅读新手', icon: '📖', desc: '完成第一篇阅读', condition: 'subject_total', subject: 'reading', threshold: 1, xp_reward: 20 },
  { id: 'listening_first', title: '听力入门', icon: '🎧', desc: '完成第一题听力', condition: 'subject_total', subject: 'listening', threshold: 1, xp_reward: 20 },
  { id: 'speaking_first', title: '开口说', icon: '🗣️', desc: '完成第一次口语', condition: 'subject_total', subject: 'speaking', threshold: 1, xp_reward: 20 },
  { id: 'writing_first', title: '下笔成章', icon: '✒️', desc: '完成第一次写作', condition: 'subject_total', subject: 'writing', threshold: 1, xp_reward: 20 },
  // 复习类
  { id: 'vocab_review_first', title: '温故知新', icon: '🔄', desc: '第一次复习单词', condition: 'once', xp_reward: 15 },
  { id: 'wrong_review_50', title: '错题终结者', icon: '💪', desc: '重做50道错题', condition: 'wrong_review', threshold: 50, xp_reward: 50 },
  // 综合类
  { id: 'xp_500', title: '初出茅庐', icon: '⭐', desc: '累计获得500XP', condition: 'total_xp', threshold: 500, xp_reward: 30 },
  { id: 'xp_2000', title: '学业有成', icon: '🌈', desc: '累计获得2000XP', condition: 'total_xp', threshold: 2000, xp_reward: 100 },
  { id: 'xp_5000', title: '学神附体', icon: '🚀', desc: '累计获得5000XP', condition: 'total_xp', threshold: 5000, xp_reward: 300 },
];

// ============================================================
// 成就数据库初始化（自动检测并创建表）
// ============================================================

async function ensureAchievementsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        desc TEXT,
        condition VARCHAR(30) NOT NULL,
        threshold INTEGER DEFAULT 0,
        xp_reward INTEGER DEFAULT 0,
        category VARCHAR(30) DEFAULT 'general'
      )
    `);
    // 检查是否有数据，无数据则插入预设
    const check = await db.query('SELECT COUNT(*) as cnt FROM achievements');
    if (parseInt(check.rows[0].cnt) === 0) {
      const categories = ['study', 'study', 'study', 'study', 'study', 'study',
        'quiz', 'quiz', 'quiz', 'quiz',
        'accuracy', 'accuracy', 'accuracy',
        'subject', 'subject', 'subject', 'subject',
        'review', 'review',
        'overall', 'overall', 'overall'];
      for (let i = 0; i < PRESET_ACHIEVEMENTS.length; i++) {
        await db.query(
          `INSERT INTO achievements (id, title, icon, desc, condition, threshold, xp_reward, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [PRESET_ACHIEVEMENTS[i].id, PRESET_ACHIEVEMENTS[i].title, PRESET_ACHIEVEMENTS[i].icon,
           PRESET_ACHIEVEMENTS[i].desc, PRESET_ACHIEVEMENTS[i].condition, PRESET_ACHIEVEMENTS[i].threshold || 0,
           PRESET_ACHIEVEMENTS[i].xp_reward, categories[i]]
        );
      }
    }
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_ua_ach ON user_achievements(achievement_id)`);
  } catch (err) {
    console.error('[Achievements] 初始化失败:', err.message);
  }
}

// 调用一次确保表存在
ensureAchievementsTable();

// ============================================================
// POST /api/achievements/award - 检查并颁发成就
// ============================================================
router.post('/award', auth, async (req, res) => {
  try {
    const { type, value } = req.body || {};
    let statUpdate = {};
    let stats = null;

    if (type === 'study') {
      // 练习/学习
      statUpdate = { total_questions: 1, total_study_minutes: value || 1 };
    } else if (type === 'correct') {
      // 答对
      statUpdate = { correct_questions: 1, total_questions: 1 };
    } else if (type === 'exam') {
      statUpdate = { total_exams: 1 };
    } else if (type === 'vocab_review') {
      statUpdate = { vocab_reviews: 1 };
    } else if (type === 'wrong_review') {
      statUpdate = { wrong_reviews: 1 };
    }

    // 更新 stats
    if (Object.keys(statUpdate).length > 0) {
      const setClause = Object.entries(statUpdate).map(([k, v], i) => `${k} = COALESCE(${k}, 0) + $${i + 2}`).join(', ');
      await db.query(
        `UPDATE user_stats SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [req.user.id, ...Object.values(statUpdate)]
      );
    }

    // 获取最新 stats
    stats = (await db.query(
      `SELECT total_questions, correct_questions, streak_days, total_study_minutes,
              vocab_reviews, wrong_reviews, total_exams, xp_points
       FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    if (!stats) {
      return res.json({ code: 200, data: { unlocked: [], newXP: 0 } });
    }

    const accuracy = stats.total_questions > 0 ? Math.round((stats.correct_questions / stats.total_questions) * 100) : 0;
    const totalXP = stats.xp_points || 0;

    // 按条件分类检查
    const allAchievements = (await db.query('SELECT * FROM achievements ORDER BY xp_reward DESC')).rows;
    const unlocked = [];

    for (const ach of allAchievements) {
      // 已解锁跳过
      const exists = (await db.query('SELECT 1 FROM user_achievements WHERE user_id = $1 AND achievement_id = $2', [req.user.id, ach.id])).rows[0];
      if (exists) continue;

      let shouldUnlock = false;

      switch (ach.condition) {
        case 'once':
          shouldUnlock = true; // 首次行为即解锁
          break;
        case 'streak':
          shouldUnlock = (stats.streak_days || 0) >= ach.threshold;
          break;
        case 'total_questions':
          shouldUnlock = (stats.total_questions || 0) >= ach.threshold;
          break;
        case 'accuracy':
          shouldUnlock = accuracy >= ach.threshold;
          break;
        case 'total_xp':
          shouldUnlock = totalXP >= ach.threshold;
          break;
        default:
          shouldUnlock = false;
      }

      if (shouldUnlock) {
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
          [req.user.id, ach.id]
        );
        unlocked.push({ id: ach.id, title: ach.title, icon: ach.icon, desc: ach.desc, xpReward: ach.xp_reward });
      }
    }

    // 返回新解锁的成就和累计 XP
    res.json({
      code: 200,
      data: { unlocked, newXP: unlocked.reduce((s, a) => s + a.xpReward, 0) },
    });
  } catch (err) {
    console.error('[Achievements] 颁发成就失败:', err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// GET /api/achievements/list - 获取成就列表（含解锁状态）
// ============================================================
router.get('/list', auth, async (req, res) => {
  try {
    const stats = (await db.query(
      `SELECT total_questions, correct_questions, streak_days, xp_points,
              total_study_minutes, vocab_reviews, wrong_reviews, total_exams
       FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    )).rows[0];

    const accuracy = stats && stats.total_questions > 0
      ? Math.round((stats.correct_questions / stats.total_questions) * 100)
      : 0;
    const totalXP = stats ? (stats.xp_points || 0) : 0;

    const allAchievements = (await db.query('SELECT * FROM achievements ORDER BY category, title')).rows;
    const userAchs = (await db.query(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
      [req.user.id]
    )).rows;
    const unlockedIds = new Set(userAchs.map(r => r.achievement_id));

    const list = allAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedIds.has(ach.id),
      unlockedAt: unlockedIds.has(ach.id) ? userAchs.find(r => r.achievement_id === ach.id)?.unlocked_at : null,
      progress: calculateProgress(ach, stats, accuracy, totalXP),
    }));

    res.json({
      code: 200,
      data: {
        achievements: list,
        totalUnlocked: unlockedIds.size,
        totalAvailable: allAchievements.length,
        totalXP,
      },
    });
  } catch (err) {
    console.error('[Achievements] 获取列表失败:', err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// GET /api/achievements/stats - 获取成就统计
// ============================================================
router.get('/stats', auth, async (req, res) => {
  try {
    const count = (await db.query(
      'SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = $1',
      [req.user.id]
    )).rows[0];
    const xp = (await db.query(
      'SELECT xp_points FROM user_stats WHERE user_id = $1',
      [req.user.id]
    )).rows[0];

    res.json({
      code: 200,
      data: {
        unlocked: parseInt(count.cnt),
        xpPoints: xp?.xp_points || 0,
        level: calculateLevel(xp?.xp_points || 0),
      },
    });
  } catch (err) {
    console.error('[Achievements] 获取统计失败:', err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// Round 30: Enhanced Achievements - 赛季制 + 多维度 + 成就墙
// ============================================================

// 成就分类
const ACHIEVEMENT_CATEGORIES = [
  { id: 'learning', name: '学习达人', icon: '📚', color: '#3b82f6', description: '学习类成就' },
  { id: 'practice', name: '做题能手', icon: '✍️', color: '#10b981', description: '练习类成就' },
  { id: 'streak', name: '坚持不懈', icon: '🔥', color: '#ef4444', description: '连续学习成就' },
  { id: 'mastery', name: '精通大师', icon: '🏆', color: '#8b5cf6', description: '技能掌握成就' },
  { id: 'season', name: '赛季荣誉', icon: '⭐', color: '#ec4899', description: '赛季限定成就' },
];

// 赛季数据
const SEASONS = [
  {
    id: 'spring-2024',
    name: '2024春季赛季',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    status: 'active',
    topPlayers: [
      { rank: 1, name: '张明', score: 15000, level: '大师' },
      { rank: 2, name: '李华', score: 13500, level: '钻石' },
      { rank: 3, name: '王小红', score: 12800, level: '铂金' },
      { rank: 4, name: '赵强', score: 11200, level: '黄金' },
      { rank: 5, name: '你', score: 10500, level: '黄金', isUser: true },
    ],
  },
  {
    id: 'winter-2024',
    name: '2024冬季赛季',
    startDate: '2024-01-01',
    endDate: '2024-02-29',
    status: 'ended',
    topPlayers: [
      { rank: 1, name: '张明', score: 12000, level: '钻石' },
      { rank: 2, name: '你', score: 8500, level: '黄金', isUser: true },
    ],
  },
];

// 获取成就分类统计
router.get('/', async (req, res) => {
  try {
    res.json({
      code: 200,
      data: {
        achievements: PRESET_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, progress: 0 })),
        categories: ACHIEVEMENT_CATEGORIES,
        seasons: SEASONS,
        currentSeason: SEASONS.find(s => s.status === 'active'),
        stats: {
          totalUnlocked: 4,
          totalAvailable: PRESET_ACHIEVEMENTS.length,
          currentStreak: 7,
          totalXP: 10500,
        },
        userProgress: [
          { name: '学海无涯', icon: '📚', progress: 67 },
          { name: '月之光华', icon: '🌙', progress: 23 },
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取成就分类统计
router.get('/categories', async (req, res) => {
  try {
    res.json({
      code: 200,
      data: {
        categories: ACHIEVEMENT_CATEGORIES,
        seasons: SEASONS,
        currentSeason: SEASONS.find(s => s.status === 'active'),
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取赛季排行榜
router.get('/seasons/:id', async (req, res) => {
  try {
    const season = SEASONS.find(s => s.id === req.params.id);
    if (!season) {
      return res.status(404).json({ code: 404, message: '赛季不存在' });
    }
    res.json({
      code: 200,
      data: {
        ...season,
        userRank: season.topPlayers.find(p => p.isUser)?.rank || null,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取成就墙数据
router.get('/wall', async (req, res) => {
  try {
    res.json({
      code: 200,
      data: {
        categories: ACHIEVEMENT_CATEGORIES,
        seasons: SEASONS,
        message: '成就墙数据已加载',
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ============================================================
// 工具函数
// ============================================================
function calculateProgress(ach, stats, accuracy, totalXP) {
  if (!stats) return 0;
  const s = stats;
  const acc = accuracy;
  const xp = totalXP;

  switch (ach.condition) {
    case 'once': return 100;
    case 'streak': return Math.min(100, Math.round(((s.streak_days || 0) / ach.threshold) * 100));
    case 'total_questions': return Math.min(100, Math.round(((s.total_questions || 0) / ach.threshold) * 100));
    case 'accuracy': return Math.min(100, Math.round((acc / ach.threshold) * 100));
    case 'total_xp': return Math.min(100, Math.round((xp / ach.threshold) * 100));
    default: return 0;
  }
}

function calculateLevel(xp) {
  // 等级公式: 每级需要 xp * 1.5 的经验值
  let level = 1;
  let needed = 100;
  while (xp >= needed) {
    level++;
    xp -= needed;
    needed = Math.round(100 * Math.pow(1.5, level - 1));
  }
  return { level, currentXP: xp, needed };
}

module.exports = router;
