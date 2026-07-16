import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptors later
axiosClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('admin_token');
  const authToken = localStorage.getItem('auth_token');

  // Do not attach token for login requests to prevent 401 due to expired tokens
  if (config.url && config.url.includes('/login')) {
    return config;
  }

  const token = adminToken || authToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
