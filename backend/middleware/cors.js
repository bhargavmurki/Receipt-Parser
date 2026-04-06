const { frontendUrl, nodeEnv, allowedOrigins } = require('../config/config');

const getDefaultAllowedOrigins = () => {
    const origins = [];
    
    if (nodeEnv === 'development') {
        // Development origins
        origins.push(
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        );
    }
    
    // Add production frontend URL if specified
    if (frontendUrl) {
        origins.push(frontendUrl);
    }
    
    return origins;
};

const corsConfig = {
    origin: function (origin, callback) {
        const allowedOriginsList = allowedOrigins || getDefaultAllowedOrigins();
        
        // Allow requests with no origin in development (e.g., mobile apps, Postman)
        if (!origin && nodeEnv === 'development') {
            return callback(null, true);
        }
        
        // Block requests with no origin in production
        if (!origin && nodeEnv === 'production') {
            return callback(new Error('Origin header required in production'));
        }
        
        if (allowedOriginsList.includes(origin)) {
            return callback(null, true);
        } else {
            console.warn(`CORS: Blocked request from origin: ${origin}`);
            return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 hours
};

module.exports = corsConfig;