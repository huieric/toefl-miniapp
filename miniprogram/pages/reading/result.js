// pages/reading/result.js
Page({
  data: {
    loaded: false,
    correct: 0,
    wrong: 0,
    total: 0,
    score: 0,
    results: [],
  },

  onLoad(options) {
    const { correct, total, time } = options;
    const correctNum = parseInt(correct) || 0;
    const totalNum = parseInt(total) || 1;
    const wrong = totalNum - correctNum;

    // 托福阅读分数估算（简化版）
    const accuracy = correctNum / totalNum;
    let score = 0;
    if (accuracy >= 0.95) score = 30;
    else if (accuracy >= 0.85) score = 27;
    else if (accuracy >= 0.75) score = 23;
    else if (accuracy >= 0.65) score = 19;
    else if (accuracy >= 0.50) score = 15;
    else score = Math.round(accuracy * 20);

    // 生成逐题结果
    const results = [];
    for (let i = 0; i < totalNum; i++) {
      results.push({
        correct: i < correctNum,
      });
    }

    this.setData({
      loaded: true,
      correct: correctNum,
      wrong,
      total: totalNum,
      score,
      results,
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goWrong() {
    wx.navigateTo({ url: '/pages/wrong-book/index' });
  },
});