const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { port, validateConfig } = require('./config/config');
const receiptRoutes = require('./routes/receiptRoutes');

const app = express();

// Validate configuration on startup
const configIssues = validateConfig();
if (configIssues.length) {
    console.error('Startup blocked due to configuration issues:', configIssues);
    console.error('Please set the required environment variables in a .env file');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/', receiptRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});