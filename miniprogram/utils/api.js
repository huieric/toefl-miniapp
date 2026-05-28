// utils/api.js - API 请求封装
const BASE_URL = 'https://toefl-api-m1ue.onrender.com/api';

/**
 * 发起请求
 * @param {string} method - GET/POST/PUT/DELETE
 * @param {string} url - 接口路径（不含 base）
 * @param {object} data - 请求体或query参数
 * @returns {Promise}
 */
const request = (method, url, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data: method === 'GET' ? data : data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // 清除token，跳转登录
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/auth/auth' });
          reject(new Error('登录已过期'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          const msg = (res.data && res.data.message) || '请求失败';
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      },
    });
  });
};

// ========== 会员相关 API ==========

/** 获取会员套餐列表 */
const getMembershipPlans = () => api.get('/membership/plans');

/** 创建订单 */
const createOrder = (planType) => api.post('/membership/create-order', { planType });

/** 获取我的订阅信息 */
const getMySubscription = () => api.get('/membership/my-subscription');

/** 获取今日剩余免费额度 */
const getUsageLimit = () => api.get('/user/usage-limit');

/** 记录广告展示 */
const recordAdImpression = (placement, adId) =>
  api.post('/ads/impression', { placement, adId });

/** 获取广告横幅内容 */
const getAdBanner = (placement) => api.get(`/ads/banner/${placement}`);

module.exports = {
  get: (url, params) => request('GET', url, params),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  del: (url, data) => request('DELETE', url, data),
  // 会员
  getMembershipPlans,
  createOrder,
  getMySubscription,
  getUsageLimit,
  // 广告
  recordAdImpression,
  getAdBanner,
};