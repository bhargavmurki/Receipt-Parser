const { maxFileSize } = require('../config/config');

// Validate base64 image data
const validateBase64Image = (base64String) => {
    if (!base64String || typeof base64String !== 'string') {
        throw new Error('Invalid image data format');
    }
    
    if (base64String.length === 0) {
        throw new Error('Empty image data');
    }
    
    // Check for reasonable base64 size
    if (base64String.length > Math.ceil(maxFileSize * 4/3)) { // base64 is ~4/3 larger than binary
        throw new Error(`Image data too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`);
    }
    
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
        throw new Error('Invalid base64 image format');
    }
    
    return true;
};

// Validate and convert base64 to buffer
const base64ToBuffer = (base64String) => {
    validateBase64Image(base64String);
    
    let buffer;
    try {
        buffer = Buffer.from(base64String, 'base64');
        if (buffer.length === 0) {
            throw new Error('Empty buffer');
        }
    } catch (error) {
        throw new Error('Failed to decode base64 image data');
    }
    
    // Validate that this looks like image data
    const firstBytes = buffer.slice(0, 4);
    const isValidImage = 
        (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) || // JPEG
        (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) || // PNG
        (firstBytes[0] === 0x47 && firstBytes[1] === 0x49) || // GIF
        (firstBytes[0] === 0x42 && firstBytes[1] === 0x4D) || // BMP
        (firstBytes[0] === 0x52 && firstBytes[1] === 0x49); // WEBP
    
    if (!isValidImage) {
        throw new Error('Unsupported image format. Please upload a JPEG, PNG, GIF, BMP, or WEBP image.');
    }
    
    return buffer;
};

// Validate email format
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        throw new Error('Email is required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    if (email.length > 254) {
        throw new Error('Email address too long');
    }
    
    return email.toLowerCase().trim();
};

// Validate password strength
const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required');
    }
    
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
        throw new Error('Password too long');
    }
    
    // Check for at least one lowercase, uppercase, number, and special character
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        throw new Error('Password must contain at least one lowercase letter, uppercase letter, number, and special character');
    }
    
    return password;
};

// Validate user name
const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        throw new Error('Name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters long');
    }
    
    if (trimmedName.length > 50) {
        throw new Error('Name too long');
    }
    
    // Basic sanitization - allow letters, spaces, hyphens, apostrophes
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
        throw new Error('Name contains invalid characters');
    }
    
    return trimmedName;
};

// Validate receipt ID
const validateReceiptId = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('Invalid receipt ID');
    }
    
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
        throw new Error('Receipt ID cannot be empty');
    }
    
    // Basic validation for NeDB IDs (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(trimmedId)) {
        throw new Error('Invalid receipt ID format');
    }
    
    return trimmedId;
};

module.exports = {
    validateBase64Image,
    base64ToBuffer,
    validateEmail,
    validatePassword,
    validateName,
    validateReceiptId
};