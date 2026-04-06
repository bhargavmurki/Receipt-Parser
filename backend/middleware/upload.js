const multer = require('multer');
const path = require('path');
const { maxFileSize } = require('../config/config');

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/heic',
    'image/heif'
]);

const allowedExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.heic',
    '.heif'
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxFileSize,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(ext)) {
            cb(null, true);
            return;
        }

        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
    }
});

module.exports = {
    mobileReceiptUpload: upload.single('image')
};
