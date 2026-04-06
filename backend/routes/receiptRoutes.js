const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticateToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { mobileReceiptUpload } = require('../middleware/upload');
const multer = require('multer');

const handleMobileUpload = (req, res, next) => {
    mobileReceiptUpload(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError) {
            const payload = error.code === 'LIMIT_FILE_SIZE'
                ? {
                    status: 400,
                    error: 'Image file is too large.',
                    code: 'FILE_TOO_LARGE'
                }
                : {
                    status: 400,
                    error: 'Unsupported or invalid image upload.',
                    code: 'INVALID_IMAGE_FORMAT'
                };

            res.status(payload.status).json({
                error: payload.error,
                code: payload.code
            });
            return;
        }

        next(error);
    });
};

// Require authentication for all receipt operations
router.post('/process-receipt', authenticateToken, uploadLimiter, receiptController.processReceipt);
router.post('/receipts/upload', authenticateToken, uploadLimiter, handleMobileUpload, receiptController.uploadReceipt);
router.get('/receipts', authenticateToken, receiptController.getReceipts);
router.delete('/receipts/:id', authenticateToken, receiptController.deleteReceipt);

module.exports = router;
