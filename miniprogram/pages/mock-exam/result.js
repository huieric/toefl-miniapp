// pages/mock-exam/result.js
Page({
  data: {
    radarScores: [22, 24, 20, 21],
    subjects: [
      { subject: '阅读 Reading', score: 22 },
      { subject: '听力 Listening', score: 24 },
      { subject: '口语 Speaking', score: 20 },
      { subject: '写作 Writing', score: 21 },
    ],
  },
  goHome() { wx.switchTab({ url: '/pages/index/index' }); },
});