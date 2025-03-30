const express = require('express');
const router = express.Router();
const { rewriteNote, saveNote, createDoc } = require('../controllers/aiController');

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
 * @requires Authentication (Temporarily Disabled)
 */
router.post('/rewrite', rewriteNote); // Removed requireAuth

/**
 * POST /api/ai/save
 * Save a rewritten note to Google Docs
 * @requires Authentication (Temporarily Disabled)
 */
router.post('/save', saveNote); // Removed requireAuth

/**
 * POST /api/ai/create
 * Create a new Google Doc with the note
 * @requires Authentication (Temporarily Disabled)
 */
router.post('/create', createDoc); // Removed requireAuth

module.exports = router;
