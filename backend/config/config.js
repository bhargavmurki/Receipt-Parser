const util = require('util');
const dotenv = require('dotenv');
dotenv.config();

const cfg = {
    port: process.env.PORT || 5002,
    azureEndpoint: process.env.AZURE_ENDPOINT,
    azureApiKey: process.env.AZURE_API_KEY
};

function mask(str, show = 4) {
    if (!str) return 'NOT SET';
    const s = String(str);
    return s.length <= show ? '*'.repeat(s.length) : `${s.slice(0, show)}***${s.slice(-2)}`;
}

function validateConfig() {
    const problems = [];
    if (!cfg.azureEndpoint) problems.push('AZURE_ENDPOINT is missing');
    if (!cfg.azureApiKey) problems.push('AZURE_API_KEY is missing');

    // Helpful runtime logging (masked)
    console.log('Config loaded:', {
        PORT: cfg.port,
        AZURE_ENDPOINT: cfg.azureEndpoint || 'NOT SET',
        AZURE_API_KEY: mask(cfg.azureApiKey)
    });

    if (cfg.azureEndpoint && !/^https?:\/\//i.test(cfg.azureEndpoint)) {
        problems.push('AZURE_ENDPOINT must include the scheme, e.g. https://your-resource.cognitiveservices.azure.com/');
    }

    if (problems.length) {
        console.warn('Configuration issues detected:', problems);
        console.warn('Please create a .env file with:');
        console.warn('AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/');
        console.warn('AZURE_API_KEY=your-azure-api-key');
    }
    return problems;
}

module.exports = { ...cfg, validateConfig };
