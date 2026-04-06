import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();


    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password);
                if (!result.success) {
                    setError(result.error);
                }
                // Success is handled by the auth context (user state update)
            } else {
                const result = await register(formData.email, formData.password, formData.name);
                if (result.success) {
                    setSuccess('Account created successfully! You can now log in.');
                    setIsLogin(true);
                    setFormData({ email: formData.email, password: '', name: '' });
                } else {
                    setError(result.error);
                }
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setFormData({ email: '', password: '', name: '' });
    };

    // Default login/register form
    return (
        <div className="auth-container">
            <div className="auth-header">
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p>{isLogin ? 'Sign in to your account' : 'Join Receipt Parser today'}</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required={!isLogin}
                            placeholder="Enter your full name"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                        placeholder="Enter your password"
                    />
                    {!isLogin && (
                        <small style={{ color: '#7f8c8d', marginTop: '0.25rem' }}>
                            Use at least 8 characters, including upper/lowercase, a number, and a special character
                        </small>
                    )}
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                    {loading && <span className="loading-spinner"></span>}
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            <div className="auth-switch">
                <p>{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
                <button type="button" onClick={switchMode}>
                    {isLogin ? 'Create Account' : 'Sign In'}
                </button>
            </div>
        </div>
    );
};

export default Auth;
