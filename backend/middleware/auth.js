const authService = require('../services/authService');
const { verifyAppToken } = require('../utils/tokens');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Add token to blacklist
const blacklistToken = (token) => {
    tokenBlacklist.add(token);
    // In production, also store in persistent storage with expiration
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'MISSING_TOKEN'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token || token.length === 0) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'EMPTY_TOKEN'
            });
        }

        // Check if token is blacklisted
        if (isTokenBlacklisted(token)) {
            return res.status(401).json({
                error: 'Token has been revoked',
                code: 'TOKEN_REVOKED'
            });
        }

        // Verify and decode token
        const decoded = verifyAppToken(token);
        
        // Validate token payload
        if (!decoded.userId || !decoded.email) {
            return res.status(401).json({
                error: 'Invalid token payload',
                code: 'INVALID_PAYLOAD'
            });
        }
        
        // Verify user still exists and is active
        const user = await authService.getUserById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'User account not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user account is still active
        if (user.isDeactivated) {
            return res.status(401).json({
                error: 'User account has been deactivated',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Sanitize user data before attaching to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            tokenIssuedAt: decoded.iat
        };
        
        // Store token for potential blacklisting
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token format',
                code: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED' 
            });
        }
        
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                error: 'Token not yet valid',
                code: 'TOKEN_NOT_ACTIVE'
            });
        }
        
        // This could happen if JWT_SECRET changed
        if (error.message.includes('invalid signature')) {
            return res.status(401).json({ 
                error: 'Token signature invalid - please log in again',
                code: 'INVALID_SIGNATURE'
            });
        }
        
        res.status(500).json({ 
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyAppToken(token);
            const user = await authService.getUserById(decoded.userId);
            
            if (user) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    name: decoded.name
                };
            }
        }
        
        next();
    } catch (error) {
        // For optional auth, we continue even if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    blacklistToken,
    isTokenBlacklisted
};
