// pages/reading/list.js
const api = require('../../utils/api');

Page({
  data: {
    list: [],
    currentFilter: 'all',
    page: 1,
    hasMore: true,
    loading: false,
    total: 0,
  },

  onLoad() {
    this.loadList();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList(true);
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, list: [], hasMore: true });
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  async loadList(append = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const params = { subject: 'reading', page: this.data.page, limit: 20 };
      if (this.data.currentFilter !== 'all') {
        params.difficulty = this.data.currentFilter;
      }

      const res = await api.get('/questions', params);
      const { list, total, totalPages } = res.data.data;

      this.setData({
        list: append ? [...this.data.list, ...list] : list,
        total,
        hasMore: this.data.page < totalPages,
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  setFilter(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.currentFilter) return;
    this.setData({ currentFilter: value, page: 1, list: [], hasMore: true });
    this.loadList();
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/reading/detail?id=${id}` });
  },
});