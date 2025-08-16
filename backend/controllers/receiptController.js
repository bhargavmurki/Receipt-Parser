const receiptService = require('../services/receiptService');

const processReceipt = async (req, res) => {
    try {
        // Validate input
        if (!req.body || !req.body.image) {
            return res.status(400).json({ error: 'No image data received' });
        }
        
        const base64Image = req.body.image;
        
        // Validate base64 format
        if (typeof base64Image !== 'string' || base64Image.length === 0) {
            return res.status(400).json({ error: 'Invalid image data format' });
        }
        
        let buffer;
        try {
            buffer = Buffer.from(base64Image, 'base64');
            if (buffer.length === 0) {
                throw new Error('Empty buffer');
            }
            
            // Log buffer info for debugging
            console.log(`Received image buffer: ${buffer.length} bytes`);
            console.log(`Base64 string length: ${base64Image.length}`);
            
            // Validate that this looks like image data
            const firstBytes = buffer.slice(0, 4);
            const isValidImage = 
                (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) || // JPEG
                (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) || // PNG
                (firstBytes[0] === 0x47 && firstBytes[1] === 0x49) || // GIF
                (firstBytes[0] === 0x42 && firstBytes[1] === 0x4D);   // BMP
            
            if (!isValidImage) {
                console.warn('Warning: Buffer does not appear to be a valid image format');
            }
            
        } catch (bufferError) {
            console.error('Buffer creation failed:', bufferError);
            return res.status(400).json({ error: 'Invalid base64 image data' });
        }
        
        const receiptData = await receiptService.analyzeReceipt(buffer);
        const savedReceipt = await receiptService.saveReceipt(receiptData);
        
        res.status(200).json(savedReceipt);
    } catch (error) {
        console.error('Error processing receipt:', error);
        
        // Return appropriate error message based on error type
        if (error.message.includes('Azure')) {
            res.status(503).json({ error: 'Receipt analysis service unavailable' });
        } else if (error.message.includes('Failed to extract')) {
            res.status(422).json({ error: 'Could not extract receipt data from image' });
        } else {
            res.status(500).json({ error: 'Failed to process the receipt' });
        }
    }
};

const getReceipts = async (req, res) => {
    try {
        const receipts = await receiptService.getReceipts();
        res.status(200).json(receipts);
    } catch (error) {
        console.error('Error fetching receipts:', error.message);
        res.status(500).json({ error: 'Failed to fetch receipts' });
    }
};

const deleteReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid receipt ID' });
        }
        
        const deleted = await receiptService.deleteReceipt(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        
        res.status(200).json({ message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).json({ error: 'Failed to delete receipt' });
    }
};

module.exports = {
    processReceipt,
    getReceipts,
    deleteReceipt
};
