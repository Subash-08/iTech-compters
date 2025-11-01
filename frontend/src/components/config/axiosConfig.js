// src/config/axiosConfig.js
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://itech-compters.onrender.com/api/v1',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - just add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ SIMPLE: Response interceptor - only handle generic errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only log and handle generic server/network errors
        console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });

        // Show toast only for generic errors, not auth errors
        if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
            toast.error('Network error. Please check your connection.');
        }

        // Return error for components to handle
        return Promise.reject(error);
    }
);

export default api;