import axios from 'axios';

export const authApi = {
  login: (email, password) => axios.post('/api/auth/login', { email, password }),
  register: (data) => axios.post('/api/auth/register', data),
  getMe: () => axios.get('/api/auth/me'),
  updateProfile: (data) => axios.put('/api/auth/profile', data),
};

export const farmsApi = {
  list: () => axios.get('/api/farms'),
  create: (data) => axios.post('/api/farms', data),
  get: (id) => axios.get(`/api/farms/${id}`),
  update: (id, data) => axios.put(`/api/farms/${id}`, data),
  delete: (id) => axios.delete(`/api/farms/${id}`),
};

export const nasaApi = {
  getSummary: (lat, lon, start, end) => {
    let url = `/api/nasa/summary?latitude=${lat}&longitude=${lon}`;
    if (start) url += `&start_date=${start}`;
    if (end) url += `&end_date=${end}`;
    return axios.get(url);
  },
  getLayers: (lat, lon) => axios.get(`/api/nasa/layers?latitude=${lat}&longitude=${lon}`),
};

export const soilApi = {
  getRecords: (farmId) => axios.get(`/api/soil/records?farm_id=${farmId}`),
  getLatest: (farmId) => axios.get(`/api/soil/latest?farm_id=${farmId}`),
  createRecord: (data) => axios.post('/api/soil/records', data),
  analyze: (params) => axios.post('/api/soil/analyze', params),
};

export const cropsApi = {
  list: (params) => axios.get('/api/crops', { params }),
  getFeaturedTN: () => axios.get('/api/crops/tamil-nadu/featured'),
  getById: (id) => axios.get(`/api/crops/${id}`),
};

export const rotationApi = {
  generate: (farmId, weights) => axios.post('/api/rotation/generate', { farm_id: farmId, custom_weights: weights }),
  whatIf: (farmId, params) => axios.post('/api/rotation/what-if', { farm_id: farmId, ...params }),
  getLatest: (farmId) => axios.get(`/api/rotation/latest?farm_id=${farmId}`),
};

export const assistantApi = {
  chat: (message, farmId, language) => axios.post('/api/assistant/chat', { message, farm_id: farmId, language }),
  getPrompts: (language) => axios.get(`/api/assistant/prompts?language=${language}`),
};

export const reportsApi = {
  generate: (farmId) => axios.post('/api/reports/generate', { farm_id: farmId }),
  list: () => axios.get('/api/reports/list'),
  downloadUrl: (reportId) => `/api/reports/download/${reportId}`,
};

export const historyApi = {
  list: (farmId) => axios.get(`/api/history${farmId ? `?farm_id=${farmId}` : ''}`),
  delete: (id) => axios.delete(`/api/history/${id}`),
};
