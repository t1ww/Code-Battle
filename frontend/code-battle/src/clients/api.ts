import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // base server URL
  timeout: 10000,                   // 10s request timeout
  withCredentials: true             // send cookies if you're using sessions
});

// Optional: Add request/response interceptors here
// Example: Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or from Pinia store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
