const receiptService = require('../services/receiptService');
const { base64ToBuffer, validateReceiptId } = require('../middleware/validation');
const multer = require('multer');

const processReceiptBuffer = async (buffer, userId, res) => {
    const receiptData = await receiptService.analyzeReceipt(buffer);
    const savedReceipt = await receiptService.saveReceipt(receiptData, userId);

    return res.status(200).json({
        message: 'Receipt processed successfully',
        receipt: savedReceipt
    });
};

const processReceipt = async (req, res) => {
    try {
        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid request body',
                code: 'INVALID_BODY'
            });
        }
        
        if (!req.body.image) {
            return res.status(400).json({ 
                error: 'No image data received',
                code: 'MISSING_IMAGE'
            });
        }
        
        const base64Image = req.body.image;
        
        // Validate and convert base64 to buffer
        let buffer;
        try {
            buffer = base64ToBuffer(base64Image);
            console.log(`Processing receipt image: ${buffer.length} bytes`);
        } catch (validationError) {
            return res.status(400).json({ 
                error: validationError.message,
                code: 'INVALID_IMAGE'
            });
        }
        
        // Ensure user is authenticated (middleware should catch this, but double-check)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        return await processReceiptBuffer(buffer, req.user.userId, res);
    } catch (error) {
        console.error('Error processing receipt:', error);
        
        // Return appropriate error message based on error type
        if (error.message.includes('Azure')) {
            if (error.message.includes('InvalidContent') || error.message.includes('corrupted') || error.message.includes('unsupported')) {
                return res.status(400).json({ 
                    error: 'Invalid image format or corrupted file. Please try a different image.',
                    code: 'INVALID_IMAGE_FORMAT'
                });
            } else if (error.message.includes('quota') || error.message.includes('rate')) {
                return res.status(429).json({ 
                    error: 'Service quota exceeded. Please try again later.',
                    code: 'QUOTA_EXCEEDED'
                });
            } else {
                return res.status(503).json({ 
                    error: 'Receipt analysis service temporarily unavailable. Please try again later.',
                    code: 'SERVICE_UNAVAILABLE'
                });
            }
        } else if (error.message.includes('Failed to extract')) {
            return res.status(422).json({ 
                error: 'Could not extract receipt data from image. Please ensure the image is clear and contains a valid receipt.',
                code: 'EXTRACTION_FAILED'
            });
        } else if (error.message.includes('Database')) {
            return res.status(500).json({ 
                error: 'Failed to save receipt. Please try again.',
                code: 'DATABASE_ERROR'
            });
        } else {
            return res.status(500).json({ 
                error: 'Failed to process the receipt. Please try again.',
                code: 'PROCESSING_ERROR'
            });
        }
    }
};

const uploadReceipt = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                error: 'No image file received',
                code: 'MISSING_IMAGE'
            });
        }

        return await processReceiptBuffer(req.file.buffer, req.user.userId, res);
    } catch (error) {
        console.error('Error uploading receipt:', error);

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Image file is too large.',
                    code: 'FILE_TOO_LARGE'
                });
            }

            return res.status(400).json({
                error: 'Unsupported or invalid image upload.',
                code: 'INVALID_IMAGE_FORMAT'
            });
        }

        if (error.message.includes('Azure')) {
            if (error.message.includes('quota') || error.message.includes('rate')) {
                return res.status(429).json({
                    error: 'Service quota exceeded. Please try again later.',
                    code: 'QUOTA_EXCEEDED'
                });
            }

            return res.status(503).json({
                error: 'Receipt analysis service temporarily unavailable. Please try again later.',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        if (error.message.includes('Failed to extract')) {
            return res.status(422).json({
                error: 'Could not extract receipt data from image. Please ensure the image is clear and contains a valid receipt.',
                code: 'EXTRACTION_FAILED'
            });
        }

        if (error.message.includes('Database')) {
            return res.status(500).json({
                error: 'Failed to save receipt. Please try again.',
                code: 'DATABASE_ERROR'
            });
        }

        return res.status(500).json({
            error: 'Failed to process the receipt. Please try again.',
            code: 'PROCESSING_ERROR'
        });
    }
};

const getReceipts = async (req, res) => {
    try {
        // Ensure user is authenticated (middleware should catch this, but double-check)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // Validate pagination parameters
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                error: 'Invalid pagination parameters',
                code: 'INVALID_PAGINATION'
            });
        }
        
        const receipts = await receiptService.getReceipts(req.user.userId, {
            page,
            limit,
            sortBy,
            sortOrder
        });
        
        res.status(200).json({
            receipts: receipts.data,
            pagination: {
                page,
                limit,
                total: receipts.total,
                pages: Math.ceil(receipts.total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching receipts:', error.message);
        
        if (error.message.includes('Database')) {
            return res.status(500).json({ 
                error: 'Failed to fetch receipts from database',
                code: 'DATABASE_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to fetch receipts',
            code: 'FETCH_ERROR'
        });
    }
};

const deleteReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate receipt ID
        try {
            validateReceiptId(id);
        } catch (validationError) {
            return res.status(400).json({ 
                error: validationError.message,
                code: 'INVALID_RECEIPT_ID'
            });
        }
        
        // Ensure user is authenticated (middleware should catch this, but double-check)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        const deleted = await receiptService.deleteReceipt(id, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ 
                error: 'Receipt not found or you do not have permission to delete it',
                code: 'RECEIPT_NOT_FOUND'
            });
        }
        
        res.status(200).json({ 
            message: 'Receipt deleted successfully',
            receiptId: id
        });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        
        if (error.message.includes('Database')) {
            return res.status(500).json({ 
                error: 'Failed to delete receipt from database',
                code: 'DATABASE_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to delete receipt',
            code: 'DELETE_ERROR'
        });
    }
};

module.exports = {
    processReceipt,
    uploadReceipt,
    getReceipts,
    deleteReceipt
};
