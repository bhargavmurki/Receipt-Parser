const rateLimit = require('express-rate-limit');
const { rateLimitWindowMs, rateLimitMax } = require('../config/config');

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(rateLimitWindowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(rateLimitWindowMs / 1000)
        });
    }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        console.warn(`Auth rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
        res.status(429).json({
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: 900
        });
    }
});

// Stricter rate limiter for file uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 uploads per windowMs
    message: {
        error: 'Too many file uploads, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Upload rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
        res.status(429).json({
            error: 'Too many file uploads, please try again later.',
            retryAfter: 900
        });
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    uploadLimiter
};