import axios from 'axios';

const SSO_URL = import.meta.env.VITE_SSO_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: SSO_URL,
  withCredentials: true,
});

// Interceptor: Add access token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await api.post('/oauth/token', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: import.meta.env.VITE_CLIENT_ID,
          });

          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);

          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
