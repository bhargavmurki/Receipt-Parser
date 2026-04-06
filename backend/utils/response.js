/**
 * Standardized API response utilities
 */

const { nodeEnv } = require('../config/config');

// Standard response structure
const createResponse = (success, data = null, message = null, errors = null, meta = null) => {
    const response = {
        success,
        timestamp: new Date().toISOString(),
        ...(message && { message }),
        ...(data && { data }),
        ...(errors && { errors }),
        ...(meta && { meta })
    };
    
    return response;
};

// Success responses
const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    return res.status(statusCode).json(createResponse(true, data, message, null, meta));
};

const created = (res, data = null, message = 'Resource created successfully') => {
    return success(res, data, message, 201);
};

const noContent = (res, message = 'Operation completed successfully') => {
    return res.status(204).json(createResponse(true, null, message));
};

// Error responses
const error = (res, message = 'An error occurred', statusCode = 500, errors = null, code = null) => {
    const errorResponse = createResponse(false, null, message, errors);
    
    if (code) {
        errorResponse.code = code;
    }
    
    // Include stack trace in development
    if (nodeEnv === 'development' && errors instanceof Error) {
        errorResponse.stack = errors.stack;
    }
    
    return res.status(statusCode).json(errorResponse);
};

const badRequest = (res, message = 'Bad request', errors = null, code = null) => {
    return error(res, message, 400, errors, code);
};

const unauthorized = (res, message = 'Unauthorized', code = 'UNAUTHORIZED') => {
    return error(res, message, 401, null, code);
};

const forbidden = (res, message = 'Forbidden', code = 'FORBIDDEN') => {
    return error(res, message, 403, null, code);
};

const notFound = (res, message = 'Resource not found', code = 'NOT_FOUND') => {
    return error(res, message, 404, null, code);
};

const conflict = (res, message = 'Conflict', code = 'CONFLICT') => {
    return error(res, message, 409, null, code);
};

const unprocessableEntity = (res, message = 'Unprocessable entity', errors = null, code = 'VALIDATION_ERROR') => {
    return error(res, message, 422, errors, code);
};

const tooManyRequests = (res, message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') => {
    return error(res, message, 429, null, code);
};

const serverError = (res, message = 'Internal server error', errors = null, code = 'SERVER_ERROR') => {
    return error(res, message, 500, errors, code);
};

const serviceUnavailable = (res, message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') => {
    return error(res, message, 503, null, code);
};

// Validation error helper
const validationError = (res, errors, message = 'Validation failed') => {
    const formattedErrors = Array.isArray(errors) 
        ? errors 
        : [{ field: 'general', message: errors.toString() }];
    
    return unprocessableEntity(res, message, formattedErrors, 'VALIDATION_ERROR');
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    success,
    created,
    noContent,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    unprocessableEntity,
    tooManyRequests,
    serverError,
    serviceUnavailable,
    validationError,
    asyncHandler
};