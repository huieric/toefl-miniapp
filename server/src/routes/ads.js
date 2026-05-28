/**
 * 广告模块路由
 * /api/ads/*
 */
const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const adService = require('../services/adService');
const db = require('../config/db');

const router = express.Router();

// POST /api/ads/impression - 记录广告展示
router.post('/impression', optionalAuth, async (req, res) => {
  try {
    const { placement, adId } = req.body;

    if (!placement) {
      return res.status(400).json({ code: 400, message: '缺少广告位标识' });
    }

    const userId = req.user ? req.user.id : null;
    await adService.recordImpression(userId, placement, adId || null);

    res.json({ code: 200, message: '记录成功' });
  } catch (err) {
    console.error('[Ads] 记录展示失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ads/banner/:placement - 获取广告位内容
router.get('/banner/:placement', optionalAuth, async (req, res) => {
  try {
    const { placement } = req.params;
    const ad = adService.getAdContent(placement);

    // 异步记录展示（不阻塞响应）
    const userId = req.user ? req.user.id : null;
    adService.recordImpression(userId, placement, ad.id).catch(() => {});

    res.json({
      code: 200,
      data: {
        placement,
        ad: {
          id: ad.id,
          title: ad.title,
          subtitle: ad.subtitle,
          imageUrl: ad.imageUrl || '',
        },
      },
    });
  } catch (err) {
    console.error('[Ads] 获取广告失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ads/placements - 获取所有广告位列表（管理用）
router.get('/placements', (_req, res) => {
  try {
    const placements = adService.getAllPlacements();
    res.json({ code: 200, data: placements });
  } catch (err) {
    console.error('[Ads] 获取广告位失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/ads/analytics - 广告效果分析（管理后台用，需鉴权）
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ code: 400, message: '缺少日期范围参数' });
    }

    const analytics = await adService.getAdAnalyticsWithRevenue(startDate, endDate);

    res.json({ code: 200, data: analytics });
  } catch (err) {
    console.error('[Ads] 广告分析失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
