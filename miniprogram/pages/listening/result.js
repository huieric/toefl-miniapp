// pages/listening/result.js
Page({
  data: { loaded: false, correct: 0, wrong: 0, total: 0, score: 0, timeStr: '' },
  onLoad(options) {
    const { correct, total, time } = options;
    const c = parseInt(correct) || 0;
    const t = parseInt(total) || 1;
    const accuracy = c / t;
    let s = 0;
    if (accuracy >= 0.95) s = 30; else if (accuracy >= 0.85) s = 27; else if (accuracy >= 0.75) s = 23; else if (accuracy >= 0.65) s = 19; else if (accuracy >= 0.50) s = 15; else s = Math.round(accuracy * 20);
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    this.setData({ loaded: true, correct: c, wrong: t - c, total: t, score: s, timeStr: `${mins}:${String(secs).padStart(2,'0')}` });
  },
  goBack() { wx.navigateBack(); },
});