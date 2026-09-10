const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保必要列存在
db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0').catch(() => {});
db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS user_level INTEGER DEFAULT 1').catch(() => {});
db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS level_started_at TIMESTAMP DEFAULT NOW()').catch(() => {});
db.query('ALTER TABLE xp_records ADD COLUMN IF NOT EXISTS category VARCHAR(50)').catch(() => {});

// GET /api/xp-system/overview - 获取 XP 概览
router.get('/overview', auth, async (req, res) => {
  try {
    const user = await db.query('SELECT total_xp, user_level, level_started_at FROM users WHERE id = $1', [req.user.id]);
    const userData = user.rows[0];
    
    const totalXP = parseInt(userData.total_xp || 0);
    const currentLevel = parseInt(userData.user_level || 1);
    const levelStart = userData.level_started_at || new Date();
    
    // 计算升级所需 XP（每级需要 1000 XP）
    const xpPerLevel = 1000;
    const xpForCurrentLevel = (currentLevel - 1) * xpPerLevel;
    const xpForNextLevel = currentLevel * xpPerLevel;
    const currentLevelXP = totalXP - xpForCurrentLevel;
    const progressToNextLevel = Math.min(100, Math.round((currentLevelXP / xpPerLevel) * 100));
    
    // 获取 XP 记录
    const xpRecords = await db.query(
      `SELECT category, xp, description, created_at 
       FROM xp_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [req.user.id]
    );

    // 获取今日 XP 统计
    const todayXP = await db.query(
      `SELECT COALESCE(SUM(xp), 0) as today_xp 
       FROM xp_records 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
      [req.user.id]
    );

    // 计算连续学习天数
    const streakData = await db.query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as active_days 
       FROM xp_records 
       WHERE user_id = $1 
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        totalXP,
        currentLevel,
        xpForCurrentLevel,
        xpForNextLevel,
        currentLevelXP,
        progressToNextLevel,
        xpPerLevel,
        todayXP: parseInt(todayXP.rows[0].today_xp),
        activeDays: parseInt(streakData.rows[0].active_days),
        levelStart,
        recentXP: xpRecords.rows,
      },
    });
  } catch (err) {
    console.error('[XPSystem] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/xp-system/earn - 获得 XP
router.post('/earn', auth, async (req, res) => {
  try {
    const { category, description, xpAmount } = req.body;
    
    if (!category || !xpAmount || xpAmount <= 0) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 获取当前用户 XP
    const user = await db.query('SELECT total_xp, user_level FROM users WHERE id = $1', [req.user.id]);
    const userData = user.rows[0];
    let totalXP = parseInt(userData.total_xp || 0);
    let currentLevel = parseInt(userData.user_level || 1);
    const levelStart = userData.level_started_at || new Date();

    // 添加 XP
    totalXP += xpAmount;

    // 检查是否升级
    const xpPerLevel = 1000;
    const newLevel = Math.floor(totalXP / xpPerLevel) + 1;
    const leveledUp = newLevel > currentLevel;

    // 插入 XP 记录
    await db.query(
      `INSERT INTO xp_records (user_id, category, xp, description)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, category, xpAmount, description || `${category} +${xpAmount} XP`]
    );

    // 更新用户 XP 和等级
    await db.query(
      `UPDATE users 
       SET total_xp = $1, user_level = $2, level_started_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE level_started_at END
       WHERE id = $4`,
      [totalXP, newLevel, leveledUp, req.user.id]
    );

    res.json({
      code: 200,
      data: {
        xpEarned: xpAmount,
        totalXP,
        currentLevel,
        newLevel,
        leveledUp,
        progressToNextLevel: leveledUp ? 0 : Math.round(((totalXP - (newLevel - 1) * xpPerLevel) / xpPerLevel) * 100),
        levelReward: leveledUp ? getLevelReward(newLevel) : null,
      },
    });
  } catch (err) {
    console.error('[XPSystem] Earn Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/xp-system/leaderboard - 获取排行榜
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await db.query(
      `SELECT id, nickname, total_xp, user_level 
       FROM users 
       WHERE total_xp > 0 
       ORDER BY total_xp DESC 
       LIMIT 50`
    );

    // 获取用户排名
    const userRank = await db.query(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE total_xp > (SELECT total_xp FROM users WHERE id = $1)`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        leaderboard: leaderboard.rows.slice(0, 10), // 只返回前 10 名
        allLeaderboard: leaderboard.rows,
        userRank: parseInt(userRank.rows[0].rank),
        userTotalXP: leaderboard.rows.find(u => u.id === req.user.id)?.total_xp || 0,
      },
    });
  } catch (err) {
    console.error('[XPSystem] Leaderboard Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Get level reward
function getLevelReward(level) {
  const rewards = {
    1: { title: '新手入门', icon: '🌱', desc: '恭喜解锁第一级！' },
    2: { title: '初学乍练', icon: '📚', desc: '继续加油！' },
    3: { title: '小有进步', icon: '⭐', desc: '你的努力开始显现！' },
    4: { title: '突飞猛进', icon: '🚀', desc: '继续保持！' },
    5: { title: 'TOEFL 战士', icon: '⚔️', desc: '你已经是个合格的战士了！' },
    10: { title: '学习大师', icon: '👑', desc: '恭喜成为学习大师！' },
  };
  return rewards[level] || { title: `等级 ${level}`, icon: '🎖️', desc: '解锁新等级！' };
}

module.exports = router;
