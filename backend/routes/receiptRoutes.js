const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

router.post('/process-receipt', receiptController.processReceipt);
router.get('/receipts', receiptController.getReceipts);
router.delete('/receipts/:id', receiptController.deleteReceipt);

module.exports = router;
