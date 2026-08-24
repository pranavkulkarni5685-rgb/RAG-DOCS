import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');

// Auto-append /api if user gave host without /api
if (rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl += '/api';
}

const api = axios.create({
  baseURL: rawBaseUrl,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
