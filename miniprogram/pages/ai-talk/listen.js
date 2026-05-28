// pages/ai-talk/listen.js
Page({
  data: { currentTopic: 'campus', started: false },
  selectTopic(e) { this.setData({ currentTopic: e.currentTarget.dataset.value }); },
  startListening() { this.setData({ started: true }); },
  stopListening() { this.setData({ started: false }); },
});