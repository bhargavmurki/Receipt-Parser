const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const { port, sessionSecret, validateConfig, nodeEnv, maxBodySize, trustProxy } = require('./config/config');
const corsConfig = require('./middleware/cors');
const { generalLimiter } = require('./middleware/rateLimiter');
const receiptRoutes = require('./routes/receiptRoutes');
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const { initializeDatabases, healthCheck } = require('./models/index');
const { httpLogger, info, error: logError } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Respect one trusted proxy hop for tunnels like ngrok and reverse proxies.
app.set('trust proxy', trustProxy);

// Validate configuration on startup
const configIssues = validateConfig();
if (configIssues.length) {
    console.error('Configuration issues detected:', configIssues);
    if (nodeEnv === 'production') {
        console.error('Startup blocked due to configuration issues in production');
        process.exit(1);
    } else {
        console.warn('Development server starting with configuration warnings');
    }
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Request logging
app.use(httpLogger);

// Rate limiting
app.use(generalLimiter);

// CORS middleware
app.use(cors(corsConfig));

// Body parsing middleware with security limits
app.use(express.json({ 
    limit: `${maxBodySize}`,
    verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: `${maxBodySize}`,
    parameterLimit: 1000
}));

// Session middleware for OAuth
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Don't use default session name
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: nodeEnv === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        sameSite: nodeEnv === 'production' ? 'strict' : 'lax' // CSRF protection
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: nodeEnv,
            database: dbHealth,
            version: require('./package.json').version
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api', receiptRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize databases and start server
const startServer = async () => {
    try {
        // Initialize databases
        await initializeDatabases();
        
        // Start server
        const server = app.listen(port, '0.0.0.0', () => {
            info('Server started', {
                port,
                environment: nodeEnv,
                localUrl: `http://localhost:${port}`,
                healthCheck: `http://localhost:${port}/health`
            });
            
            console.log(`✅ Server running on port ${port}`);
            console.log(`🏠 Local access: http://localhost:${port}`);
            console.log(`🔒 Environment: ${nodeEnv}`);
            console.log(`👨‍⚕️ Health check: http://localhost:${port}/health`);
            if (nodeEnv === 'development') {
                console.log(`📱 Network access: http://[your-ip]:${port}`);
                console.log(`🔍 API endpoints: http://localhost:${port}/api`);
            }
        });
        
        return server;
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

const server = startServer();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`🚪 Received ${signal}. Starting graceful shutdown...`);
    
    try {
        const serverInstance = await server;
        serverInstance.close((err) => {
            if (err) {
                console.error('Error during server shutdown:', err);
                process.exit(1);
            }
            console.log('✅ Server closed successfully');
            process.exit(0);
        });
        
        // Force shutdown after 30 seconds
        setTimeout(() => {
            console.error('⚠️  Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Error handling for unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    if (nodeEnv === 'production') {
        console.error('Shutting down due to unhandled promise rejection');
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
    if (nodeEnv === 'production') {
        console.error('Shutting down due to uncaught exception');
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    }
});

// Graceful shutdown on signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
