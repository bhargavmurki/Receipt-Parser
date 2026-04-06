const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/dev-login', authLimiter, authController.devLogin);
router.post('/apple', authLimiter, authController.appleLogin);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/verify', authenticateToken, authController.verifyToken);
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
