// utils/storage.js - 本地存储封装（会员状态、每日用量、广告记录）

const STORAGE_KEYS = {
  MEMBERSHIP: 'membership_info',   // 会员信息缓存
  TODAY_USAGE: 'today_usage',       // 每日用量（按日期key实际在membership.js处理）
  AD_IMPRESSIONS: 'ad_impressions', // 广告展示记录
  USER_STATS: 'user_stats_cache',   // 用户统计缓存
};

/**
 * 获取缓存的会员信息
 * @returns {object|null}
 */
function getMembershipInfo() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.MEMBERSHIP) || null;
  } catch (e) {
    return null;
  }
}

/**
 * 缓存会员信息
 * @param {object} info - { membership, start_date, end_date, plan_type }
 */
function setMembershipInfo(info) {
  try {
    wx.setStorageSync(STORAGE_KEYS.MEMBERSHIP, info);
  } catch (e) {
    console.error('[Storage] 保存会员信息失败', e);
  }
}

/**
 * 清除会员缓存（退出登录时调用）
 */
function clearMembershipInfo() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.MEMBERSHIP);
  } catch (e) {}
}

/**
 * 获取今日用量（从 storage 读取，与 membership.js 保持一致）
 * @returns {object}
 */
function getTodayUsage() {
  const today = getTodayStr();
  try {
    return wx.getStorageSync(`usage_${today}`) || { mockExam: 0, aiTalkMinutes: 0, questions: 0 };
  } catch (e) {
    return { mockExam: 0, aiTalkMinutes: 0, questions: 0 };
  }
}

/**
 * 设置今日用量
 */
function setTodayUsage(usage) {
  const today = getTodayStr();
  try {
    wx.setStorageSync(`usage_${today}`, usage);
  } catch (e) {
    console.error('[Storage] 保存用量失败', e);
  }
}

/**
 * 增加用量计数
 * @param {string} type - 'mockExam' | 'aiTalkMinutes' | 'questions'
 * @param {number} amount
 */
function addUsage(type, amount = 1) {
  const usage = getTodayUsage();
  if (type === 'aiTalkMinutes') {
    usage.aiTalkMinutes = (usage.aiTalkMinutes || 0) + amount;
  } else {
    usage[type] = (usage[type] || 0) + amount;
  }
  setTodayUsage(usage);
}

/**
 * 记录广告展示（本地去重，同一placement同日内不重复记录）
 * @param {string} placement - 广告位置
 * @param {string} adId - 广告ID
 */
function recordAdImpression(placement, adId) {
  const today = getTodayStr();
  try {
    const records = wx.getStorageSync(STORAGE_KEYS.AD_IMPRESSIONS) || {};
    if (!records[today]) records[today] = {};
    // 同 placement 同 adId 只记录一次
    const key = `${placement}_${adId}`;
    if (!records[today][key]) {
      records[today][key] = { placement, adId, time: Date.now() };
    }
    // 只保留最近3天
    const keys = Object.keys(records).sort().reverse();
    keys.slice(3).forEach(k => delete records[k]);
    wx.setStorageSync(STORAGE_KEYS.AD_IMPRESSIONS, records);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 获取用户统计缓存
 * @returns {object|null}
 */
function getUserStatsCache() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.USER_STATS) || null;
  } catch (e) {
    return null;
  }
}

/**
 * 设置用户统计缓存
 */
function setUserStatsCache(stats) {
  try {
    wx.setStorageSync(STORAGE_KEYS.USER_STATS, stats);
  } catch (e) {}
}

/**
 * 清除所有缓存（退出登录时）
 */
function clearAll() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.MEMBERSHIP);
    wx.removeStorageSync(STORAGE_KEYS.AD_IMPRESSIONS);
    wx.removeStorageSync(STORAGE_KEYS.USER_STATS);
    // 清除今日用量
    const today = getTodayStr();
    wx.removeStorageSync(`usage_${today}`);
  } catch (e) {}
}

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  getMembershipInfo,
  setMembershipInfo,
  clearMembershipInfo,
  getTodayUsage,
  setTodayUsage,
  addUsage,
  recordAdImpression,
  getUserStatsCache,
  setUserStatsCache,
  clearAll,
};
