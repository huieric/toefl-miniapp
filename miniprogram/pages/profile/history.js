// pages/profile/history.js
const api = require('../../utils/api');

Page({
  data: { list: [], page: 1, hasMore: true },
  onLoad() { this.loadList(); },
  onReachBottom() { if (this.data.hasMore) { this.setData({ page: this.data.page + 1 }); this.loadList(true); } },

  async loadList(append = false) {
    try {
      const res = await api.get('/exam/history', { page: this.data.page, limit: 15 });
      const { list } = res.data.data || {};
      this.setData({
        list: append ? [...this.data.list, ...(list || [])] : (list || []),
        hasMore: (list || []).length >= 15,
      });
    } catch (err) {}
  },
});