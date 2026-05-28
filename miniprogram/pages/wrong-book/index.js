// pages/wrong-book/index.js
const api = require('../../utils/api');

Page({
  data: { currentTab: 'all', list: [], reviewCount: 0, page: 1, hasMore: true },
  onLoad() { this.loadList(); },
  onReachBottom() { if (this.data.hasMore) { this.setData({ page: this.data.page + 1 }); this.loadList(true); } },

  async loadList(append = false) {
    try {
      const params = { page: this.data.page, limit: 20 };
      if (this.data.currentTab !== 'all') params.subject = this.data.currentTab;
      const res = await api.get('/wrong', params);
      const { list, total } = res.data.data || {};
      this.setData({
        list: append ? [...this.data.list, ...(list || [])] : (list || []),
        reviewCount: total || 0,
        hasMore: (list || []).length >= 20,
      });
    } catch (err) {}
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab, page: 1, list: [] });
    this.loadList();
  },

  goReview() {
    wx.navigateTo({ url: '/pages/wrong-book/redo' });
  },

  redoQuestion(e) {
    wx.navigateTo({ url: `/pages/wrong-book/redo?id=${e.currentTarget.dataset.id}` });
  },
});