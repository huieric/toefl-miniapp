// pages/plan/daily.js
const api = require('../../utils/api');

Page({
  data: {
    tasks: [],
    todayDate: '',
    dailyProgress: 0,
    reviewCount: 0,
  },

  onLoad() {
    const d = new Date();
    this.setData({ todayDate: '2026-05-27' });
    this.loadTasks();
  },

  async loadTasks() {
    try {
      const res = await api.get('/plan/daily/2026-05-27');
      const tasks = res.data.data || [];
      const completed = tasks.filter(t => t.completed).length;
      this.setData({
        tasks,
        dailyProgress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        reviewCount: 3,
      });
    } catch (err) {
      this.setData({
        tasks: [
          { id: 1, title: '完成一篇阅读练习', subject: 'reading', subject_label: '阅读', completed: false, estimated_minutes: 36 },
          { id: 2, title: '听力对话练习', subject: 'listening', subject_label: '听力', completed: false, estimated_minutes: 30 },
          { id: 3, title: '口语独立题训练', subject: 'speaking', subject_label: '口语', completed: false, estimated_minutes: 20 },
          { id: 4, title: '写作段落练习', subject: 'writing', subject_label: '写作', completed: false, estimated_minutes: 25 },
        ],
        dailyProgress: 0,
        reviewCount: 3,
      });
    }
  },

  async toggleTask(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.tasks[index];
    task.completed = !task.completed;
    const completed = this.data.tasks.filter(t => t.completed).length;
    this.setData({
      tasks: this.data.tasks,
      dailyProgress: Math.round((completed / this.data.tasks.length) * 100),
    });

    try {
      await api.put(`/plan/daily/2026-05-27/task/${task.id}`, { completed: task.completed });
    } catch (err) {}
  },

  goReview() { wx.navigateTo({ url: '/pages/wrong-book/index' }); },
});