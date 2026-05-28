import axios from 'axios';

const http = axios.create({
  baseURL: 'https://toefl-api-m1ue.onrender.com/api/admin',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 - 添加 Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || '请求失败';
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.reload();
    }
    return Promise.reject(new Error(msg));
  }
);

// Dashboard
export const getOverview = () => http.get('/dashboard/overview');
export const getUsersAnalysis = () => http.get('/dashboard/users');
export const getUsageData = () => http.get('/dashboard/usage');
export const getRetentionData = () => http.get('/dashboard/retention');
export const getSubjectStats = () => http.get('/dashboard/subjects');

// Feedback
export const getFeedbackList = (params) => http.get('/feedback', { params });
export const replyFeedback = (id, data) => http.put(`/feedback/${id}/reply`, data);

// Questions
export const getQuestions = (params) => http.get('/questions', { params });
export const approveQuestion = (id) => http.put(`/questions/${id}/approve`);
export const rejectQuestion = (id) => http.put(`/questions/${id}/reject`);

export default http;