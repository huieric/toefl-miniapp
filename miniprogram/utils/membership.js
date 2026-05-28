// utils/membership.js - 会员状态工具

const FREE_DAILY_LIMIT = {
  mockExam: 1,      // 免费用户每日模拟考试次数
  aiTalkMinutes: 10, // 免费用户每日AI陪练分钟数
  questions: 20,      // 免费用户每日做题数
};

const MEMBERSHIP_BENEFITS = {
  free: [
    '每日1次全真模拟考',
    '每日10分钟AI陪练',
    '每日20题练习',
    '基础错题本',
  ],
  premium: [
    '无限次全真模拟考',
    '无限AI陪练时长',
    '无限题库练习',
    '智能错题复习计划',
    'AI写作精批',
    '口语AI评分',
    '专属学习计划',
    '无广告干扰',
  ],
};

/**
 * 获取用户会员状态
 * @returns {string} 'free' | 'premium'
 */
function getMembership() {
  try {
    const user = wx.getStorageSync('userInfo');
    if (user && user.membership === 'premium') return 'premium';
    return 'free';
  } catch (e) {
    return 'free';
  }
}

/**
 * 获取今日已用用量（从本地存储）
 */
function getTodayUsage() {
  const today = getTodayStr();
  try {
    const usage = wx.getStorageSync(`usage_${today}`);
    return usage || { mockExam: 0, aiTalkMinutes: 0, questions: 0 };
  } catch (e) {
    return { mockExam: 0, aiTalkMinutes: 0, questions: 0 };
  }
}

/**
 * 记录今日用量
 */
function recordUsage(type, amount = 1) {
  const today = getTodayStr();
  const usage = getTodayUsage();
  if (type === 'aiTalkMinutes') {
    usage.aiTalkMinutes = (usage.aiTalkMinutes || 0) + amount;
  } else {
    usage[type] = (usage[type] || 0) + amount;
  }
  wx.setStorageSync(`usage_${today}`, usage);
}

/**
 * 获取今日剩余免费额度
 * @returns {object}
 */
function getRemainingQuota() {
  const membership = getMembership();
  if (membership === 'premium') {
    return { unlimited: true, mockExam: -1, aiTalkMinutes: -1, questions: -1 };
  }
  const usage = getTodayUsage();
  return {
    unlimited: false,
    mockExam: Math.max(0, FREE_DAILY_LIMIT.mockExam - (usage.mockExam || 0)),
    aiTalkMinutes: Math.max(0, FREE_DAILY_LIMIT.aiTalkMinutes - (usage.aiTalkMinutes || 0)),
    questions: Math.max(0, FREE_DAILY_LIMIT.questions - (usage.questions || 0)),
  };
}

/**
 * 检查功能权限，无权限时自动显示升级弹窗
 * @param {string} feature - 'mockExam' | 'aiTalk' | 'advancedQuestions'
 * @param {number} amount - 需要消耗的量（如AI陪练分钟数）
 * @returns {boolean}
 */
function checkPermission(feature, amount = 1) {
  const membership = getMembership();
  if (membership === 'premium') return true;

  const quota = getRemainingQuota();

  if (feature === 'mockExam' && quota.mockExam <= 0) {
    showUpgradeModal('mockExam');
    return false;
  }
  if (feature === 'aiTalk' && quota.aiTalkMinutes < amount) {
    showUpgradeModal('aiTalk');
    return false;
  }
  if (feature === 'advancedQuestions' && quota.questions <= 0) {
    showUpgradeModal('questions');
    return false;
  }
  return true;
}

/**
 * 显示升级提示弹窗
 */
function showUpgradeModal(feature) {
  const featureNames = {
    mockExam: '全真模拟考',
    aiTalk: 'AI陪练',
    questions: '高级题库',
  };
  wx.showModal({
    title: '解锁完整功能',
    content: `免费用户每日${feature === 'mockExam' ? '可参加1次模拟考试' : feature === 'aiTalk' ? '可使用10分钟AI陪练' : '可练习20题'}，升级会员即可无限使用！`,
    confirmText: '查看会员',
    success: (res) => {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/membership/index' });
      }
    },
  });
}

/**
 * 显示通用升级弹窗（用于广告横幅等）
 */
function showUpgradeModalGeneric() {
  wx.showModal({
    title: '升级会员',
    content: '会员尊享无限练习、无广告、AI精批等8大专属权益！',
    confirmText: '查看会员',
    success: (res) => {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/membership/index' });
      }
    },
  });
}

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  getMembership,
  getTodayUsage,
  recordUsage,
  getRemainingQuota,
  checkPermission,
  showUpgradeModal,
  showUpgradeModalGeneric,
  FREE_DAILY_LIMIT,
  MEMBERSHIP_BENEFITS,
};
