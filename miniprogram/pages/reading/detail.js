// pages/reading/detail.js
const api = require('../../utils/api');

Page({
  data: {
    question: null,
    questions: [],
    currentQIndex: 0,
    currentQuestion: null,
    selectedAnswer: '',
    submitted: false,
    showAnalysis: false,
    startTime: 0,
    answers: [], // {questionId, selected, correct}
  },

  onLoad(options) {
    if (options.id) {
      this.loadQuestion(options.id);
    }
    this.setData({ startTime: Date.now() });
  },

  async loadQuestion(id) {
    try {
      const res = await api.get(`/questions/${id}`);
      const question = res.data.data;
      // 解析 questions 字段（JSON字符串或数组）
      let questions = [];
      if (typeof question.questions === 'string') {
        questions = JSON.parse(question.questions);
      } else if (Array.isArray(question.questions)) {
        questions = question.questions;
      }

      this.setData({
        question,
        questions,
        currentQuestion: questions[0] || null,
        currentQIndex: 0,
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  selectAnswer(e) {
    if (this.data.submitted) return;
    this.setData({ selectedAnswer: e.currentTarget.dataset.label });
  },

  submitAnswer() {
    const { selectedAnswer, currentQuestion, answers } = this.data;
    if (!selectedAnswer) return;

    const correct = selectedAnswer === currentQuestion.answer;
    answers.push({
      questionId: currentQuestion.id || this.data.currentQIndex,
      selected: selectedAnswer,
      correct,
    });

    this.setData({ submitted: true, showAnalysis: true, answers });
  },

  nextQuestion() {
    const next = this.data.currentQIndex + 1;
    if (next < this.data.questions.length) {
      this.setData({
        currentQIndex: next,
        currentQuestion: this.data.questions[next],
        selectedAnswer: '',
        submitted: false,
        showAnalysis: false,
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
        showAnalysis: false,
      });
    }
  },

  closeAnalysis() {
    this.setData({ showAnalysis: false });
  },

  async finishPractice() {
    const { answers, questions, startTime } = this.data;
    const correctCount = answers.filter(a => a.correct).length;
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    // 提交练习结果
    try {
      await api.post('/exam/start', {
        subject: 'reading',
        answers,
        totalTime,
      });
    } catch (e) {}

    wx.redirectTo({
      url: `/pages/reading/result?correct=${correctCount}&total=${questions.length}&time=${totalTime}`,
    });
  },

  onTimeUp() {
    wx.showToast({ title: '时间到！', icon: 'none' });
    if (!this.data.submitted) {
      this.finishPractice();
    }
  },
});