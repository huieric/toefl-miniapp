// pages/writing/detail.js
const api = require('../../utils/api');

Page({
  data: {
    question: null,
    essay: '',
    submitting: false,
    startTime: 0,
  },
  onLoad(options) {
    if (options.id) this.loadQuestion(options.id);
    this.setData({ startTime: Date.now() });
  },

  async loadQuestion(id) {
    try {
      const res = await api.get(`/questions/${id}`);
      this.setData({ question: res.data.data });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onEssayInput(e) {
    this.setData({ essay: e.detail.value });
  },

  async submitAnswer() {
    if (this.data.essay.length < 50) return;
    this.setData({ submitting: true });

    try {
      const timeSpent = Math.round((Date.now() - this.data.startTime) / 1000);
      const res = await api.post('/exam/start', {
        subject: 'writing',
        questionId: this.data.question.id,
        essay: this.data.essay,
        totalTime: timeSpent,
      });

      // 跳转到结果页
      const examId = res.data.data?.id || 0;
      wx.redirectTo({
        url: `/pages/writing/result?examId=${examId}&questionId=${this.data.question.id}&essay=${encodeURIComponent(this.data.essay.substring(0, 200))}&time=${timeSpent}`,
      });
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  onTimeUp() {
    wx.showToast({ title: '时间到，自动提交', icon: 'none' });
    this.submitAnswer();
  },
});