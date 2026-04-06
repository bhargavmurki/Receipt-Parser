// API Configuration
const API_PORT = process.env.REACT_APP_API_PORT || 5002;
const API_HOST = process.env.REACT_APP_API_HOST || 'localhost';

// Determine protocol based on host
const getProtocol = () => {
    if (API_HOST.includes('ngrok') || API_HOST.includes('herokuapp') || API_HOST.includes('vercel')) {
        return 'https';
    }
    return process.env.NODE_ENV === 'production' ? 'https' : 'http';
};

const protocol = getProtocol();
const portSuffix = (protocol === 'https' && API_PORT === '443') || (protocol === 'http' && API_PORT === '80') 
    ? '' 
    : `:${API_PORT}`;

export const API_BASE_URL = `${protocol}://${API_HOST}${portSuffix}/api`;

// API Endpoints
export const API_ENDPOINTS = {
    // Authentication
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        register: `${API_BASE_URL}/auth/register`,
        logout: `${API_BASE_URL}/auth/logout`,
        verify: `${API_BASE_URL}/auth/verify`,
        profile: `${API_BASE_URL}/auth/profile`,
        changePassword: `${API_BASE_URL}/auth/change-password`
    },
    
    // Receipts
    receipts: {
        list: `${API_BASE_URL}/receipts`,
        process: `${API_BASE_URL}/process-receipt`,
        delete: (id) => `${API_BASE_URL}/receipts/${id}`
    },
    
    // Health check
    health: `${protocol}://${API_HOST}${portSuffix}/health`
};

// Default request configuration
export const DEFAULT_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
};

export default {
    API_BASE_URL,
    API_ENDPOINTS,
    DEFAULT_CONFIG
};