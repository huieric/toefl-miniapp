/**
 * 广告服务
 * 广告展示/轮播、展示统计、收益计算
 */
const db = require('../config/db');

/**
 * 模拟广告内容池
 * 正式环境接入微信广告 SDK（wx.createBannerAd等）
 */
const AD_POOLS = {
  home: [
    { id: 'ad_home_001', title: '托福真题精讲课程', subtitle: '名师授课，7天免费试听', imageUrl: '' },
    { id: 'ad_home_002', title: '留学申请一站式服务', subtitle: '专业顾问1对1指导', imageUrl: '' },
    { id: 'ad_home_003', title: '英语口语速成计划', subtitle: '30天突破口语瓶颈', imageUrl: '' },
  ],
  'practice-done': [
    { id: 'ad_pd_001', title: '托福词汇速记秘籍', subtitle: '1200核心词轻松背', imageUrl: '' },
    { id: 'ad_pd_002', title: '真题模拟冲刺班', subtitle: '考前30天提分攻略', imageUrl: '' },
  ],
  'wrong-book': [
    { id: 'ad_wb_001', title: 'AI智能错题分析', subtitle: '精准定位薄弱环节', imageUrl: '' },
    { id: 'ad_wb_002', title: '托福写作批改服务', subtitle: '外教逐句精批', imageUrl: '' },
  ],
};

/**
 * 获取指定广告位的广告内容
 * @param {string} placement - 广告位标识
 * @param {string} userId - 用户ID（可选，用于个性化推荐）
 * @returns {{ id, title, subtitle, imageUrl }}
 */
function getAdContent(placement) {
  const pool = AD_POOLS[placement] || AD_POOLS['home'];
  // 简单轮播：按小时切换
  const hourIndex = new Date().getHours() % pool.length;
  return pool[hourIndex];
}

/**
 * 获取所有广告位列表
 */
function getAllPlacements() {
  return Object.keys(AD_POOLS);
}

/**
 * 记录广告展示
 */
async function recordImpression(userId, placement, adId) {
  try {
    await db.query(
      `INSERT INTO ad_impressions (user_id, placement, ad_id)
       VALUES ($1, $2, $3)`,
      [userId || null, placement, adId || null]
    );
  } catch (err) {
    console.error('[AdService] 记录展示失败:', err.message);
  }
}

/**
 * 广告效果分析 - 按广告位统计
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
async function getAdAnalytics(startDate, endDate) {
  const result = await db.query(
    `SELECT
      placement,
      COUNT(*)::int as impression_count,
      COUNT(DISTINCT user_id)::int as unique_users,
      COUNT(*)::int / GREATEST(COUNT(DISTINCT DATE(impression_time)), 1) as avg_daily
    FROM ad_impressions
    WHERE impression_time::date BETWEEN $1 AND $2
    GROUP BY placement
    ORDER BY impression_count DESC`,
    [startDate, endDate]
  );

  const total = result.rows.reduce((sum, r) => sum + r.impression_count, 0);

  return {
    byPlacement: result.rows,
    totalImpressions: total,
    period: { from: startDate, to: endDate },
  };
}

/**
 * 计算模拟广告收益
 * 按每千次展示 CPM $2.00 估算
 */
function calculateRevenue(impressionCount) {
  const cpm = 2.00; // 美元
  const revenue = (impressionCount / 1000) * cpm;
  return {
    impressions: impressionCount,
    cpm,
    revenueUsd: parseFloat(revenue.toFixed(2)),
    revenueCny: parseFloat((revenue * 7.2).toFixed(2)),
  };
}

/**
 * 获取广告效果分析（含收益估算）
 */
async function getAdAnalyticsWithRevenue(startDate, endDate) {
  const analytics = await getAdAnalytics(startDate, endDate);
  return {
    ...analytics,
    revenue: calculateRevenue(analytics.totalImpressions),
  };
}

module.exports = {
  AD_POOLS,
  getAdContent,
  getAllPlacements,
  recordImpression,
  getAdAnalytics,
  getAdAnalyticsWithRevenue,
  calculateRevenue,
};
