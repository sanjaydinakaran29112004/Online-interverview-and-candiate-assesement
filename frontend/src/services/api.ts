import axios from 'axios';

// Cloud & Local Dynamic Base URL Resolution
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
   window.location.hostname !== 'localhost' &&
   window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh or redirect
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data)
};

export const jobsAPI = {
  list: (params?: any) => api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`)
};

export const applicationsAPI = {
  apply: (data: any) => api.post('/applications', data),
  list: (params?: any) => api.get('/applications', { params }),
  get: (id: string) => api.get(`/applications/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/applications/${id}/status`, { status })
};

export const resumeAPI = {
  uploadAndAnalyze: (formData: FormData) =>
    api.post('/ai/resume/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getAnalysis: (resumeId: string) => api.get(`/ai/resume/${resumeId}`)
};

export const questionsAPI = {
  generate: (data: any) => api.post('/questions/generate', data),
  listSets: (params?: any) => api.get('/questions/sets', { params }),
  getAll: () => api.get('/questions/all'),
  createCustom: (data: any) => api.post('/questions/custom', data)
};

export const interviewsAPI = {
  schedule: (data: any) => api.post('/interviews', data),
  list: (params?: any) => api.get('/interviews', { params }),
  getInterviewers: () => api.get('/interviews/interviewers'),
  reassignInterviewer: (id: string, interviewerId: string) => api.patch(`/interviews/${id}/reassign`, { interviewerId }),
  getByRoom: (roomCode: string) => api.get(`/interviews/room/${roomCode}`),
  updateStatus: (id: string, status: string) => api.patch(`/interviews/${id}/status`, { status }),
  consent: (id: string, consent: boolean) => api.post(`/interviews/${id}/consent`, { consent })
};

export const assessmentAPI = {
  evaluateAnswer: (data: any) => api.post('/assessments/evaluate-answer', data),
  overrideScore: (answerId: string, data: any) => api.post(`/assessments/override/${answerId}`, data),
  finalize: (data: any) => api.post('/assessments/finalize', data),
  get: (id: string) => api.get(`/assessments/${id}`)
};

export const rankingAPI = {
  getRankings: (jobId: string) => api.get(`/rankings/job/${jobId}`),
  compareCandidates: (candidateIds: string[]) =>
    api.get('/rankings/compare', { params: { candidateIds: candidateIds.join(',') } })
};

export const analyticsAPI = {
  recruiter: () => api.get('/analytics/recruiter'),
  performance: () => api.get('/analytics/performance')
};

export const reportAPI = {
  get: (id: string) => api.get(`/reports/${id}`),
  downloadPDFUrl: (id: string) => `${API_BASE_URL}/reports/${id}/download`
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export const adminAPI = {
  listUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser360: (id: string) => api.get(`/admin/users/${id}/360`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params })
};
