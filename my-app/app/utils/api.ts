// utils/api.ts

import axios from 'axios';
import { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://121.40.80.144:3001'; // Use remote server address as default
const LOGIN_URL = '/login'; // 你的登录页面 URL

let api: AxiosInstance;

const createApiInstance = () => {
  const instance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: any) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token 过期或无效，执行重新登录逻辑
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isAdmin');
        // 使用 window.location.href 进行重定向
        window.location.href = LOGIN_URL;
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

api = createApiInstance();

export default api;