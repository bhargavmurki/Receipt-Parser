import axios from 'axios';
import { API_BASE_URL, DEFAULT_CONFIG } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    ...DEFAULT_CONFIG
});

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        // Return the data directly for successful responses
        return response.data;
    },
    (error) => {
        // Enhanced error handling
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            const errorMessage = data?.message || data?.error || 'An error occurred';
            const errorCode = data?.code || 'UNKNOWN_ERROR';
            
            // Create enhanced error object
            const enhancedError = new Error(errorMessage);
            enhancedError.status = status;
            enhancedError.code = errorCode;
            enhancedError.response = error.response;
            
            return Promise.reject(enhancedError);
        } else if (error.request) {
            // Network error
            const networkError = new Error('Network connection failed. Please check your internet connection.');
            networkError.code = 'NETWORK_ERROR';
            networkError.isNetworkError = true;
            return Promise.reject(networkError);
        } else {
            // Request setup error
            return Promise.reject(error);
        }
    }
);

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// API methods
export const api = {
    // Authentication
    auth: {
        login: (email, password) => 
            apiClient.post('/auth/login', { email, password }),
        
        register: (email, password, name) => 
            apiClient.post('/auth/register', { email, password, name }),
        
        logout: () => 
            apiClient.post('/auth/logout'),
        
        verify: () => 
            apiClient.get('/auth/verify'),
        
        getProfile: () => 
            apiClient.get('/auth/profile'),
        
        changePassword: (currentPassword, newPassword) => 
            apiClient.post('/auth/change-password', { currentPassword, newPassword })
    },
    
    // Receipts
    receipts: {
        list: (page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc') => 
            apiClient.get('/receipts', {
                params: { page, limit, sortBy, sortOrder }
            }),
        
        process: (imageData) => 
            apiClient.post('/process-receipt', { image: imageData }),
        
        delete: (id) => 
            apiClient.delete(`/receipts/${id}`)
    },
    
    // Health check
    health: () => 
        axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
};

export default api;