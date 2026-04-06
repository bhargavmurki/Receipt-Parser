const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

const JWT_ISSUER = 'receipt-parser';
const JWT_AUDIENCE = 'receipt-parser-app';
const JWT_EXPIRES_IN = '7d';

const issueAppToken = (payload) =>
    jwt.sign(payload, jwtSecret, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
    });

const verifyAppToken = (token) =>
    jwt.verify(token, jwtSecret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
    });

module.exports = {
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
    issueAppToken,
    verifyAppToken
};
