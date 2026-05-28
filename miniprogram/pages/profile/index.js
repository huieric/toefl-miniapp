// pages/profile/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    userInfo: {},
    stats: { total_practice: 0, total_minutes: 0, accuracy: 0, target_score: 90, total_days: 0 },
  },

  onShow() { this.loadProfile(); },

  async loadProfile() {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/user/profile').catch(() => ({ data: { data: {} } })),
        api.get('/user/stats').catch(() => ({ data: { data: {} } })),
      ]);
      this.setData({
        userInfo: profileRes.data.data || {},
        stats: { ...this.data.stats, ...(statsRes.data.data || {}) },
      });
    } catch (err) {}
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '托福考试智能备考助手 v1.0.0\nAI驱动的个性化备考平台',
      showCancel: false,
    });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          auth.clearToken();
          wx.reLaunch({ url: '/pages/auth/auth' });
        }
      },
    });
  },
});