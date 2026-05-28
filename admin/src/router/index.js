import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import UserAnalytics from '../views/UserAnalytics.vue';
import UsageTrend from '../views/UsageTrend.vue';
import QuestionReview from '../views/QuestionReview.vue';
import FeedbackManage from '../views/FeedbackManage.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, meta: { title: '数据总览' } },
  { path: '/users', component: UserAnalytics, meta: { title: '用户分析' } },
  { path: '/usage', component: UsageTrend, meta: { title: '使用趋势' } },
  { path: '/questions', component: QuestionReview, meta: { title: '题目审核' } },
  { path: '/feedback', component: FeedbackManage, meta: { title: '反馈管理' } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;