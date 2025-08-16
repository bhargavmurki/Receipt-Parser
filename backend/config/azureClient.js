const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { azureEndpoint, azureApiKey } = require('./config');

let client = null;

try {
    if (!azureEndpoint || !azureApiKey) {
        throw new Error('Azure credentials not configured');
    }
    
    client = new DocumentAnalysisClient(
        azureEndpoint,
        new AzureKeyCredential(azureApiKey)
    );
    
    console.log('Azure Document Analysis Client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Azure client:', error.message);
    throw error;
}

module.exports = client;
