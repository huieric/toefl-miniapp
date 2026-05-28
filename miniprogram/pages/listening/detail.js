// pages/listening/detail.js
const api = require('../../utils/api');

Page({
  data: {
    question: null,
    questions: [],
    currentQIndex: 0,
    currentQuestion: null,
    selectedAnswer: '',
    submitted: false,
    audioUrl: '',
    audioPlayed: false,
    startTime: 0,
    answers: [],
  },

  onLoad(options) {
    if (options.id) this.loadQuestion(options.id);
    this.setData({ startTime: Date.now() });
  },

  async loadQuestion(id) {
    try {
      const res = await api.get(`/questions/${id}`);
      const question = res.data.data;
      let questions = [];
      if (typeof question.questions === 'string') questions = JSON.parse(question.questions);
      else if (Array.isArray(question.questions)) questions = question.questions;

      this.setData({
        question,
        questions,
        currentQuestion: questions[0] || null,
        audioUrl: question.audio_url || '',
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onAudioEnded() {
    this.setData({ audioPlayed: true });
  },

  selectAnswer(e) {
    if (this.data.submitted) return;
    this.setData({ selectedAnswer: e.currentTarget.dataset.label });
  },

  submitAnswer() {
    if (!this.data.selectedAnswer) return;
    const correct = this.data.selectedAnswer === this.data.currentQuestion.answer;
    this.data.answers.push({
      questionId: this.data.currentQIndex,
      selected: this.data.selectedAnswer,
      correct,
    });
    this.setData({ submitted: true });
  },

  nextQuestion() {
    const next = this.data.currentQIndex + 1;
    if (next < this.data.questions.length) {
      this.setData({
        currentQIndex: next,
        currentQuestion: this.data.questions[next],
        selectedAnswer: '',
        submitted: false,
      });
    }
  },

  prevQuestion() {
    const prev = this.data.currentQIndex - 1;
    if (prev >= 0) {
      this.setData({
        currentQIndex: prev,
        currentQuestion: this.data.questions[prev],
        selectedAnswer: '',
        submitted: false,
      });
    }
  },

  async finishPractice() {
    const correctCount = this.data.answers.filter(a => a.correct).length;
    const totalTime = Math.round((Date.now() - this.data.startTime) / 1000);
    try {
      await api.post('/exam/start', {
        subject: 'listening',
        answers: this.data.answers,
        totalTime,
      });
    } catch (e) {}
    wx.redirectTo({
      url: `/pages/listening/result?correct=${correctCount}&total=${this.data.questions.length}&time=${totalTime}`,
    });
  },
});