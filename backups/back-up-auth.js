const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route to initiate Google OAuth login
router.get('/login', authController.login);

// OAuth callback route
router.get('/callback', authController.callback);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;
