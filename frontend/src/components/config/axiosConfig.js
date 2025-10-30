// src/config/axiosConfig.js
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // ✅ FIX: Use 'token' instead of 'authToken' to match your localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('=== AXIOS ERROR DETAILS ===');
        console.error('URL:', error.config?.url);
        console.error('Method:', error.config?.method);
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', error.response?.data);
        console.error('======================');

        // Handle specific error cases
        if (error.response?.status === 401) {
            console.log('🛑 401 Unauthorized - clearing tokens');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Handle other common errors
        if (error.response?.status === 500) {
            toast.error('Server error. Please try again later.');
        }

        if (error.code === 'NETWORK_ERROR') {
            toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
    }
);

export default api;