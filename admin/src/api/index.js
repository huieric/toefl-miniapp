import axios from 'axios';

const http = axios.create({
  baseURL: 'https://toefl-api-m1ue.onrender.com/api',
  timeout: 45000,
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
export const getOverview = () => http.get('/admin/dashboard/overview');
export const getUsersAnalysis = () => http.get('/admin/dashboard/users');
export const getUsageData = () => http.get('/admin/dashboard/usage');
export const getRetentionData = () => http.get('/admin/dashboard/retention');
export const getSubjectStats = () => http.get('/admin/dashboard/subjects');

// Feedback
export const getFeedbackList = (params) => http.get('/admin/feedback', { params });
export const replyFeedback = (id, data) => http.put(`/admin/feedback/${id}/reply`, data);

// Questions
export const getQuestions = (params) => http.get('/admin/questions', { params });
export const approveQuestion = (id) => http.put(`/admin/questions/${id}/approve`);
export const rejectQuestion = (id) => http.put(`/admin/questions/${id}/reject`);
export const uploadQuestionsPdf = (formData, onProgress) =>
  http.post('/questions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
export const getUploadStatus = (uploadId) => http.get(`/questions/upload/${uploadId}/status`);

export default http;
