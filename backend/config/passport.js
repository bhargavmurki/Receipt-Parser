const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const usersDb = require('../models/users');
const { port, nodeEnv, backendUrl, googleCallbackUrl } = require('./config');

// Load environment variables
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Google OAuth configured successfully

// Only initialize Google strategy if credentials are provided
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {
    const resolvedCallbackUrl =
        googleCallbackUrl ||
        (backendUrl
            ? `${backendUrl.replace(/\/$/, '')}/api/auth/google/callback`
            : `${nodeEnv === 'production' ? 'https' : 'http'}://localhost:${port}/api/auth/google/callback`);

    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: resolvedCallbackUrl
    }, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await usersDb.findOne({ googleId: profile.id });
        
        if (user) {
            // User exists, return user
            return done(null, user);
        }
        
        // Check if user exists with same email (from regular registration)
        user = await usersDb.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            await usersDb.update(
                { _id: user._id },
                { 
                    $set: { 
                        googleId: profile.id,
                        emailVerified: true // Google emails are pre-verified
                    }
                }
            );
            
            const updatedUser = await usersDb.findOne({ _id: user._id });
            return done(null, updatedUser);
        }
        
        // Create new user
        const newUser = {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            profilePicture: profile.photos[0]?.value,
            emailVerified: true, // Google emails are pre-verified
            provider: 'google',
            createdAt: new Date()
        };
        
        const savedUser = await usersDb.insert(newUser);
        return done(null, savedUser);
        
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
    }));
} else {
    console.log('Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable');
}

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await usersDb.findOne({ _id: id });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
