// src/config/axiosConfig.js
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    timeout: 30000,
    withCredentials: true,
});

// Request interceptor - handle FormData properly
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If data is FormData, let browser set Content-Type automatically
        if (config.data instanceof FormData) {
            // Remove any existing Content-Type to let browser set it with boundary
            delete config.headers['Content-Type'];
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