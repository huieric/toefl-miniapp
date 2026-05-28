// pages/wrong-book/redo.js
const api = require('../../utils/api');

Page({
  data: {
    question: null,
    selected: '',
    submitted: false,
    quality: null,
  },

  onLoad(options) {
    if (options.id) this.loadQuestion(options.id);
  },

  async loadQuestion(id) {
    // 模拟题目
    this.setData({
      question: {
        id,
        title: '错题重做',
        content: 'What is the main idea of this passage?',
        answer: 'B',
        options: [
          { label: 'A', text: 'Option A' },
          { label: 'B', text: 'Option B' },
          { label: 'C', text: 'Option C' },
          { label: 'D', text: 'Option D' },
        ],
      },
    });
  },

  onSelect(e) {
    if (this.data.submitted) return;
    this.setData({ selected: e.detail });
  },

  submitAnswer() {
    if (!this.data.selected) return;
    this.setData({ submitted: true });
    const correct = this.data.selected === this.data.question.answer;
    if (correct) {
      wx.showToast({ title: '回答正确！', icon: 'success' });
    } else {
      wx.showToast({ title: '回答错误', icon: 'none' });
    }
  },

  setQuality(e) {
    this.setData({ quality: parseInt(e.currentTarget.dataset.value) });
  },

  async confirmRedo() {
    if (this.data.quality === null) return;
    try {
      await api.post(`/wrong/${this.data.question.id}/redo`, {
        quality: this.data.quality,
      });
      wx.showToast({ title: '复习完成', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
});