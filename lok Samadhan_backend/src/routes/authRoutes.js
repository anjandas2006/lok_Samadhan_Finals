const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register new citizen account (Supabase Auth / Local fallback)
router.post('/register', (req, res) => authController.register(req, res));

// POST /api/auth/login - Email + Password or Phone login
router.post('/login', (req, res) => authController.login(req, res));

// GET /api/auth/google-url - Generate Supabase Google OAuth URL
router.get('/google-url', (req, res) => authController.getGoogleOAuthUrl(req, res));

// POST /api/auth/google-verify - Verify Google OAuth session token
router.post('/google-verify', (req, res) => authController.googleVerify(req, res));

// POST /api/auth/exchange-code - Exchange authorization code for session
router.post('/exchange-code', (req, res) => authController.exchangeAuthCode(req, res));

// POST /api/auth/forgot-password - Send password reset email via Supabase
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

// GET /api/auth/me - Validate current session token
router.get('/me', (req, res) => authController.getCurrentUser(req, res));

// POST /api/auth/logout - Sign out session
router.post('/logout', (req, res) => authController.logout(req, res));

// GET /api/auth/demo-accounts - Pre-configured demo credentials
router.get('/demo-accounts', (req, res) => authController.getDemoAccounts(req, res));

module.exports = router;

