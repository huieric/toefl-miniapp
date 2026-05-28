// pages/speaking/detail.js
const api = require('../../utils/api');
const recorder = require('../../utils/recorder');

Page({
  data: {
    question: null,
    status: 'idle', // idle | preparing | recording | done
    prepTime: 15,
    recordTime: 45,
    recordFilePath: '',
    audioUrl: '',
  },
  prepTimer: null,
  recordTimer: null,

  onLoad(options) {
    if (options.id) this.loadQuestion(options.id);
  },

  async loadQuestion(id) {
    try {
      const res = await api.get(`/questions/${id}`);
      this.setData({ question: res.data.data });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  startRecording() {
    if (this.data.status !== 'idle' && this.data.status !== 'preparing') return;

    // 如果有准备计时器先清除
    if (this.prepTimer) clearInterval(this.prepTimer);

    this.setData({ status: 'recording', recordTime: 45 });
    recorder.start();

    this.recordTimer = setInterval(() => {
      let t = this.data.recordTime - 1;
      if (t <= 0) {
        this.stopRecording();
      } else {
        this.setData({ recordTime: t });
      }
    }, 1000);
  },

  stopRecording() {
    if (this.recordTimer) clearInterval(this.recordTimer);
    recorder.stop({
      success: (filePath) => {
        this.setData({ status: 'done', recordFilePath: filePath });
      },
      fail: () => {
        wx.showToast({ title: '录音失败', icon: 'none' });
        this.setData({ status: 'idle' });
      },
    });
  },

  playRecording() {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = this.data.recordFilePath;
    innerAudioContext.play();
  },

  async submitAnswer() {
    wx.showLoading({ title: '提交中...' });
    try {
      // 上传录音文件
      const { recordFilePath } = this.data;
      // 简化：直接标记完成
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  onUnload() {
    if (this.prepTimer) clearInterval(this.prepTimer);
    if (this.recordTimer) clearInterval(this.recordTimer);
    recorder.stop();
  },
});