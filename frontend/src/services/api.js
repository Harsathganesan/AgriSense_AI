import axios from 'axios';

// Configure Axios baseURL from Vite environment variables or localStorage
const savedApiUrl = typeof window !== 'undefined' ? localStorage.getItem('agrisense_api_base_url') : null;
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
const defaultProductionBackend = 'https://agri-sense-ai-theta-two.vercel.app';

const apiBase = savedApiUrl || envApiUrl || (isVercelHost ? defaultProductionBackend : '');
if (apiBase) {
  axios.defaults.baseURL = apiBase.replace(/\/+$/, '');
}

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

export const locationApi = {
  save: (data) => axios.post('/api/location/save', data),
  recordGps: (data) => axios.post('/api/location/gps', data),
  getCurrent: () => axios.get('/api/location/current'),
  getStatus: () => axios.get('/api/location/status'),
  getDistrictBoundary: (district, state = 'Tamil Nadu', country = 'India') =>
    axios.get(`/api/location/district-boundary?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`),
  reverseGeocode: (lat, lon) => axios.get(`/api/location/reverse-geocode?latitude=${lat}&longitude=${lon}`),
};

export const nasaApi = {
  getSummary: (lat, lon, start, end) => {
    let url = `/api/nasa/summary?latitude=${lat}&longitude=${lon}`;
    if (start) url += `&start_date=${start}`;
    if (end) url += `&end_date=${end}`;
    return axios.get(url);
  },
  getLayers: (lat, lon) => axios.get(`/api/nasa/layers?latitude=${lat}&longitude=${lon}`),
  getEarthdataStatus: () => axios.get('/api/nasa/earthdata/status'),
  getWeather: (lat, lon, start, end) => {
    let url = `/api/nasa/weather?latitude=${lat}&longitude=${lon}`;
    if (start) url += `&start_date=${start}`;
    if (end) url += `&end_date=${end}`;
    return axios.get(url);
  },
  getRainfall: (lat, lon) => axios.get(`/api/nasa/rainfall?latitude=${lat}&longitude=${lon}`),
};

export const analysisApi = {
  getLocationBased: (lat, lon) => {
    let url = '/api/analysis/location-based';
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      url += `?latitude=${lat}&longitude=${lon}`;
    }
    return axios.get(url);
  },
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
  chat: (message, district, language) => axios.post('/api/assistant/chat', { message, district, language }),
  getPrompts: (language, district) => axios.get(`/api/assistant/prompts?language=${language}${district ? `&district=${encodeURIComponent(district)}` : ''}`),
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

export const districtApi = {
  getProfile: (district, state = 'Tamil Nadu', country = 'India') =>
    axios.get(`/api/district/profile?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`),
  getEnvironment: (district, state = 'Tamil Nadu', country = 'India') =>
    axios.get(`/api/district/environment?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`),
  getSoilHealth: (district, state = 'Tamil Nadu', country = 'India') =>
    axios.get(`/api/district/soil-health?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`),
  saveSoilRecord: (data) => axios.post('/api/district/soil-health/record', data),
  getCrops: (district, category = 'All', search = '', state = 'Tamil Nadu', country = 'India') => {
    let url = `/api/district/crops?district=${encodeURIComponent(district)}&category=${encodeURIComponent(category)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return axios.get(url);
  },
  getRotation: (district, state = 'Tamil Nadu', country = 'India') =>
    axios.get(`/api/district/rotation?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`),
  whatIf: (data) => axios.post('/api/district/rotation/what-if', data),
};

