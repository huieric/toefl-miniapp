// pages/ai-talk/chat.js
const api = require('../../utils/api');

Page({
  data: {
    scene: 'free_talk',
    inputText: '',
    messages: [],
    sessionId: null,
    sending: false,
  },
  ws: null,

  onLoad(options) {
    this.setData({ scene: options.scene || 'free_talk' });
    this.startSession();
  },

  async startSession() {
    try {
      const res = await api.post('/ai-talk/start', {
        scene: this.data.scene,
      });
      this.setData({ sessionId: res.data.data?.id });
      // 添加开场白
      this.setData({
        messages: [{ role: 'ai', content: 'Hello! Let us practice English together. What would you like to talk about today?' }],
      });
    } catch (err) {
      this.setData({
        messages: [{ role: 'ai', content: 'Hello! How are you doing today?' }],
      });
    }
  },

  onInput(e) { this.setData({ inputText: e.detail.value }); },

  async sendText() {
    const text = this.data.inputText.trim();
    if (!text || this.data.sending) return;

    const messages = [...this.data.messages, { role: 'user', content: text }];
    this.setData({ messages, inputText: '', sending: true });

    try {
      const res = await api.post(`/ai-talk/${this.data.sessionId || 1}/message`, {
        message: text,
      });
      const aiResponse = res.data.data;
      messages.push({
        role: 'ai',
        content: aiResponse.reply || 'Interesting! Can you tell me more?',
        score: aiResponse.score,
        correction: aiResponse.correction,
      });
    } catch (err) {
      messages.push({ role: 'ai', content: 'Sorry, I didn\'t catch that. Could you repeat?', score: 6 });
    }
    this.setData({ messages, sending: false });
  },

  startVoice() { /* 语音输入 */ },
  stopVoice() { /* 停止语音 */ },

  onUnload() {
    if (this.data.sessionId) {
      api.post(`/ai-talk/${this.data.sessionId}/end`).catch(() => {});
    }
  },
});