import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);


// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const getCaptcha = () => api.get('/auth/captcha');

export const loginUser = (email, password, captchaAnswer, captchaToken, rememberMe) =>
  api.post("/auth/login", { email, password, captchaAnswer, captchaToken, rememberMe }, { withCredentials: true });


export const registerUser = (userData, captchaAnswer, captchaToken) =>
  api.post('/auth/register', { ...userData, captchaAnswer, captchaToken });

export default api;
