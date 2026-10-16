
import axios from 'axios';
import { environment } from '../config/environment';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || environment.staticIP1,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApi = (url: string, params?: object) =>
  api.get(url, { params });

export const postApi = (url: string, data?: unknown) =>
  api.post(url, data);

export const putApi = (url: string, data?: unknown) =>
  api.put(url, data);

export const deleteApi = (url: string) =>
  api.delete(url);
