// pages/ai-talk/index.js
const api = require('../../utils/api');

Page({
  data: { history: [] },
  onLoad() { this.loadHistory(); },

  async loadHistory() {
    try {
      const res = await api.get('/ai-talk/history?limit=5');
      this.setData({ history: res.data.data?.list || [] });
    } catch (err) {}
  },

  startChat(e) {
    const scene = e.currentTarget.dataset.scene || 'free_talk';
    wx.navigateTo({ url: `/pages/ai-talk/chat?scene=${scene}` });
  },

  startListen() {
    wx.navigateTo({ url: '/pages/ai-talk/listen' });
  },

  goHistory(e) {
    wx.navigateTo({ url: `/pages/ai-talk/chat?id=${e.currentTarget.dataset.id}` });
  },
});