// src/config/publicAxios.js
import axios from 'axios';
import { baseURL } from './config'

const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Add request interceptor for debugging
publicApi.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

// Optional: Add response interceptor for error handling
publicApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Public API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
    }
);

export default publicApi;