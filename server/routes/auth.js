const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Check auth status
router.get('/status', authController.status);

// Route to initiate Google OAuth login
router.get('/login', authController.login);

// OAuth callback route
router.get('/callback', authController.callback);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;
