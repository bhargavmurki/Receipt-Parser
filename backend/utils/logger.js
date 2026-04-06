/**
 * Centralized logging utility
 */

const { nodeEnv } = require('../config/config');

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const getCurrentLogLevel = () => {
    return nodeEnv === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
};

// Color codes for console output
const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[32m', // Green
    RESET: '\x1b[0m'   // Reset
};

const formatLogMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const formattedMeta = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return {
        timestamp,
        level,
        message,
        meta: formattedMeta,
        pid: process.pid,
        environment: nodeEnv
    };
};

const writeLog = (level, message, meta = {}) => {
    const currentLevel = getCurrentLogLevel();
    const logLevel = LOG_LEVELS[level];
    
    if (logLevel <= currentLevel) {
        const logData = formatLogMessage(level, message, meta);
        
        if (nodeEnv === 'development') {
            // Console output with colors in development
            const color = COLORS[level] || COLORS.RESET;
            console.log(
                `${color}[${logData.timestamp}] ${level}: ${message}${COLORS.RESET}`,
                Object.keys(meta).length > 0 ? meta : ''
            );
        } else {
            // JSON output in production
            console.log(JSON.stringify(logData));
        }
    }
};

// Logging functions
const error = (message, meta = {}) => {
    writeLog('ERROR', message, meta);
};

const warn = (message, meta = {}) => {
    writeLog('WARN', message, meta);
};

const info = (message, meta = {}) => {
    writeLog('INFO', message, meta);
};

const debug = (message, meta = {}) => {
    writeLog('DEBUG', message, meta);
};

// HTTP request logger middleware
const httpLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    info('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.userId || 'anonymous'
    });
    
    // Log response when request completes
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        info('HTTP Response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.userId || 'anonymous'
        });
        
        return originalSend.call(this, data);
    };
    
    next();
};

// Security event logger
const security = (event, details = {}) => {
    warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

// Performance logger
const performance = (operation, duration, meta = {}) => {
    info('Performance', {
        operation,
        duration: `${duration}ms`,
        ...meta
    });
};

// Database operation logger
const database = (operation, details = {}) => {
    debug('Database Operation', {
        operation,
        ...details
    });
};

module.exports = {
    error,
    warn,
    info,
    debug,
    httpLogger,
    security,
    performance,
    database
};