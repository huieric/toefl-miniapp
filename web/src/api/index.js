import axios from 'axios'

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
  (res) => res,
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
  deleteBatch: (batchId) => http.delete(`/questions/batch/${batchId}`),
  renameBatch: (batchId, batchName) => http.patch(`/questions/batch/${batchId}`, { batchName }),
  renameQuestion: (id, title) => http.patch(`/questions/${id}`, { title }),
  regroup: (data) => http.post('/questions/regroup', data),
  uploadBatch: (formData) => http.post('/questions/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  }),
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
  get: () => http.get('/plan'),
  create: (data) => http.post('/plan', data),
  update: (data) => http.put('/plan', data),
  daily: () => http.get('/plan/daily'),
}

// Feedback
export const feedbackAPI = {
  submit: (data) => http.post('/feedback', data),
}

// User Stats
export const userAPI = {
  dashboard: () => http.get('/user/dashboard'),
  progress: () => http.get('/user/progress'),
}

// AI Tutor
export const aiTutorAPI = {
  analysis: () => http.get('/ai-tutor/analysis'),
  ask: (question, conversationHistory) => http.post('/ai-tutor/ask', { question, conversationHistory }),
  dataPreview: () => http.get('/ai-tutor/data-preview'),
}

// Vocabulary（生词本）
export const vocabAPI = {
  list: () => http.get('/vocab'),
  add: (data) => http.post('/vocab', data),
  review: () => http.get('/vocab/review'),
  submitReview: (id, rating) => http.post(`/vocab/${id}/review`, { rating }),
  lookup: (word) => http.get('/vocab/lookup', { params: { word } }),
}

// AI 打分
export const aiAPI = {
  grade: (data) => http.post('/ai/grade', data),
}

export default http
