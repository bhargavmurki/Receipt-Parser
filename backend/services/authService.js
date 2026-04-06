const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const usersDb = require('../models/users');
const { appleAudience } = require('../config/config');
const { validateEmail, validatePassword, validateName } = require('../middleware/validation');
const { issueAppToken, verifyAppToken } = require('../utils/tokens');
const SALT_ROUNDS = 12; // Increased for better security

const verifyAppleIdentityToken = async (identityToken) => {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

    return jwtVerify(identityToken, appleJwks, {
        issuer: 'https://appleid.apple.com',
        audience: appleAudience
    });
};

// Generate secure random token
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

class AuthService {
    async registerUser(email, password, name) {
        try {
            // Validate and sanitize input
            const validatedEmail = validateEmail(email);
            const validatedPassword = validatePassword(password);
            const validatedName = validateName(name);
            
            // Check if user already exists
            const existingUser = await usersDb.findOne({ email: validatedEmail });
            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Hash password with increased salt rounds
            const hashedPassword = await bcrypt.hash(validatedPassword, SALT_ROUNDS);
            
            // Generate verification token (for future email verification)
            const verificationToken = generateSecureToken();

            // Create user object
            const user = {
                email: validatedEmail,
                password: hashedPassword,
                name: validatedName,
                emailVerified: true, // Auto-verify for simplicity (change for production)
                verificationToken, // For future email verification
                provider: 'email',
                isDeactivated: false,
                lastLogin: null,
                loginAttempts: 0,
                lockUntil: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Save user to database
            const savedUser = await usersDb.insert(user);
            
            console.log('User registered successfully:', { email: validatedEmail, id: savedUser._id });
            
            // Remove sensitive fields from response
            const { password: _, verificationToken: __, ...userWithoutPassword } = savedUser;
            
            return userWithoutPassword;
        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            // Validate input
            const validatedEmail = validateEmail(email);
            
            if (!password || typeof password !== 'string') {
                throw new Error('Invalid email or password');
            }
            
            // Find user by email
            const user = await usersDb.findOne({ email: validatedEmail });
            if (!user) {
                // Use generic error message to prevent email enumeration
                throw new Error('Invalid email or password');
            }

            // Check if account is locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
                throw new Error(`Account temporarily locked. Try again in ${lockTimeRemaining} minutes.`);
            }

            // Check if account is deactivated
            if (user.isDeactivated) {
                throw new Error('Account has been deactivated');
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                // Increment login attempts
                await this.handleFailedLogin(user._id);
                throw new Error('Invalid email or password');
            }

            // Reset login attempts on successful login
            await this.handleSuccessfulLogin(user._id);

            // Generate JWT token with additional claims
            const tokenPayload = {
                userId: user._id,
                email: user.email,
                name: user.name,
                jti: generateSecureToken(), // JWT ID for token blacklisting
                iat: Math.floor(Date.now() / 1000)
            };

            const token = issueAppToken(tokenPayload);

            // Remove sensitive fields from response
            const { password: _, verificationToken: __, loginAttempts: ___, lockUntil: ____, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                token
            };
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    async loginDevelopmentUser() {
        const email = 'local-dev@receiptparser.app';
        let user = await usersDb.findOne({ email });

        if (!user) {
            user = await usersDb.insert({
                email,
                name: 'Local Developer',
                emailVerified: true,
                provider: 'development',
                isDeactivated: false,
                lastLogin: null,
                loginAttempts: 0,
                lockUntil: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await this.handleSuccessfulLogin(user._id);
        user = await usersDb.findOne({ _id: user._id });

        const token = issueAppToken({
            userId: user._id,
            email: user.email,
            name: user.name,
            jti: generateSecureToken(),
            iat: Math.floor(Date.now() / 1000)
        });

        const { password: _, verificationToken: __, loginAttempts: ___, lockUntil: ____, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token
        };
    }

    async verifyToken(token) {
        try {
            const decoded = verifyAppToken(token);
            
            const user = await usersDb.findOne({ _id: decoded.userId });
            
            if (!user) {
                throw new Error('User not found');
            }

            if (user.isDeactivated) {
                throw new Error('User account has been deactivated');
            }

            // Remove password from response
            const { password: _, verificationToken: __, loginAttempts: ___, lockUntil: ____, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async getUserById(userId) {
        try {
            if (!userId || typeof userId !== 'string') {
                throw new Error('Invalid user ID');
            }
            
            const user = await usersDb.findOne({ _id: userId });
            if (!user) {
                throw new Error('User not found');
            }

            // Remove sensitive fields from response
            const { password: _, verificationToken: __, loginAttempts: ___, lockUntil: ____, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    async loginWithApple(identityToken, profile = {}) {
        if (!appleAudience) {
            throw new Error('Apple Sign In is not configured');
        }

        if (!identityToken || typeof identityToken !== 'string') {
            throw new Error('Apple identity token is required');
        }

        const { payload } = await verifyAppleIdentityToken(identityToken);

        const appleSub = payload.sub;
        const email = payload.email ? validateEmail(payload.email) : null;

        if (!appleSub) {
            throw new Error('Apple identity token is missing subject');
        }

        let user = await usersDb.findOne({ appleSub });

        if (!user && email) {
            user = await usersDb.findOne({ email });
            if (user) {
                await usersDb.update(
                    { _id: user._id },
                    {
                        $set: {
                            appleSub,
                            emailVerified: true,
                            updatedAt: new Date()
                        }
                    }
                );
                user = await usersDb.findOne({ _id: user._id });
            }
        }

        if (!user) {
            const fallbackName = email ? email.split('@')[0] : 'Apple User';
            const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || fallbackName;

            user = await usersDb.insert({
                appleSub,
                email,
                name: displayName,
                emailVerified: true,
                provider: 'apple',
                isDeactivated: false,
                lastLogin: null,
                loginAttempts: 0,
                lockUntil: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await this.handleSuccessfulLogin(user._id);
        user = await usersDb.findOne({ _id: user._id });

        const token = issueAppToken({
            userId: user._id,
            email: user.email,
            name: user.name,
            jti: generateSecureToken(),
            iat: Math.floor(Date.now() / 1000)
        });

        const { password: _, verificationToken: __, loginAttempts: ___, lockUntil: ____, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token
        };
    }

    // Handle failed login attempts
    async handleFailedLogin(userId) {
        try {
            const user = await usersDb.findOne({ _id: userId });
            if (!user) return;

            const maxAttempts = 5;
            const lockTime = 30 * 60 * 1000; // 30 minutes

            const updates = {
                loginAttempts: (user.loginAttempts || 0) + 1,
                updatedAt: new Date()
            };

            // Lock account after max attempts
            if (updates.loginAttempts >= maxAttempts) {
                updates.lockUntil = Date.now() + lockTime;
                console.warn(`Account locked due to too many failed attempts: ${user.email}`);
            }

            await usersDb.update({ _id: userId }, { $set: updates });
        } catch (error) {
            console.error('Error handling failed login:', error);
        }
    }

    // Handle successful login
    async handleSuccessfulLogin(userId) {
        try {
            await usersDb.update(
                { _id: userId },
                {
                    $set: {
                        lastLogin: new Date(),
                        updatedAt: new Date()
                    },
                    $unset: {
                        loginAttempts: 1,
                        lockUntil: 1
                    }
                }
            );
        } catch (error) {
            console.error('Error handling successful login:', error);
        }
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await usersDb.findOne({ _id: userId });
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            const validatedPassword = validatePassword(newPassword);

            // Hash new password
            const hashedPassword = await bcrypt.hash(validatedPassword, SALT_ROUNDS);

            // Update password
            await usersDb.update(
                { _id: userId },
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('Password changed successfully for user:', userId);
            return true;
        } catch (error) {
            console.error('Password change error:', error.message);
            throw error;
        }
    }
}

module.exports = new AuthService();
