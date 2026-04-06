# Changelog

All notable changes to the Receipt Parser project will be documented in this file.

## [2.0.0] - 2024-10-04

### 🔒 Security Enhancements
- **BREAKING**: Added mandatory authentication for all receipt operations
- **NEW**: JWT-based authentication with 7-day token expiration
- **NEW**: User data isolation - users can only access their own receipts
- **NEW**: Account lockout protection (5 failed attempts = 30-minute lockout)
- **NEW**: Token blacklisting for secure logout
- **NEW**: Password strength requirements with bcrypt hashing (12 salt rounds)
- **NEW**: Rate limiting for all endpoints (configurable)
- **NEW**: CORS protection with origin whitelisting
- **NEW**: Comprehensive input validation and sanitization

### 🏗️ Architecture Improvements
- **NEW**: Modular middleware system (auth, CORS, rate limiting, validation)
- **NEW**: Centralized error handling with standardized responses
- **NEW**: Database optimization with proper indexing
- **NEW**: Health check endpoint with database status
- **NEW**: Graceful shutdown handling
- **NEW**: Environment-based configuration with validation
- **NEW**: Structured logging system with security event tracking

### 📱 Frontend Enhancements
- **NEW**: Authentication UI with login/register forms
- **NEW**: User profile management and logout functionality
- **NEW**: Centralized API client with interceptors
- **NEW**: Enhanced error handling with user-friendly messages
- **NEW**: Automatic token refresh and cleanup
- **NEW**: Protected route handling
- **NEW**: Pagination support for receipt listings

### 🔧 Backend Improvements
- **NEW**: RESTful API with `/api/` prefix
- **NEW**: Structured response format for all endpoints
- **NEW**: Password change functionality
- **NEW**: User management services
- **NEW**: Database connection management and initialization
- **NEW**: Comprehensive validation middleware
- **NEW**: Request/response logging

### 🛡️ Security Middleware
- **NEW**: JWT authentication middleware with user verification
- **NEW**: Rate limiting middleware (general, auth, upload)
- **NEW**: Input validation middleware with sanitization
- **NEW**: CORS middleware with configurable origins
- **NEW**: Error handling middleware with secure responses
- **NEW**: Helmet.js security headers

### 📊 Database Changes
- **BREAKING**: Added `userId` field to all receipts for user isolation
- **NEW**: Users database with authentication support
- **NEW**: Database indexes for improved performance
- **NEW**: Automatic timestamp tracking
- **NEW**: Data validation and sanitization
- **NEW**: Pagination support with query optimization

### 🔧 Configuration Updates
- **NEW**: Enhanced environment variable validation
- **NEW**: Production vs development configuration
- **NEW**: Rate limiting configuration
- **NEW**: File upload limits configuration
- **NEW**: CORS origin configuration
- **NEW**: Secure secret management with strength validation

### 📖 Documentation
- **NEW**: Comprehensive security implementation guide
- **NEW**: Production deployment checklist
- **NEW**: Updated README with security features
- **NEW**: API documentation with authentication examples
- **NEW**: Environment setup guide
- **NEW**: Troubleshooting guide

### 🐛 Bug Fixes
- Fixed file size validation (reduced from 50MB to 10MB)
- Improved Azure error handling with specific error codes
- Enhanced image format validation with magic byte checking
- Fixed CORS configuration for production environments
- Improved error messages for better user experience

### ⚡ Performance Improvements
- Reduced maximum request size from 50MB to 15MB
- Added database indexing for faster queries
- Implemented pagination to handle large datasets
- Optimized image processing pipeline
- Added request compression

### 🔄 Breaking Changes
- **Authentication Required**: All receipt endpoints now require authentication
- **API Prefix**: All endpoints moved to `/api/` prefix
- **Database Schema**: Added userId to receipts (migration required)
- **Environment Variables**: New required environment variables for security
- **Response Format**: Standardized response format for all endpoints

### 📦 Dependencies
- **Added**: helmet (security headers)
- **Added**: express-rate-limit (rate limiting)
- **Added**: compression (request compression)
- **Updated**: bcryptjs (password hashing)
- **Updated**: jsonwebtoken (JWT handling)
- **Removed**: body-parser (replaced with express built-in)
- **Removed**: crypto dependency (using Node.js built-in)
- **Removed**: mongoose (not used)

---

## [1.0.0] - 2024-08-15

### Initial Release
- Basic receipt upload and processing
- Azure Form Recognizer integration
- Bill splitting functionality
- NeDB database storage
- React frontend with drag-and-drop upload
- Express backend with REST API
- Admin interface for database management

### Features
- Receipt image upload (JPEG, PNG, GIF, BMP)
- AI-powered text extraction
- Item-level data extraction
- Basic bill splitting
- Receipt management (view, delete)
- Admin interface

### Known Issues (Fixed in 2.0.0)
- ❌ No authentication system
- ❌ No user data isolation
- ❌ No input validation
- ❌ No rate limiting
- ❌ No CORS protection
- ❌ No error handling
- ❌ No security headers
- ❌ Wide-open admin interface

---

## Migration Guide: 1.0.0 → 2.0.0

### Database Migration
```bash
# Backup existing data
cp backend/models/receipts.db backend/models/receipts.db.backup

# The application will automatically add userId field to existing receipts
# Existing receipts will be assigned to a default user for migration
```

### Environment Variables
```bash
# Add these new required variables to your .env file:
JWT_SECRET=your-super-strong-jwt-secret-at-least-64-characters
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### API Changes
```bash
# Old endpoints:
POST /process-receipt    →  POST /api/process-receipt (+ auth required)
GET /receipts           →  GET /api/receipts (+ auth required)
DELETE /receipts/:id    →  DELETE /api/receipts/:id (+ auth required)

# New endpoints:
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET /api/auth/verify        # Token verification
GET /health                 # Health check
```

### Frontend Changes
- All API calls now require authentication
- Users must log in before accessing receipts
- Enhanced error handling
- New authentication UI components

### Security Notes
- **Action Required**: Regenerate any Azure API keys if they were previously committed
- **Action Required**: Set a strong JWT secret
- **Recommended**: Review and update CORS origins for production
- **Recommended**: Configure rate limiting for your use case

---

## Security Changelog

### Security Fixes in 2.0.0
- **Critical**: Added authentication to prevent unauthorized access
- **High**: Implemented user data isolation to prevent data leaks
- **High**: Added rate limiting to prevent abuse
- **Medium**: Implemented proper CORS policy
- **Medium**: Added comprehensive input validation
- **Medium**: Secured error handling to prevent information disclosure
- **Low**: Added security headers with Helmet.js

### Security Recommendations
1. **Immediate**: Update to 2.0.0 for critical security fixes
2. **Production**: Use strong secrets (64+ characters for JWT)
3. **Production**: Enable HTTPS with proper certificates
4. **Production**: Configure monitoring and alerting
5. **Ongoing**: Regular dependency updates
6. **Ongoing**: Security audit reviews

---

*For detailed security information, see [SECURITY.md](SECURITY.md)*
*For deployment guidance, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)*
