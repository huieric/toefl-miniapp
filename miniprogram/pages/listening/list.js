// pages/listening/list.js
const api = require('../../utils/api');

Page({
  data: {
    list: [],
    currentFilter: 'all',
    page: 1,
    hasMore: true,
    loading: false,
  },

  onLoad() { this.loadList(); },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList(true);
    }
  },

  async loadList(append = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const params = { subject: 'listening', page: this.data.page, limit: 20 };
      if (this.data.currentFilter !== 'all') {
        params.type = this.data.currentFilter;
      }
      const res = await api.get('/questions', params);
      const { list, totalPages } = res.data.data;
      this.setData({
        list: append ? [...this.data.list, ...list] : list,
        hasMore: this.data.page < totalPages,
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  setFilter(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.currentFilter) return;
    this.setData({ currentFilter: value, page: 1, list: [], hasMore: true });
    this.loadList();
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/listening/detail?id=${e.currentTarget.dataset.id}` });
  },
});