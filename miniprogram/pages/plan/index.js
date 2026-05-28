// pages/plan/index.js
const api = require('../../utils/api');

Page({
  data: {
    plan: null,
    phases: [
      { name: '基础夯实', duration: '第1-4周', progress: 0, completed: 0, total: 8 },
      { name: '强化突破', duration: '第5-8周', progress: 0, completed: 0, total: 10 },
      { name: '冲刺模拟', duration: '第9-12周', progress: 0, completed: 0, total: 6 },
    ],
    daysLeft: 0,
    todayCompleted: 0,
    todayTotal: 0,
  },

  onShow() { this.loadPlan(); },

  async loadPlan() {
    try {
      const res = await api.get('/plan/current');
      const plan = res.data.data;
      if (plan) {
        const days = this.calcDays(plan.target_date);
        this.setData({ plan, daysLeft: days, todayCompleted: plan.today_completed || 0, todayTotal: plan.today_total || 4 });
      }
    } catch (err) {}
  },

  calcDays(dateStr) {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    return Math.max(0, Math.ceil((target - new Date()) / 86400000));
  },

  goDaily() { wx.navigateTo({ url: '/pages/plan/daily' }); },
  goSetup() { wx.navigateTo({ url: '/pages/plan/setup' }); },
});