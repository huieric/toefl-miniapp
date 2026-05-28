import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '学习仪表盘' },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: { title: '登录', noLayout: true },
  },
  {
    path: '/reading',
    name: 'ReadingList',
    component: () => import('@/views/ReadingList.vue'),
    meta: { title: '阅读练习' },
  },
  {
    path: '/reading/:id',
    name: 'ReadingDetail',
    component: () => import('@/views/ReadingDetail.vue'),
    meta: { title: '阅读做题' },
  },
  {
    path: '/reading/:id/result',
    name: 'ReadingResult',
    component: () => import('@/views/ReadingResult.vue'),
    meta: { title: '阅读结果' },
  },
  {
    path: '/listening',
    name: 'ListeningList',
    component: () => import('@/views/ListeningList.vue'),
    meta: { title: '听力练习' },
  },
  {
    path: '/listening/:id',
    name: 'ListeningDetail',
    component: () => import('@/views/ListeningDetail.vue'),
    meta: { title: '听力做题' },
  },
  {
    path: '/listening/:id/result',
    name: 'ListeningResult',
    component: () => import('@/views/ListeningResult.vue'),
    meta: { title: '听力结果' },
  },
  {
    path: '/speaking',
    name: 'SpeakingList',
    component: () => import('@/views/SpeakingList.vue'),
    meta: { title: '口语练习' },
  },
  {
    path: '/speaking/:id',
    name: 'SpeakingDetail',
    component: () => import('@/views/SpeakingDetail.vue'),
    meta: { title: '口语答题' },
  },
  {
    path: '/writing',
    name: 'WritingList',
    component: () => import('@/views/WritingList.vue'),
    meta: { title: '写作练习' },
  },
  {
    path: '/writing/:id',
    name: 'WritingDetail',
    component: () => import('@/views/WritingDetail.vue'),
    meta: { title: '写作答题' },
  },
  {
    path: '/writing/:id/result',
    name: 'WritingResult',
    component: () => import('@/views/WritingResult.vue'),
    meta: { title: 'AI批改结果' },
  },
  {
    path: '/mock-exam',
    name: 'MockExamIndex',
    component: () => import('@/views/MockExamIndex.vue'),
    meta: { title: '模拟考试' },
  },
  {
    path: '/mock-exam/:id',
    name: 'MockExamExam',
    component: () => import('@/views/MockExamExam.vue'),
    meta: { title: '考试答题' },
  },
  {
    path: '/mock-exam/:id/result',
    name: 'MockExamResult',
    component: () => import('@/views/MockExamResult.vue'),
    meta: { title: '考试成绩' },
  },
  {
    path: '/wrong-book',
    name: 'WrongBook',
    component: () => import('@/views/WrongBook.vue'),
    meta: { title: '错题本' },
  },
  {
    path: '/wrong-book/redo',
    name: 'WrongBookRedo',
    component: () => import('@/views/WrongBookRedo.vue'),
    meta: { title: '重做错题' },
  },
  {
    path: '/ai-talk',
    name: 'AiTalkIndex',
    component: () => import('@/views/AiTalkIndex.vue'),
    meta: { title: 'AI陪练' },
  },
  {
    path: '/ai-talk/chat',
    name: 'AiTalkChat',
    component: () => import('@/views/AiTalkChat.vue'),
    meta: { title: 'AI对话' },
  },
  {
    path: '/plan',
    name: 'PlanIndex',
    component: () => import('@/views/PlanIndex.vue'),
    meta: { title: '学习计划' },
  },
  {
    path: '/plan/setup',
    name: 'PlanSetup',
    component: () => import('@/views/PlanSetup.vue'),
    meta: { title: '创建计划' },
  },
  {
    path: '/plan/daily',
    name: 'PlanDaily',
    component: () => import('@/views/PlanDaily.vue'),
    meta: { title: '每日任务' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心' },
  },
  {
    path: '/profile/feedback',
    name: 'Feedback',
    component: () => import('@/views/Feedback.vue'),
    meta: { title: '意见反馈' },
  },
  {
    path: '/profile/history',
    name: 'History',
    component: () => import('@/views/History.vue'),
    meta: { title: '练习历史' },
  },
  {
    path: '/membership',
    name: 'Membership',
    component: () => import('@/views/Membership.vue'),
    meta: { title: '会员中心' },
  },
  // Admin routes (independent layout, no sidebar)
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboardHome',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: '管理后台 - 数据总览' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/AdminUsers.vue'),
        meta: { title: '管理后台 - 用户管理' },
      },
      {
        path: 'questions',
        name: 'AdminQuestions',
        component: () => import('@/views/admin/AdminQuestions.vue'),
        meta: { title: '管理后台 - 题目审核' },
      },
      {
        path: 'feedback',
        name: 'AdminFeedback',
        component: () => import('@/views/admin/AdminFeedback.vue'),
        meta: { title: '管理后台 - 反馈管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory('/toefl-miniapp/web/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  // 未登录拦截
  if (to.path !== '/auth' && !token && to.meta.noLayout !== true) {
    next('/auth')
    return
  }
  // 会员专享路由拦截
  const premiumRoutes = ['/mock-exam', '/ai-talk']
  const isPremiumRoute = premiumRoutes.some(p => to.path.startsWith(p))
  if (isPremiumRoute && token) {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (userInfo.membership !== 'premium') {
        next('/membership')
        return
      }
    } catch { /* ignore */ }
  }
  // 管理后台路由拦截（简单校验，生产环境需后端鉴权）
  if (to.path.startsWith('/admin')) {
    // 预留：可在此处校验管理员 token
  }
  next()
})

export default router