const express = require('express');
const router = express.Router();
const { rewriteNote } = require('../controllers/aiController');

/**
 * Middleware to ensure user is authenticated
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const requireAuth = (req, res, next) => {
  if (!req.session.tokens) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      }
    });
  }
  next();
};

/**
 * POST /api/ai/rewrite
 * Rewrites a note using AI to improve clarity and structure
 * @requires Authentication
 */
router.post('/rewrite', requireAuth, rewriteNote);

module.exports = router;
