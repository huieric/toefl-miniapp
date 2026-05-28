// pages/profile/feedback.js
const api = require('../../utils/api');

Page({
  data: { feedbackType: 'suggest', content: '', contact: '' },
  setType(e) { this.setData({ feedbackType: e.currentTarget.dataset.value }); },
  onInput(e) { this.setData({ content: e.detail.value }); },
  onContactInput(e) { this.setData({ contact: e.detail.value }); },

  async submitFeedback() {
    if (!this.data.content.trim()) return;
    try {
      await api.post('/feedback', {
        type: this.data.feedbackType,
        content: this.data.content,
        contact: this.data.contact,
      });
      wx.showToast({ title: '感谢你的反馈！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },
});