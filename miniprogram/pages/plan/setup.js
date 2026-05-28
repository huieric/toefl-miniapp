// pages/plan/setup.js
const api = require('../../utils/api');

Page({
  data: {
    targetScore: 90,
    examDate: '',
    currentLevel: 70,
    dailyHours: 2,
    focus: ['reading', 'listening'],
    generating: false,
  },

  setScore(e) { this.setData({ targetScore: parseInt(e.currentTarget.dataset.value) }); },
  onSlideScore(e) { this.setData({ targetScore: e.detail.value }); },

  onDateChange(e) { this.setData({ examDate: e.detail.value }); },

  setLevel(e) { this.setData({ currentLevel: parseInt(e.currentTarget.dataset.value) }); },
  setHours(e) { this.setData({ dailyHours: parseInt(e.currentTarget.dataset.value) }); },

  toggleFocus(e) {
    const val = e.currentTarget.dataset.value;
    let focus = [...this.data.focus];
    const idx = focus.indexOf(val);
    if (idx >= 0) focus.splice(idx, 1); else focus.push(val);
    this.setData({ focus });
  },

  async generatePlan() {
    if (!this.data.examDate) return;
    this.setData({ generating: true });
    wx.showLoading({ title: 'AI生成中...' });

    try {
      await api.post('/plan/create', {
        target_score: this.data.targetScore,
        exam_date: this.data.examDate,
        current_level: this.data.currentLevel,
        daily_hours: this.data.dailyHours,
        focus: this.data.focus,
      });
      wx.hideLoading();
      wx.showToast({ title: '计划生成成功！', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/plan/index' }), 1000);
    } catch (err) {
      wx.hideLoading();
      this.setData({ generating: false });
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    }
  },
});