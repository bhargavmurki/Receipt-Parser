const { nodeEnv } = require('../config/config');
const { error: logError } = require('../utils/logger');
const { serverError, badRequest, unauthorized, forbidden, notFound, tooManyRequests } = require('../utils/response');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, code = null, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let { statusCode = 500, message, code } = err;
    
    // Log error details
    logError('Request Error', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || 'anonymous',
        statusCode,
        code
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return badRequest(res, 'Validation failed', err.errors, 'VALIDATION_ERROR');
    }
    
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return unauthorized(res, 'Authentication failed', 'AUTH_ERROR');
    }
    
    if (err.name === 'ForbiddenError') {
        return forbidden(res, 'Access denied', 'ACCESS_DENIED');
    }
    
    if (err.name === 'NotFoundError') {
        return notFound(res, 'Resource not found', 'NOT_FOUND');
    }
    
    if (err.name === 'RateLimitError') {
        return tooManyRequests(res, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
    }
    
    // Azure specific errors
    if (err.message && err.message.includes('Azure')) {
        if (err.message.includes('quota') || err.message.includes('rate')) {
            return tooManyRequests(res, 'Service quota exceeded', 'AZURE_QUOTA_EXCEEDED');
        }
        return serverError(res, 'External service error', null, 'EXTERNAL_SERVICE_ERROR');
    }
    
    // Database errors
    if (err.message && err.message.includes('Database')) {
        return serverError(res, 'Database operation failed', null, 'DATABASE_ERROR');
    }
    
    // Network errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        return serverError(res, 'Network connection failed', null, 'NETWORK_ERROR');
    }
    
    // Default error response
    if (nodeEnv === 'development') {
        return serverError(res, message, { stack: err.stack }, code);
    } else {
        // Don't leak error details in production
        return serverError(res, 'Something went wrong', null, 'INTERNAL_ERROR');
    }
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    logError('Route Not Found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    return notFound(res, message, 'ROUTE_NOT_FOUND');
};

// Async error wrapper
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler,
    asyncErrorHandler
};