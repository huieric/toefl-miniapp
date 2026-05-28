// pages/index/index.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    plan: null,
    todayTasks: null,
    stats: {},
    wrongCount: 0,
    loading: true,
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.loadData();
    }
  },

  checkLogin() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/auth/auth' });
      return;
    }
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      // 并行加载：统计、计划、今日任务、错题数
      const [statsRes, planRes, tasksRes, wrongRes] = await Promise.all([
        api.get('/user/stats'),
        api.get('/plan/current').catch(() => ({ data: { data: null } })),
        api.get(`/plan/daily/${this.getToday()}`).catch(() => ({ data: { data: null } })),
        api.get('/wrong?page=1&limit=1').catch(() => ({ data: { data: { total: 0 } } })),
      ]);

      this.setData({
        stats: statsRes.data.data || {},
        plan: planRes.data.data || null,
        todayTasks: tasksRes.data.data || null,
        wrongCount: wrongRes.data.data?.total || 0,
        loading: false,
      });
    } catch (err) {
      console.error('[首页] 加载失败:', err);
      this.setData({ loading: false });
    }
  },

  getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 切换任务完成状态
  async toggleTask(e) {
    const { id } = e.currentTarget.dataset;
    const task = this.data.todayTasks.tasks.find(t => t.id === id);
    if (!task) return;

    try {
      await api.put(`/plan/daily/${this.getToday()}/task/${id}`, {
        isCompleted: !task.isCompleted,
      });
      this.loadData(); // 刷新
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 跳转科目练习
  goToSubject(e) {
    const { subject } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/${subject}/list` });
  },

  goToMockExam() {
    wx.navigateTo({ url: '/pages/mock-exam/index' });
  },

  goToWrongBook() {
    wx.navigateTo({ url: '/pages/wrong-book/index' });
  },

  goToAiTalk() {
    wx.switchTab({ url: '/pages/ai-talk/index' });
  },

  goToPlan() {
    wx.navigateTo({ url: '/pages/plan/index' });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});