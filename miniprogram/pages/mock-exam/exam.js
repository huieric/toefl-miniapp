// pages/mock-exam/exam.js
Page({
  data: {
    currentSection: 0,
    sections: [
      { label: '阅读', duration: 36 },
      { label: '听力', duration: 41 },
      { label: '口语', duration: 17 },
      { label: '写作', duration: 50 },
    ],
    readingPassage: 'The Origins of Agriculture\nAgriculture, the cultivation of food and goods through farming...',
  },

  nextSection() {
    const next = this.data.currentSection + 1;
    if (next < 4) this.setData({ currentSection: next });
  },

  async submitExam() {
    wx.showLoading({ title: '提交中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.redirectTo({ url: '/pages/mock-exam/result' });
    }, 1000);
  },

  onSectionTimeUp() {
    wx.showToast({ title: '时间到！', icon: 'none' });
    if (this.data.currentSection < 3) {
      setTimeout(() => this.nextSection(), 1000);
    } else {
      this.submitExam();
    }
  },
});