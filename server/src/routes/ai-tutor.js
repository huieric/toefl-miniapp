const express = require('express');
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const aiTutor = require('../services/ai-tutor');
const membershipService = require('../services/membershipService');

const router = express.Router();

/**
 * GET /api/ai-tutor/analysis - 获取 AI 学习分析报告
 * 会员功能：免费用户每天可查看1次，会员无限
 */
router.get('/analysis', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isPremium = req.user.membership === 'premium';

    // 免费用户额度检查
    if (!isPremium) {
      const access = await membershipService.checkFeatureAccess(userId, 'aiTutorAnalysis');
      if (!access.allowed) {
        return res.status(403).json({
          code: 403,
          message: '今日 AI 分析次数已用完，升级会员可无限查看',
          data: { remaining: access.remaining, limit: access.limit },
        });
      }
    }

    // 收集用户数据
    const userData = await aiTutor.gatherUserData(userId);

    // 如果练习量太少，返回引导提示
    if (userData.overall.totalPractice < 3) {
      return res.json({
        code: 200,
        data: {
          needsMoreData: true,
          message: '练习数据还太少，AI 导师需要至少 3 道练习题才能给出有价值的分析。先去练习几道题吧！',
          currentCount: userData.overall.totalPractice,
        },
      });
    }

    // 生成分析
    const analysis = await aiTutor.generateAnalysis(userData);

    // 记录使用（免费用户）
    if (!isPremium) {
      await membershipService.trackFeatureUsage(userId, 'aiTutorAnalysis');
    }

    res.json({ code: 200, data: analysis });
  } catch (err) {
    console.error('[AI-Tutor] 获取分析失败:', err);
    res.status(500).json({ code: 500, message: '分析生成失败，请稍后重试' });
  }
});

/**
 * POST /api/ai-tutor/ask - 向 AI 导师提问
 * 会员功能：免费用户每天 3 次，会员无限
 */
router.post('/ask', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, conversationHistory = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ code: 400, message: '请输入问题' });
    }

    if (question.length > 500) {
      return res.status(400).json({ code: 400, message: '问题太长，请控制在500字以内' });
    }

    const isPremium = req.user.membership === 'premium';

    // 免费用户额度检查
    if (!isPremium) {
      const access = await membershipService.checkFeatureAccess(userId, 'aiTutorAsk');
      if (!access.allowed) {
        return res.status(403).json({
          code: 403,
          message: '今日 AI 导师问答次数已用完，升级会员可无限提问',
          data: { remaining: access.remaining, limit: access.limit },
        });
      }
    }

    const result = await aiTutor.askQuestion(userId, question.trim(), conversationHistory);

    // 记录使用（免费用户）
    if (!isPremium) {
      await membershipService.trackFeatureUsage(userId, 'aiTutorAsk');
    }

    res.json({ code: 200, data: result });
  } catch (err) {
    console.error('[AI-Tutor] 问答失败:', err);
    res.status(500).json({ code: 500, message: 'AI 导师暂时无法回复，请稍后重试' });
  }
});

/**
 * GET /api/ai-tutor/data-preview - 获取用户数据概览（无需 AI 调用，快速返回）
 */
router.get('/data-preview', auth, async (req, res) => {
  try {
    const userData = await aiTutor.gatherUserData(req.user.id);

    // 计算各科正确率
    const subjectSummary = ['reading', 'listening', 'speaking', 'writing'].map(sub => {
      const stat = userData.practiceStats.find(s => s.subject === sub);
      return {
        subject: sub,
        total: stat ? stat.total : 0,
        accuracy: stat ? stat.accuracy : 0,
        avgScore: stat ? stat.avgScore : null,
      };
    });

    res.json({
      code: 200,
      data: {
        overall: userData.overall,
        subjectSummary,
        recentTrend: userData.trend.slice(-7),
        wrongDistribution: userData.wrongDist,
      },
    });
  } catch (err) {
    console.error('[AI-Tutor] 数据预览失败:', err);
    res.status(500).json({ code: 500, message: '数据加载失败' });
  }
});

module.exports = router;
