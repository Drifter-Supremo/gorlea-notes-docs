const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /auth/register - User registration
router.post('/register', authController.register);

// POST /auth/login - User login
router.post('/login', authController.login);

// POST /auth/logout - User logout
// Note: Often logout is POST to prevent CSRF if it changes state,
// even though it feels like a GET. Sticking with POST for consistency.
router.post('/logout', authController.logout);

module.exports = router;
