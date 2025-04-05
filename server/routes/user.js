const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth'); // Import the middleware

const router = express.Router();

// GET /api/me - Get current user info (requires authentication)
router.get('/me', requireAuth, userController.getCurrentUser); // Apply middleware

module.exports = router;