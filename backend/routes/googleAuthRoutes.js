const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { frontendUrl: configFrontendUrl } = require('../config/config');
const { issueAppToken } = require('../utils/tokens');

const resolveFrontendUrl = (req) => {
    if (configFrontendUrl) {
        return configFrontendUrl.replace(/\/$/, '');
    }

    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    const referer = req.get('referer');
    if (referer) {
        const refererUrl = new URL(referer);
        return `${refererUrl.protocol}//${refererUrl.host}`;
    }

    const origin = req.get('origin');
    if (origin) {
        return origin.replace(/\/$/, '');
    }

    return 'http://localhost:3000';
};

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        try {
            // Generate JWT token for the user
            const token = issueAppToken(
                { 
                    userId: req.user._id, 
                    email: req.user.email,
                    name: req.user.name 
                }
            );

            const frontendUrl = resolveFrontendUrl(req);
            if (!frontendUrl) {
                throw new Error('Frontend redirect URL is not configured');
            }
            
            // Instead of URL redirect with token, use a temporary landing page that sets the token
            res.send(`
                <html>
                <head><title>Logging you in...</title></head>
                <body>
                    <div style="text-align: center; font-family: Arial; margin-top: 100px;">
                        <h2>Logging you in...</h2>
                        <p>Please wait while we complete your authentication.</p>
                    </div>
                    <script>
                        // Store token and redirect
                        localStorage.setItem('token', ${JSON.stringify(token)});
                        // Redirect to frontend
                        window.location.href = ${JSON.stringify(frontendUrl)};
                    </script>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('OAuth callback error:', error);
            const frontendUrl = resolveFrontendUrl(req);
            if (!frontendUrl) {
                return res.status(500).json({ error: 'Frontend redirect URL is not configured' });
            }
            res.redirect(`${frontendUrl}/?error=auth_failed`);
        }
    }
);

// Get current user (for OAuth sessions)
router.get('/user', (req, res) => {
    if (req.user) {
        // Remove sensitive fields
        const { password, googleId, ...userWithoutSensitiveData } = req.user;
        res.json({ user: userWithoutSensitiveData });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
