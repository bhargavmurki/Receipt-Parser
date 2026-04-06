# Production Deployment Checklist

## Pre-Deployment Security Review

### ✅ Environment Configuration
- [ ] `NODE_ENV=production` set
- [ ] Strong JWT secret (64+ characters) configured
- [ ] Session secret (32+ characters) configured
- [ ] Azure credentials properly configured
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured appropriately
- [ ] File size limits set correctly

### ✅ Security Headers & HTTPS
- [ ] SSL/TLS certificate installed
- [ ] HTTPS redirect enabled
- [ ] Security headers configured (Helmet.js)
- [ ] HSTS enabled
- [ ] CSP headers configured

### ✅ Database Security
- [ ] Database files secured (600 permissions)
- [ ] Regular backups scheduled
- [ ] Database indexes created
- [ ] Data retention policies configured

### ✅ Dependency Security
- [ ] All dependencies updated to latest secure versions
- [ ] Security audit completed (`npm audit`)
- [ ] Vulnerability scan performed
- [ ] No known high/critical vulnerabilities

## Deployment Steps

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../
npm install
npm run build
```

### 2. Environment Setup
```bash
# Copy and configure environment file
cp backend/.env.example backend/.env
# Edit .env with production values
```

### 3. Database Initialization
```bash
# Start the server to initialize databases
cd backend
npm run prod
```

### 4. Security Verification
```bash
# Test health endpoint
curl https://your-domain.com/health

# Verify HTTPS redirect
curl -I http://your-domain.com

# Test API endpoints
curl -X POST https://your-domain.com/api/auth/register
```

## Post-Deployment Verification

### ✅ Functional Testing
- [ ] User registration works
- [ ] User login/logout works
- [ ] Receipt upload and processing works
- [ ] Receipt list and deletion works
- [ ] Bill splitting functionality works

### ✅ Security Testing
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Authentication required for protected endpoints

### ✅ Performance Testing
- [ ] Response times acceptable
- [ ] File upload limits working
- [ ] Memory usage stable
- [ ] Database queries optimized

### ✅ Monitoring Setup
- [ ] Health check endpoint accessible
- [ ] Logging system configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## Maintenance Tasks

### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resource usage
- [ ] Verify backup completion

### Weekly
- [ ] Review security logs for anomalies
- [ ] Check dependency updates
- [ ] Performance metrics review

### Monthly
- [ ] Security vulnerability scan
- [ ] Database cleanup and optimization
- [ ] SSL certificate expiration check
- [ ] Backup restoration test

## Incident Response

### If Security Issue Detected
1. **Immediate**: Block affected IPs/users
2. **Short-term**: Apply security patches
3. **Long-term**: Review and improve security measures

### If Performance Issue Detected
1. **Immediate**: Scale resources if needed
2. **Short-term**: Optimize problematic queries/code
3. **Long-term**: Implement performance monitoring

### If Service Outage
1. **Immediate**: Check health endpoint and logs
2. **Short-term**: Restart services if needed
3. **Long-term**: Implement redundancy measures

## Rollback Plan

### If Deployment Fails
1. Revert to previous version
2. Restore database backup if needed
3. Update DNS if necessary
4. Notify users of temporary issues

### Rollback Commands
```bash
# Stop current services
pm2 stop all

# Restore previous version
git checkout previous-release-tag

# Restore database
cp backup/receipts.db.backup backend/models/receipts.db
cp backup/users.db.backup backend/models/users.db

# Restart services
pm2 start all
```

## Success Criteria

### Deployment is successful when:
- [ ] All functional tests pass
- [ ] Security tests pass
- [ ] Performance meets requirements
- [ ] Monitoring systems are active
- [ ] Documentation is updated
- [ ] Team is notified of completion

## Contact Information

- **DevOps Team**: devops@company.com
- **Security Team**: security@company.com
- **On-call Engineer**: +1-xxx-xxx-xxxx

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: 2.0.0
**Rollback Tested**: [ ] Yes [ ] No

## Related Documentation
- [README.md](README.md) - Complete setup and usage guide
- [SECURITY.md](SECURITY.md) - Security implementation details
- [CHANGELOG.md](CHANGELOG.md) - Version history and migration guide