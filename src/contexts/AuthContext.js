import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);


    // Verify token on app load and handle OAuth callback
    useEffect(() => {
        const verifyToken = async () => {
            // Check for OAuth callback token in URL first
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            
            // Check for existing token in localStorage  
            const storedToken = localStorage.getItem('token');
            
            console.log('AuthContext: Checking for tokens...', {
                currentUrl: window.location.href,
                hasUrlToken: !!urlToken,
                hasStoredToken: !!storedToken,
                urlTokenLength: urlToken?.length,
                storedTokenLength: storedToken?.length
            });
            
            // Prioritize URL token (fresh OAuth), then stored token
            const tokenToUse = urlToken || storedToken;
            
            if (urlToken) {
                console.log('AuthContext: Fresh OAuth token found in URL, processing...');
                // OAuth callback received - store it
                setToken(urlToken);
                localStorage.setItem('token', urlToken);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (storedToken && !token) {
                console.log('AuthContext: Using stored token...');
                setToken(storedToken);
            }
            
            if (tokenToUse) {
                // Verify the token and get user info
                try {
                    console.log('AuthContext: Verifying token with backend...');
                    // Temporarily set token for the API call
                    localStorage.setItem('token', tokenToUse);
                    const response = await api.auth.verify();
                    console.log('AuthContext: Token verified, user:', response.user);
                    setUser(response.user);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    logout();
                }
                setLoading(false);
                return;
            }
            
            if (token) {
                try {
                    const response = await api.auth.verify();
                    setUser(response.user);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    if (error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_SIGNATURE') {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await api.auth.login(email, password);
            const { user, token } = response;
            
            setUser(user);
            setToken(token);
            localStorage.setItem('token', token);
            
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.message || 'Login failed',
                code: error.code
            };
        }
    };

    const register = async (email, password, name) => {
        try {
            const response = await api.auth.register(email, password, name);
            return { success: true, user: response.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                error: error.message || 'Registration failed',
                code: error.code
            };
        }
    };

    const logout = async () => {
        try {
            // Call logout endpoint to blacklist token
            if (token) {
                await api.auth.logout();
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear local state regardless of API call result
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
        }
    };


    // const requestPasswordReset = async (email) => {
    //     try {
    //         const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
    //             email
    //         });

    //         return { success: true, message: response.data.message };
    //     } catch (error) {
    //         console.error('Password reset request error:', error);
    //         return { 
    //             success: false, 
    //             error: error.response?.data?.error || 'Failed to send password reset email' 
    //         };
    //     }
    // };


    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};