import axios from 'axios'

const http = axios.create({
  baseURL: 'https://toefl-api-m1ue.onrender.com/api',
  timeout: 15000,
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
    return Promise.reject(err)
  },
)

// Auth
export const authAPI = {
  sendCode: (phone) => http.post('/auth/send-code', { phone }),
  login: (phone, code) => http.post('/auth/login', { phone, code }),
  getProfile: () => http.get('/auth/profile'),
  updateProfile: (data) => http.put('/auth/profile', data),
}

// Questions
export const questionAPI = {
  list: (params) => http.get('/questions', { params }),
  getById: (id) => http.get(`/questions/${id}`),
  getBySubject: (subject, params) => http.get('/questions', { params: { subject, ...params } }),
  generate: (data) => http.post('/questions/generate', data),
  upload: (formData, onProgress) =>
    http.post('/questions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    }),
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
  redo: () => http.get('/wrong/redo'),
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

export default http