import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hosthavenbackend.vercel.app/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach auth token from localStorage on every request
api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem('hosthaven_session') || 'null');
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hosthaven_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
