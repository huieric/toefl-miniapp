// pages/mock-exam/index.js
Page({
  startExam() {
    wx.showModal({
      title: '确认开始考试',
      content: '你将进入约3小时的全真模拟考试，考试期间请勿切换页面。确定开始吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/mock-exam/exam' });
        }
      },
    });
  },
});