const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// Generate secure random secret if none provided (development only)
const generateSecretKey = () => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be explicitly set in production');
    }
    console.warn('⚠️  Generating temporary JWT secret for development. Set JWT_SECRET in production!');
    return crypto.randomBytes(64).toString('hex');
};

const cfg = {
    port: parseInt(process.env.PORT) || 5002,
    nodeEnv: process.env.NODE_ENV || 'development',
    azureEndpoint: process.env.AZURE_ENDPOINT,
    azureApiKey: process.env.AZURE_API_KEY,
    jwtSecret: process.env.JWT_SECRET || generateSecretKey(),
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    appleAudience: process.env.APPLE_AUDIENCE || process.env.APPLE_BUNDLE_ID,
    trustProxy: process.env.TRUST_PROXY ? parseInt(process.env.TRUST_PROXY, 10) : 1,
    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    // File upload limits
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxBodySize: parseInt(process.env.MAX_BODY_SIZE) || 15 * 1024 * 1024, // 15MB
    // CORS
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : null
};

function mask(str, show = 4) {
    if (!str) return 'NOT SET';
    const s = String(str);
    return s.length <= show ? '*'.repeat(s.length) : `${s.slice(0, show)}***${s.slice(-2)}`;
}

function validateConfig() {
    const problems = [];
    
    // Required for basic functionality
    if (!cfg.azureEndpoint) problems.push('AZURE_ENDPOINT is missing');
    if (!cfg.azureApiKey) problems.push('AZURE_API_KEY is missing');
    
    // Production security requirements
    if (cfg.nodeEnv === 'production') {
        if (!process.env.JWT_SECRET) {
            problems.push('JWT_SECRET must be explicitly set in production');
        }
        if (!cfg.frontendUrl) {
            problems.push('FRONTEND_URL must be set in production for CORS');
        }
    }
    
    // Validate JWT secret strength
    if (cfg.jwtSecret && cfg.jwtSecret.length < 64) {
        if (cfg.nodeEnv === 'production') {
            problems.push('JWT_SECRET should be at least 64 characters long for production security');
        } else {
            console.warn('⚠️  JWT_SECRET should be at least 64 characters for optimal security');
        }
    }

    // Validate Azure endpoint format
    if (cfg.azureEndpoint && !/^https?:\/\//i.test(cfg.azureEndpoint)) {
        problems.push('AZURE_ENDPOINT must include the scheme, e.g. https://your-resource.cognitiveservices.azure.com/');
    }

    // Helpful runtime logging (masked)
    console.log('Config loaded:', {
        NODE_ENV: cfg.nodeEnv,
        PORT: cfg.port,
        AZURE_ENDPOINT: cfg.azureEndpoint || 'NOT SET',
        AZURE_API_KEY: mask(cfg.azureApiKey),
        JWT_SECRET: mask(cfg.jwtSecret),
        FRONTEND_URL: cfg.frontendUrl || 'NOT SET',
        BACKEND_URL: cfg.backendUrl || 'NOT SET',
        APPLE_AUDIENCE: cfg.appleAudience || 'NOT SET',
        TRUST_PROXY: cfg.trustProxy,
        MAX_FILE_SIZE: `${cfg.maxFileSize / 1024 / 1024}MB`,
        RATE_LIMIT: `${cfg.rateLimitMax} requests per ${cfg.rateLimitWindowMs / 1000 / 60} minutes`
    });

    if (problems.length) {
        console.error('Configuration issues detected:', problems);
        if (cfg.nodeEnv === 'production') {
            console.error('Production startup blocked due to configuration issues');
        } else {
            console.warn('Please create a .env file with required variables for production use');
        }
    }
    return problems;
}

module.exports = { ...cfg, validateConfig };
