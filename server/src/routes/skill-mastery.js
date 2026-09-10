const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 科目 - 技能映射
const SUBJECT_SKILLS = {
  reading: [
    { key: 'main_idea', name: '主旨题', icon: '🎯' },
    { key: 'detail', name: '细节题', icon: '🔍' },
    { key: 'inference', name: '推断题', icon: '💡' },
    { key: 'vocabulary', name: '词汇题', icon: '📖' },
    { key: 'reference', name: '指代题', icon: '👉' },
    { key: 'sentence_simplification', name: '句子简化', icon: '✂️' },
    { key: 'prose_summary', name: '文章总结', icon: '📝' },
    { key: 'fill_in_table', name: '表格填空', icon: '📊' },
  ],
  listening: [
    { key: 'gist_listen', name: '主旨听力', icon: '🎧' },
    { key: 'detail_listen', name: '细节听力', icon: '👂' },
    { key: 'function', name: '功能题', icon: '🎭' },
    { key: 'inference_listen', name: '推断听力', icon: '💡' },
    { key: 'attitude', name: '态度题', icon: '😊' },
    { key: 'organization', name: '组织结构', icon: '📋' },
    { key: 'fill_in_notes', name: '笔记填空', icon: '📝' },
  ],
  speaking: [
    { key: 'independent_speak', name: '独立口语', icon: '🗣️' },
    { key: 'reading_speaking', name: '阅读口语', icon: '📖🗣️' },
    { key: 'listening_speaking', name: '听力口语', icon: '🎧🗣️' },
    { key: 'independent_writing_speak', name: '综合口语', icon: '📚' },
  ],
  writing: [
    { key: 'independent_write', name: '独立写作', icon: '✍️' },
    { key: 'integrated_write', name: '综合写作', icon: '📝' },
  ],
};

/**
 * GET /api/skill-mastery
 * 获取用户各技能掌握度
 */
router.get('/', auth, async (req, res) => {
  try {
    const subject = req.query.subject || 'reading';
    const skills = SUBJECT_SKILLS[subject] || SUBJECT_SKILLS.reading;

    // 分析 past practice/exam 数据，计算每个技能的掌握度
    const masteryData = [];

    for (const skill of skills) {
      const result = await analyzeSkillMastery(req.user.id, subject, skill.key);
      masteryData.push(result);
    }

    // 计算总体正确率和各技能掌握度
    const overallAccuracy = masteryData.reduce((sum, s) =>
      sum + (s.total > 0 ? (s.correct / s.total) * 100 : 0), 0) / masteryData.length;

    // 识别最强和最弱技能
    const sorted = [...masteryData].sort((a, b) => b.accuracy - a.accuracy);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    res.json({
      code: 200,
      data: {
        subject,
        skills: masteryData,
        overallAccuracy: Math.round(overallAccuracy),
        strongestSkill: strongest,
        weakestSkill: weakest,
      },
    });
  } catch (err) {
    console.error('[SkillMastery] 获取掌握度失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * 分析单个技能的掌握度
 */
async function analyzeSkillMastery(userId, subject, skillKey) {
  let correct = 0;
  let total = 0;
  let avgTime = 0;

  try {
    // 从 practice_records 分析
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN correct = TRUE THEN 1 ELSE 0 END) as correct,
        AVG(duration) as avg_time
       FROM practice_records
       WHERE user_id = $1 
         AND subject = $2
         AND (type = $3 OR skill_tags @> ARRAY[$3])`,
      [userId, subject, skillKey]
    );

    const row = result.rows[0];
    total = parseInt(row?.total || 0);
    correct = parseInt(row?.correct || 0);
    avgTime = Math.round(parseFloat(row?.avg_time || 0));

    // 如果 practice_records 中没有，从 exam_records 获取
    if (total === 0) {
      const examResult = await db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN correct = TRUE THEN 1 ELSE 0 END) as correct
         FROM exam_records
         WHERE user_id = $1
           AND subject = $2
           AND (type = $3 OR skill_tags @> ARRAY[$3])`,
        [userId, subject, skillKey]
      );

      const examRow = examResult.rows[0];
      total = parseInt(examRow?.total || 0);
      correct = parseInt(examRow?.correct || 0);
    }
  } catch (err) {
    console.warn(`[SkillMastery] 分析技能 ${skillKey} 失败:`, err.message.substring(0, 100));
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const masteryLevel = calculateMasteryLevel(accuracy, total);

  return {
    key: skillKey,
    name: SUBJECT_SKILLS[subject]?.find(s => s.key === skillKey)?.name || skillKey,
    icon: SUBJECT_SKILLS[subject]?.find(s => s.key === skillKey)?.icon || '📚',
    total,
    correct,
    accuracy,
    masteryLevel,
    avgTime,
  };
}

/**
 * 计算掌握等级
 */
function calculateMasteryLevel(accuracy, total) {
  if (total === 0) return 'not_started';
  if (total < 3) return 'learning';
  if (accuracy >= 90) return 'master';
  if (accuracy >= 75) return 'proficient';
  if (accuracy >= 60) return 'intermediate';
  if (accuracy >= 40) return 'beginner';
  return 'struggling';
}

/**
 * GET /api/skill-mastery/all
 * 获取所有科目的技能掌握度汇总
 */
router.get('/all', auth, async (req, res) => {
  try {
    const summary = {};

    for (const subject of ['reading', 'listening', 'speaking', 'writing']) {
      const skills = SUBJECT_SKILLS[subject];
      const masteryData = [];

      for (const skill of skills) {
        const result = await analyzeSkillMastery(req.user.id, subject, skill.key);
        masteryData.push(result);
      }

      // 计算该科目平均分
      const validSkills = masteryData.filter(s => s.total > 0);
      const avgAccuracy = validSkills.length > 0
        ? Math.round(validSkills.reduce((sum, s) => sum + s.accuracy, 0) / validSkills.length)
        : 0;

      summary[subject] = {
        total: masteryData.reduce((sum, s) => sum + s.total, 0),
        avgAccuracy,
        skills: masteryData,
      };
    }

    res.json({ code: 200, data: summary });
  } catch (err) {
    console.error('[SkillMastery] 获取汇总失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
