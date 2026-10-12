import axios from 'axios';
import { syncServerTime } from './clock.js';

export const TOKEN_KEY = 'parkease_token';
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({ baseURL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (res.headers?.['x-server-time']) syncServerTime(res.headers['x-server-time']);
    return res;
  },
  (err) => {
    if (err.response?.headers?.['x-server-time']) syncServerTime(err.response.headers['x-server-time']);
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const unwrap = (promise) => promise.then((r) => r.data.data);

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err?.message === 'Network Error') return 'Cannot reach the ParkEase server. Check your connection and try again.';
  return fallback;
}
export const getFieldErrors = (err) => err?.response?.data?.errors || {};
export const getErrorCode = (err) => err?.response?.data?.code;

export default api;
