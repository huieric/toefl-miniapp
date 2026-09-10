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
    path: '/reading/passage/:passageId',
    name: 'ReadingPassage',
    component: () => import('@/views/ReadingPassage.vue'),
    meta: { title: '篇章练习' },
  },
  {
    path: '/reading/passage/:passageId/result',
    name: 'ReadingPassageResult',
    component: () => import('@/views/ReadingPassageResult.vue'),
    meta: { title: '篇章结果' },
  },
  // 兼容旧路由：/reading/数字ID → 重定向到 /reading（旧单题模式已废弃）
  {
    path: '/reading/:id',
    redirect: to => {
      if (/^\d+$/.test(to.params.id)) {
        return '/reading'
      }
      return '/reading'
    },
  },
  {
    path: '/reading/:id/result',
    redirect: '/reading',
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
    path: '/speaking/practice',
    name: 'SpeakingPractice',
    component: () => import('@/views/SpeakingPractice.vue'),
    meta: { title: 'AI 口语陪练' },
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
    path: '/achievements',
    name: 'Achievements',
    component: () => import('@/views/Achievements.vue'),
    meta: { title: '成就徽章' },
  },
  {
    path: '/match-mode',
    name: 'MatchMode',
    component: () => import('@/views/MatchMode.vue'),
    meta: { title: '配对游戏' },
  },
  {
    path: '/weekly-report',
    name: 'WeeklyReport',
    component: () => import('@/views/WeeklyReport.vue'),
    meta: { title: '学习周报' },
  },
  {
    path: '/daily-challenge',
    name: 'DailyChallenge',
    component: () => import('@/views/DailyChallenge.vue'),
    meta: { title: '每日闯关' },
  },
  {
    path: '/focus-timer',
    name: 'FocusTimer',
    component: () => import('@/views/FocusTimer.vue'),
    meta: { title: '专注森林' },
  },
  {
    path: '/skill-mastery',
    name: 'SkillMastery',
    component: () => import('@/views/SkillMastery.vue'),
    meta: { title: '技能掌握' },
  },
  {
    path: '/streak-freeze',
    name: 'StreakFreeze',
    component: () => import('@/views/StreakFreeze.vue'),
    meta: { title: '连续保护' },
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
    path: '/ai-tutor',
    name: 'AiTutor',
    component: () => import('@/views/AiTutor.vue'),
    meta: { title: 'AI导师' },
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
    path: '/profile/ai-settings',
    name: 'AiSettings',
    component: () => import('@/views/AiSettings.vue'),
    meta: { title: 'AI 设置' },
  },
  {
    path: '/membership',
    name: 'Membership',
    component: () => import('@/views/Membership.vue'),
    meta: { title: '会员中心' },
  },
  {
    path: '/vocab',
    name: 'VocabList',
    component: () => import('@/views/VocabList.vue'),
    meta: { title: '生词本' },
  },
  {
    path: '/vocab/review',
    name: 'VocabReview',
    component: () => import('@/views/VocabReviewEnhanced.vue'),
    meta: { title: '生词复习' },
  },
  {
    path: '/quiz-reaction',
    name: 'QuizReaction',
    component: () => import('@/views/QuizReaction.vue'),
    meta: { title: '情感反馈' },
  },
  {
    path: '/language-level',
    name: 'LanguageLevel',
    component: () => import('@/views/LanguageLevel.vue'),
    meta: { title: '语言等级' },
  },
  {
    path: '/daily-goals',
    name: 'DailyGoals',
    component: () => import('@/views/DailyGoals.vue'),
    meta: { title: '每日目标' },
  },

  // Round 26: 学习热力图 + 语法助手 + 专注时间线
  {
    path: '/study-heatmap',
    name: 'StudyHeatmap',
    component: () => import('@/views/StudyHeatmap.vue'),
    meta: { title: '学习热力图' },
  },
  {
    path: '/grammar-assistant',
    name: 'GrammarAssistant',
    component: () => import('@/views/GrammarAssistant.vue'),
    meta: { title: '语法助手' },
  },
  {
    path: '/focus-session',
    name: 'FocusSession',
    component: () => import('@/views/FocusSession.vue'),
    meta: { title: '专注时间线' },
  },

  // Round 27: ELSA 音素教练 + 速度阅读 + 题目收藏
  {
    path: '/phoneme-coach',
    name: 'PhonemeCoach',
    component: () => import('@/views/PhonemeCoach.vue'),
    meta: { title: 'ELSA 音素教练' },
  },
  {
    path: '/speed-reading',
    name: 'SpeedReading',
    component: () => import('@/views/SpeedReading.vue'),
    meta: { title: '速度阅读训练' },
  },
  {
    path: '/bookmarks',
    name: 'BookmarkList',
    component: () => import('@/views/BookmarkList.vue'),
    meta: { title: '题目收藏' },
  },

  // Round 28: 联赛系统 + 间隔重复复习 + 分数预测
  {
    path: '/league',
    name: 'League',
    component: () => import('@/views/League.vue'),
    meta: { title: '联赛系统' },
  },
  {
    path: '/srs-review',
    name: 'SRSReview',
    component: () => import('@/views/SRSReview.vue'),
    meta: { title: '间隔重复复习' },
  },
  {
    path: '/score-predictor',
    name: 'ScorePredictor',
    component: () => import('@/views/ScorePredictor.vue'),
    meta: { title: '托福分数预测' },
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
  // Round 29: 全真模考 + 学习路径 + 每日碎片学习
  {
    path: '/mock-exam',
    name: 'MockExam',
    component: () => import('@/views/MockExam.vue'),
    meta: { title: '全真模考', noLayout: true },
  },
  {
    path: '/learning-path',
    name: 'LearningPath',
    component: () => import('@/views/LearningPath.vue'),
    meta: { title: '学习路径' },
  },
  {
    path: '/daily-micro',
    name: 'DailyMicro',
    component: () => import('@/views/DailyMicro.vue'),
    meta: { title: '每日碎片学习' },
  },

  // Round 30: 听力精听 + 词汇图谱 + 成就徽章升级
  {
    path: '/intensive-listening',
    name: 'IntensiveListening',
    component: () => import('@/views/IntensiveListening.vue'),
    meta: { title: '听力精听' },
  },
  {
    path: '/vocab-graph',
    name: 'VocabGraph',
    component: () => import('@/views/VocabGraph.vue'),
    meta: { title: '词汇图谱' },
  },
  {
    path: '/enhanced-achievements',
    name: 'EnhancedAchievements',
    component: () => import('@/views/EnhancedAchievements.vue'),
    meta: { title: '成就徽章' },
  },

  // Round 35: AI 题目解析 + 写作评分增强 + 口语跟读练习
  {
    path: '/question-explanation/:id',
    name: 'QuestionExplanation',
    component: () => import('@/views/QuestionExplanation.vue'),
    meta: { title: 'AI 题目解析' },
  },
  {
    path: '/writing-enhanced',
    name: 'WritingEnhanced',
    component: () => import('@/views/WritingEnhanced.vue'),
    meta: { title: '写作评分增强' },
  },
  {
    path: '/shadow-practice',
    name: 'ShadowPractice',
    component: () => import('@/views/ShadowPractice.vue'),
    meta: { title: '口语跟读练习' },
  },

  // Round 36: AI 即时反馈 + 词汇游戏 + 薄弱点分析
  {
    path: '/instant-feedback',
    name: 'InstantFeedback',
    component: () => import('@/views/InstantFeedback.vue'),
    meta: { title: 'AI 即时解题' },
  },
  {
    path: '/vocab-games',
    name: 'VocabGames',
    component: () => import('@/views/VocabGames.vue'),
    meta: { title: '词汇游戏' },
  },
  {
    path: '/weak-points',
    name: 'WeakPoints',
    component: () => import('@/views/WeakPoints.vue'),
    meta: { title: '薄弱点分析' },
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
  const premiumRoutes = ['/mock-exam', '/ai-talk', '/speaking/practice', '/learning-path', '/daily-micro', '/intensive-listening', '/vocab-graph', '/enhanced-achievements']
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
  // 管理后台路由拦截（校验管理员 token）
  if (to.path.startsWith('/admin')) {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      next('/auth?redirect=admin')
      return
    }
  }
  next()
})

export default router