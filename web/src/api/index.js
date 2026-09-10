import axios from 'axios'
import offlineDB from '@/utils/offline-db'

// 后端 API 地址：本地开发用 VITE_API_BASE 覆盖（见 web/.env.development），生产默认指向已部署后端
const API_BASE = import.meta.env.VITE_API_BASE || 'https://toefl-api-m1ue.onrender.com/api'

const http = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => {
    // 错题列表 → 缓存到 IndexedDB
    if (res.config.url?.startsWith('/wrong') && res.data?.data?.questions) {
      const questions = res.data.data.questions
      if (Array.isArray(questions)) {
        offlineDB.cacheWrongQuestions(questions).catch(() => {})
      }
    }
    // 练习结果 → 缓存
    if (res.config.url?.startsWith('/practice') && res.data?.data) {
      offlineDB.logPractice({ ...res.data.data, cachedAt: new Date().toISOString() }).catch(() => {})
    }
    // 篇章数据 → 缓存
    if (res.config.url?.startsWith('/questions/passage') && res.data?.data) {
      const passage = res.data.data
      if (passage.questions) {
        offlineDB.cachePassage(passage).catch(() => {})
      }
    }
    return res
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/toefl-miniapp/web/auth'
    }
    // 分类错误信息，方便组件层给出更好的提示
    if (err.code === 'ECONNABORTED') {
      err._category = 'timeout'
      err._userMessage = '请求超时，请检查网络后重试'
    } else if (!err.response) {
      err._category = 'network'
      err._userMessage = '网络连接失败，请检查网络后重试'
    } else if (err.response.status >= 500) {
      err._category = 'server'
      err._userMessage = '服务器繁忙，请稍后重试'
    }
    return Promise.reject(err)
  },
)

/**
 * 带自动重试的请求封装（用于应对 Render 冷启动）
 * @param {Function} requestFn - 返回 Promise 的请求函数
 * @param {Object} options - { retries: 2, retryDelay: 2000 }
 */
export async function withRetry(requestFn, { retries = 2, retryDelay = 2000 } = {}) {
  try {
    return await requestFn()
  } catch (err) {
    // 仅对超时和网络错误进行重试（5xx 和 4xx 不重试）
    if (retries > 0 && (err._category === 'timeout' || err._category === 'network')) {
      await new Promise(r => setTimeout(r, retryDelay))
      return withRetry(requestFn, { retries: retries - 1, retryDelay })
    }
    throw err
  }
}

// Auth
export const authAPI = {
  sendCode: (phone) => http.post('/auth/send-code', { phone }),
  login: (phone, code) => http.post('/auth/login', { phone, code }),
  getProfile: () => http.get('/auth/profile'),
  updateProfile: (data) => http.put('/auth/profile', data),
}

// Health
export const healthAPI = {
  check: () => axios.get(`${API_BASE}/health`, { timeout: 12000 }),
}

// Questions
export const questionAPI = {
  list: (params) => http.get('/questions', { params }),
  listGrouped: (params) => http.get('/questions', { params: { ...params, groupBy: 'passage' } }),
  listSets: (params) => http.get('/questions', { params: { ...params, groupBy: 'set' } }),
  getById: (id) => http.get(`/questions/${id}`),
  getPassage: (passageId) => http.get(`/questions/passage/${passageId}`),
  getBySubject: (subject, params) => http.get('/questions', { params: { subject, ...params } }),
  generate: (data) => http.post('/questions/generate', data),
  upload: (formData, onProgress) =>
    http.post('/questions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 大 PDF 上传放宽到 5 分钟
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    }),
  uploadStatus: (uploadId) => http.get(`/questions/upload/${uploadId}/status`),
  // 题目管理
  deleteQuestion: (id) => http.delete(`/questions/${id}`),
  deletePassage: (passageId) => http.delete(`/questions/passage/${passageId}`),
  deleteBatch: (batchId) => http.delete(`/questions/batch/${batchId}`),
  renameBatch: (batchId, batchName) => http.patch(`/questions/batch/${batchId}`, { batchName }),
  renameQuestion: (id, title) => http.patch(`/questions/${id}`, { title }),
  regroup: (data) => http.post('/questions/regroup', data),
  uploadBatch: (formData) => http.post('/questions/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  }),
  // 智能推荐
  recommend: (limit) => http.get('/questions/recommend', { params: { limit } }),
}

export const adminAPI = {
  questions: (params) => http.get('/admin/questions', { params }),
  approveQuestion: (id) => http.put(`/admin/questions/${id}/approve`),
  rejectQuestion: (id) => http.put(`/admin/questions/${id}/reject`),
}

// Practice
export const practiceAPI = {
  submit: (data) => http.post('/practice/submit', data),
  history: (params) => http.get('/practice/history', { params }),
  getResult: (id) => http.get(`/practice/result/${id}`),
  stats: () => http.get('/practice/stats'),
  aiAnnotate: (data) => http.post('/ai/annotate', data),
  brainstorm: (data) => http.post('/practice/brainstorm', data),
  polish: (data) => http.post('/practice/polish', data),
}

// Exam
export const examAPI = {
  start: (data) => http.post('/exam/start', data),
  submit: (id, data) => http.post(`/exam/${id}/submit`, data),
  result: (id) => http.get(`/exam/${id}/result`),
  history: (params) => http.get('/exam/history', { params }),
}

// Wrong
export const wrongAPI = {
  list: (params) => http.get('/wrong', { params }),
  stats: () => http.get('/wrong/stats'),
  reviewPlan: () => http.get('/wrong/review-plan'),
  submitReview: (wrongId, rating) => http.post(`/wrong/${wrongId}/redo`, { rating }),
  // 错题自动归因
  attribution: () => http.get('/analysis/attribution'),
}

// AI Talk
export const aiTalkAPI = {
  scenarios: () => http.get('/ai-talk/scenarios'),
  start: (data) => http.post('/ai-talk/start', data),
  send: (sessionId, message) => http.post(`/ai-talk/${sessionId}/send`, { message }),
  history: (sessionId) => http.get(`/ai-talk/${sessionId}/messages`),
  sessions: () => http.get('/ai-talk/sessions'),
}

// Plan
export const planAPI = {
  create: (data) => http.post('/plan/create', data),
  current: () => http.get('/plan/current'),
  daily: () => http.get('/plan/daily'),
  toggleTask: (taskId, isCompleted) => http.put(`/plan/daily/task/${taskId}`, { isCompleted }),
}

// Feedback
export const feedbackAPI = {
  submit: (data) => http.post('/feedback', data),
}

// User Stats
export const userAPI = {
  dashboard: () => http.get('/user/dashboard'),
  progress: () => http.get('/user/progress'),
  streak: () => http.get('/user/streak'),
  getStreak: () => http.get('/user/streak'),
  updateStudy: (data) => http.post('/user/update-study', data),
  getWeeklyReport: () => http.get('/user/weekly-report'),
}

// AI Tutor
export const aiTutorAPI = {
  analysis: () => http.get('/ai-tutor/analysis'),
  ask: (question, conversationHistory) => http.post('/ai-tutor/ask', { question, conversationHistory }),
  dataPreview: () => http.get('/ai-tutor/data-preview'),
}

// Vocabulary（生词本）
export const vocabAPI = {
  list: (params) => http.get('/vocab', { params }),
  listSets: () => http.get('/vocab/sets'),
  add: (data) => http.post('/vocab', data),
  review: () => http.get('/vocab/review'),
  submitReview: (id, rating) => http.post(`/vocab/${id}/review`, { rating }),
  lookup: (word) => http.get('/vocab/lookup', { params: { word } }),
}

// AI 打分
export const aiAPI = {
  grade: (data) => http.post('/ai/grade', data),
}

// AI 口语陪练
export const aiSpeakAPI = {
  start: (data) => http.post('/ai-speak/start', data),
  grade: (data) => http.post('/ai-speak/grade', data),
  progress: () => http.get('/ai-speak/progress'),
}

// AI 口语模拟对话
export const aiConversationAPI = {
  start: (data) => http.post('/ai-conversation/start', data),
  respond: (data) => http.post('/ai-conversation/respond', data),
  finish: (data) => http.post('/ai-conversation/finish', data),
}

// 错题智能复习推送
export const reviewAPI = {
  push: (data) => http.post('/review/push', data),
  complete: (data) => http.post('/review/complete', data),
}

// 成就/XP 系统
export const achievementAPI = {
  award: (data) => http.post('/achievements/award', data),
  list: () => http.get('/achievements/list'),
  stats: () => http.get('/achievements/stats'),
  getProfile: () => http.get('/user/profile'),
}

// Match Mode 配对游戏
export const matchAPI = {
  getVocabSets: () => http.get('/vocab/sets'),
}

// 学习周报
export const weeklyAPI = {
  getReport: () => http.get('/user/weekly-report'),
}

// 每日挑战
export const challengeAPI = {
  get: () => http.get('/daily-challenge'),
  updateProgress: (taskId) => http.post(`/daily-challenge/${taskId}/progress`),
}

// 专注森林
export const focusAPI = {
  getOptions: () => http.get('/focus-timer/options'),
  start: (duration) => http.post('/focus-timer/start', { duration }),
  complete: (sessionId) => http.post(`/focus-timer/${sessionId}/complete`),
  abort: (sessionId) => http.post(`/focus-timer/${sessionId}/abort`),
  getHistory: () => http.get('/focus-timer/history'),
}

// 技能掌握
export const skillMasteryAPI = {
  getBySubject: (subject) => http.get('/skill-mastery', { params: { subject } }),
  getAll: () => http.get('/skill-mastery/all'),
}

// 连续保护
export const streakFreezeAPI = {
  get: () => http.get('/streak-freeze'),
  use: () => http.post('/streak-freeze/use'),
  earn: () => http.post('/streak-freeze/earn'),
  getHistory: () => http.get('/streak-freeze/history'),
}

// Quizizz 风格情感反馈
export const quizReactionAPI = {
  record: (data) => http.post('/quiz-reaction/record', data),
  getSummary: () => http.get('/quiz-reaction/summary'),
  getStreak: () => http.get('/quiz-reaction/streak'),
}

// CEFR 语言等级
export const languageLevelAPI = {
  getLevel: () => http.get('/language-level'),
  getComparison: () => http.get('/language-level/comparison'),
}

// 每日目标
export const dailyGoalsAPI = {
  getGoals: () => http.get('/daily-goals'),
  updateGoal: (data) => http.put('/daily-goals', data),
  getHistory: () => http.get('/daily-goals/history'),
}

// Round 26: API 模块
// 学习热力图
export const studyHeatmapAPI = {
  get: () => http.get('/study-heatmap'),
  getWeek: (week) => http.get('/study-heatmap/week', { params: { week } }),
}

// 语法助手
export const grammarCheckAPI = {
  check: (data) => http.post('/grammar-check', data),
  history: () => http.get('/grammar-check/history'),
}

// 专注会话时间线
export const focusSessionAPI = {
  timeline: (params) => http.get('/focus-session/timeline', { params }),
  stats: () => http.get('/focus-session/stats'),
  trees: () => http.get('/focus-session/trees'),
}

// Round 27: API 模块
// ELSA 音素教练
export const phonemeScoreAPI = {
  score: (data) => http.post('/phoneme-score/score', data),
  history: (params) => http.get('/phoneme-score/history', { params }),
  trend: (params) => http.get('/phoneme-score/trend', { params }),
  problems: () => http.get('/phoneme-score/problems'),
}

// 速度阅读
export const speedReadingAPI = {
  start: (data) => http.post('/speed-reading/start', data),
  complete: (data) => http.post('/speed-reading/complete', data),
  stats: () => http.get('/speed-reading/stats'),
  history: (params) => http.get('/speed-reading/history', { params }),
  trend: (params) => http.get('/speed-reading/trend', { params }),
  levels: () => http.get('/speed-reading/levels'),
}

// 题目收藏
export const bookmarkAPI = {
  add: (data) => http.post('/bookmarks', data),
  list: (params) => http.get('/bookmarks', { params }),
  remove: (id) => http.delete(`/bookmarks/${id}`),
  update: (id, data) => http.put(`/bookmarks/${id}`, data),
  stats: () => http.get('/bookmarks/stats'),
  batchRemove: (ids) => http.post('/bookmarks/batch-remove', { ids }),
}

// Round 28: API 模块
// Duolingo 联赛系统
export const leagueAPI = {
  getTiers: () => http.get('/league'),
  getLeaderboard: (params) => http.get('/league/leaderboard', { params }),
  getUserInfo: (userId) => http.get(`/league/user/${userId}`),
  addXP: (data) => http.post('/league/add-xp', data),
  getAchievements: () => http.get('/league/achievements'),
  getRanks: (userId) => http.get(`/league/ranks/${userId}`),
}

// 间隔重复复习 (SRS)
export const srsReviewAPI = {
  getConfig: () => http.get('/srs-review'),
  getDueCards: () => http.get('/srs-review/due'),
  review: (data) => http.post('/srs-review/review', data),
  getStats: () => http.get('/srs-review/stats'),
  getCard: (id) => http.get(`/srs-review/card/${id}`),
  getProgress: () => http.get('/srs-review/progress'),
  getSchedule: () => http.get('/srs-review/schedule'),
}

// 托福分数预测 (Magoosh)
export const scorePredictorAPI = {
  getOverview: () => http.get('/score-predictor'),
  getSections: () => http.get('/score-predictor/sections'),
  getTrend: () => http.get('/score-predictor/trend'),
  getRecommendations: () => http.get('/score-predictor/recommendations'),
  getMockPrediction: () => http.get('/score-predictor/mock-exam-prediction'),
  setGoal: (data) => http.post('/score-predictor/set-goal', data),
}

// Round 29: API 模块
// 全真模考系统 (Magoosh)
export const mockExamAPI = {
  getAll: () => http.get('/mock-exam'),
  getDetail: (examId) => http.get(`/mock-exam/${examId}`),
  start: (data) => http.post('/mock-exam/start', data),
  getSession: (sessionId) => http.get(`/mock-exam/session/${sessionId}`),
  sectionComplete: (data) => http.post('/mock-exam/section/complete', data),
  submit: (data) => http.post('/mock-exam/submit', data),
  getHistory: () => http.get('/mock-exam/history'),
  getStats: () => http.get('/mock-exam/stats'),
  getTemplates: () => http.get('/mock-exam/templates'),
}

// 学习路径规划 (Khan Academy)
export const learningPathAPI = {
  getOverview: () => http.get('/learning-path'),
  getTree: (section) => http.get(`/learning-path/tree/${section}`),
  getTrees: () => http.get('/learning-path/trees'),
  getTemplates: () => http.get('/learning-path/templates'),
  create: (data) => http.post('/learning-path/create', data),
  getRecommend: () => http.get('/learning-path/recommend'),
  updateProgress: (data) => http.post('/learning-path/update-progress', data),
  getStats: () => http.get('/learning-path/stats'),
}

// 每日碎片学习 (Duolingo)
export const dailyMicroAPI = {
  getDailyQuote: () => http.get('/daily-micro/daily-quote'),
  getDailyWord: () => http.get('/daily-micro/daily-word'),
  getDailyChallenge: () => http.get('/daily-micro/daily-challenge'),
  completeChallenge: (data) => http.post('/daily-micro/complete-challenge', data),
  getCheckin: () => http.get('/daily-micro/checkin'),
  getWeekReport: () => http.get('/daily-micro/week-report'),
  getAchievements: () => http.get('/daily-micro/achievements'),
  getStats: () => http.get('/daily-micro/stats'),
  getContent: (date) => http.get(`/daily-micro/content/${date}`),
}

// Round 30: API 模块
// 听力精听模式
export const intensiveListeningAPI = {
  getAll: () => http.get('/intensive-listening'),
  getDetail: (id) => http.get(`/intensive-listening/${id}`),
  start: (data) => http.post('/intensive-listening/start', data),
  sectionComplete: (data) => http.post('/intensive-listening/section/complete', data),
  submitDictation: (data) => http.post('/intensive-listening/dictation', data),
  getRecords: () => http.get('/intensive-listening/records'),
  getStats: () => http.get('/intensive-listening/stats'),
}

// 词汇关系图谱
export const vocabGraphAPI = {
  getOverview: () => http.get('/vocab-graph'),
  getNodes: () => http.get('/vocab-graph/nodes'),
  getTopics: () => http.get('/vocab-graph/topics'),
  getTopic: (topicId) => http.get(`/vocab-graph/topic/${topicId}`),
  getEdge: (wordId) => http.get(`/vocab-graph/${wordId}`),
  getEdges: () => http.get('/vocab-graph/edges'),
  updateMastery: (wordId, mastered) => http.post('/vocab-graph/master', { wordId, mastered }),
  getStats: () => http.get('/vocab-graph/stats'),
  getTrending: () => http.get('/vocab-graph/trending'),
}

// 成就徽章升级
export const achievementsAPI = {
  getOverview: () => http.get('/achievements'),
  getCategories: () => http.get('/achievements/categories'),
  getDetail: (id) => http.get(`/achievements/${id}`),
  getSeasons: () => http.get('/achievements/seasons'),
  getSeason: (seasonId) => http.get(`/achievements/seasons/${seasonId}`),
  check: (data) => http.post('/achievements/check', data),
  getProgress: () => http.get('/achievements/progress'),
  getWall: () => http.get('/achievements/wall'),
}

// Round 35: AI 题目解析
export const questionExplanationAPI = {
  generate: (data) => http.post('/question-explanation/ai', data),
  getHistory: (params) => http.get('/question-explanation/history', { params }),
}

// Round 35: 写作评分增强
export const writingEnhancedAPI = {
  score: (data) => http.post('/writing-enhanced/ai-score', data),
  getHistory: (params) => http.get('/writing-enhanced/history', { params }),
}

// Round 35: 口语跟读练习
export const shadowPracticeAPI = {
  getPhrases: (params) => http.get('/shadow-practice/phrases', { params }),
  record: (data) => http.post('/shadow-practice/record', data),
  getStats: () => http.get('/shadow-practice/stats'),
  analyze: (data) => http.post('/shadow-practice/analyze', data),
}

export default http
