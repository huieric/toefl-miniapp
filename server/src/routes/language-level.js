const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// CEFR 语言等级体系
const CEFR_LEVELS = [
  { code: 'A1', name: '入门', icon: '🌱', minXP: 0, color: '#4CAF50' },
  { code: 'A2', name: '基础', icon: '🌿', minXP: 300, color: '#8BC34A' },
  { code: 'B1', name: '中级', icon: '🌳', minXP: 800, color: '#2196F3' },
  { code: 'B2', name: '中高级', icon: '🏔️', minXP: 1500, color: '#3F51B5' },
  { code: 'C1', name: '高级', icon: '⭐', minXP: 2500, color: '#9C27B0' },
  { code: 'C2', name: '精通', icon: '👑', minXP: 4000, color: '#FF9800' },
];

// TOEFL 分数对应区间
const TOEFL_RANGES = [
  { min: 0, max: 42, reading: 'A1-A2', listening: 'A1-A2', speaking: 'A2', writing: 'A2' },
  { min: 43, max: 100, reading: 'A2-B1', listening: 'A2-B1', speaking: 'B1', writing: 'B1' },
  { min: 101, max: 145, reading: 'B1-B2', listening: 'B1-B2', speaking: 'B1-B2', writing: 'B1-B2' },
  { min: 146, max: 180, reading: 'B2-C1', listening: 'B2-C1', speaking: 'B2', writing: 'B2' },
  { min: 181, max: 200, reading: 'C1', listening: 'C1', speaking: 'C1', writing: 'C1' },
  { min: 201, max: 300, reading: 'C2', listening: 'C2', speaking: 'C2', writing: 'C2' },
];

/**
 * GET /api/language-level
 * 获取用户语言等级和进度
 */
router.get('/', auth, async (req, res) => {
  try {
    const userStats = await db.query(
      `SELECT xp_points, reading_score, listening_score, speaking_score, writing_score 
       FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = userStats.rows[0] || {};
    const xpPoints = parseInt(stats?.xp_points || 0);
    const readingScore = parseFloat(stats?.reading_score || 0);
    const listeningScore = parseFloat(stats?.listening_score || 0);
    const speakingScore = parseFloat(stats?.speaking_score || 0);
    const writingScore = parseFloat(stats?.writing_score || 0);

    // 计算总 TOEFL 分数
    const totalScore = readingScore + listeningScore + speakingScore + writingScore;

    // 确定当前 CEFR 等级
    let currentLevel = CEFR_LEVELS[0];
    let nextLevel = CEFR_LEVELS[1];

    for (let i = CEFR_LEVELS.length - 1; i >= 0; i--) {
      if (xpPoints >= CEFR_LEVELS[i].minXP) {
        currentLevel = CEFR_LEVELS[i];
        nextLevel = i < CEFR_LEVELS.length - 1 ? CEFR_LEVELS[i + 1] : null;
        break;
      }
    }

    // 计算到下一级需要的 XP
    let progressPercent = 100;
    if (nextLevel) {
      const needed = nextLevel.minXP - currentLevel.minXP;
      const gained = xpPoints - currentLevel.minXP;
      progressPercent = Math.min(Math.round((gained / needed) * 100), 100);
    }

    // 计算各科 CEFR 等级
    const getSubjectLevel = (score) => {
      for (let i = TOEFL_RANGES.length - 1; i >= 0; i--) {
        if (score >= TOEFL_RANGES[i].min) {
          return TOEFL_RANGES[i];
        }
      }
      return TOEFL_RANGES[0];
    };

    const subjectLevels = {
      reading: getSubjectLevel(readingScore),
      listening: getSubjectLevel(listeningScore),
      speaking: getSubjectLevel(speakingScore),
      writing: getSubjectLevel(writingScore),
    };

    // XP 等级（从经验系统）
    const level = xpPoints > 0 ? Math.max(1, Math.floor(Math.log2(xpPoints / 100 + 1)) + 1) : 1;

    // 获取成就徽章
    const achievements = await db.query(
      `SELECT ua.achievement_id, a.icon, a.name 
       FROM user_achievements ua 
       JOIN achievements a ON ua.achievement_id = a.id 
       WHERE ua.user_id = $1 
       ORDER BY ua.unlocked_at DESC 
       LIMIT 12`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        xpPoints,
        level,
        cefrLevel: {
          code: currentLevel.code,
          name: currentLevel.name,
          icon: currentLevel.icon,
          color: currentLevel.color,
        },
        nextLevel: nextLevel ? {
          code: nextLevel.code,
          name: nextLevel.name,
          icon: nextLevel.icon,
          requiredXP: nextLevel.minXP - xpPoints,
        } : null,
        progressPercent,
        totalScore,
        subjectLevels,
        badges: achievements.rows.map(r => ({
          id: r.achievement_id,
          icon: r.icon,
          name: r.name,
        })),
      },
    });
  } catch (err) {
    console.error('[LanguageLevel] 获取等级失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/language-level/comparison
 * 获取等级对比图表数据
 */
router.get('/comparison', auth, async (req, res) => {
  try {
    const userStats = await db.query(
      `SELECT reading_score, listening_score, speaking_score, writing_score 
       FROM user_stats WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = userStats.rows[0] || {};
    
    res.json({
      code: 200,
      data: {
        reading: parseFloat(stats?.reading_score || 0),
        listening: parseFloat(stats?.listening_score || 0),
        speaking: parseFloat(stats?.speaking_score || 0),
        writing: parseFloat(stats?.writing_score || 0),
      },
    });
  } catch (err) {
    console.error('[LanguageLevel] 获取对比失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
