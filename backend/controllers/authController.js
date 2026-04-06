const authService = require('../services/authService');
const { blacklistToken } = require('../middleware/auth');
const { validateEmail, validatePassword, validateName } = require('../middleware/validation');

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ 
                error: 'Email, password, and name are required',
                code: 'MISSING_FIELDS'
            });
        }

        const user = await authService.registerUser(email, password, name);
        
        res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({ 
                error: error.message,
                code: 'USER_EXISTS'
            });
        }
        
        if (error.message.includes('Password must') || error.message.includes('Email') || error.message.includes('Name')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'VALIDATION_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to register user',
            code: 'SERVER_ERROR'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const result = await authService.loginUser(email, password);
        
        res.status(200).json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        console.error('Login error:', error.message);
        
        if (error.message.includes('Invalid email or password')) {
            return res.status(401).json({ 
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        if (error.message.includes('temporarily locked')) {
            return res.status(423).json({ 
                error: error.message,
                code: 'ACCOUNT_LOCKED'
            });
        }
        
        if (error.message.includes('deactivated')) {
            return res.status(403).json({ 
                error: error.message,
                code: 'ACCOUNT_DEACTIVATED'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to login',
            code: 'SERVER_ERROR'
        });
    }
};

const devLogin = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
            error: 'Not found',
            code: 'NOT_FOUND'
        });
    }

    try {
        const result = await authService.loginDevelopmentUser();
        res.status(200).json({
            message: 'Development login successful',
            ...result
        });
    } catch (error) {
        console.error('Development login error:', error.message);
        res.status(500).json({
            error: 'Failed to create local development session',
            code: 'DEV_LOGIN_FAILED'
        });
    }
};

const appleLogin = async (req, res) => {
    try {
        const { identityToken, firstName, lastName } = req.body || {};

        if (!identityToken) {
            return res.status(400).json({
                error: 'Apple identity token is required',
                code: 'MISSING_IDENTITY_TOKEN'
            });
        }

        const result = await authService.loginWithApple(identityToken, {
            firstName,
            lastName
        });

        res.status(200).json({
            message: 'Apple login successful',
            ...result
        });
    } catch (error) {
        console.error('Apple login error:', error.message);

        if (error.message.includes('not configured')) {
            return res.status(503).json({
                error: 'Apple Sign In is not configured',
                code: 'APPLE_AUTH_NOT_CONFIGURED'
            });
        }

        if (error.message.includes('identity token')) {
            return res.status(400).json({
                error: error.message,
                code: 'INVALID_APPLE_TOKEN'
            });
        }

        res.status(401).json({
            error: 'Failed to authenticate with Apple',
            code: 'APPLE_AUTH_FAILED'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        // User information is attached to req.user by the auth middleware
        const user = await authService.getUserById(req.user.userId);
        
        res.status(200).json({ user });
    } catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
};

const verifyToken = async (req, res) => {
    try {
        // If we reach here, the token is valid (checked by middleware)
        res.status(200).json({ 
            valid: true, 
            user: req.user 
        });
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(500).json({ error: 'Failed to verify token' });
    }
};


const logout = async (req, res) => {
    try {
        // Blacklist the current token
        if (req.token) {
            blacklistToken(req.token);
        }
        
        res.status(200).json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error.message);
        res.status(500).json({ 
            error: 'Failed to logout',
            code: 'SERVER_ERROR'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required',
                code: 'MISSING_PASSWORDS'
            });
        }
        
        await authService.changePassword(req.user.userId, currentPassword, newPassword);
        
        res.status(200).json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error.message);
        
        if (error.message.includes('Current password is incorrect')) {
            return res.status(400).json({
                error: error.message,
                code: 'INCORRECT_PASSWORD'
            });
        }
        
        if (error.message.includes('Password must')) {
            return res.status(400).json({
                error: error.message,
                code: 'VALIDATION_ERROR'
            });
        }
        
        res.status(500).json({
            error: 'Failed to change password',
            code: 'SERVER_ERROR'
        });
    }
};

module.exports = {
    register,
    login,
    devLogin,
    appleLogin,
    getProfile,
    verifyToken,
    logout,
    changePassword
};
