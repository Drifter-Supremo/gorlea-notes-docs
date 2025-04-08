const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');
const { requireAuth } = require('../middleware/auth');

// Get all documents for current user
router.get('/', requireAuth, docsController.listDocuments);

// Create new document
router.post('/', requireAuth, docsController.createDocument);

// Get single document
router.get('/:id', requireAuth, docsController.getDocument);

// Update document
router.put('/:id', requireAuth, docsController.updateDocument);

// Archive document (soft delete)
router.put('/:id/archive', requireAuth, docsController.archiveDocument);

// Delete document permanently
router.delete('/:id', requireAuth, docsController.deleteDocumentPermanently);

// Append content to a document
router.post('/:id/append', requireAuth, docsController.appendDocument);

module.exports = router;
