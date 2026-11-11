import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  // Render's free tier can take 30–50s to wake. Without a timeout axios waits
  // forever on a dead connection; with too short a one, the first request after
  // idle fails. 60s covers a cold start.
  timeout: 60000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('carstand_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On these endpoints a 401 means "wrong password", not "your session ended".
// The page shows that error itself; signing the person out and reloading
// would wipe the message (and, on change-password, kick them out mid-form).
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/change-password'];

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isCredentialCheck = CREDENTIAL_ENDPOINTS.some((p) => url.startsWith(p));

    if (error.response?.status === 401 && !isCredentialCheck) {
      const wasAdmin = window.location.pathname.startsWith('/admin');
      localStorage.removeItem('carstand_token');
      localStorage.removeItem('carstand_user');
      window.location.href = wasAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
