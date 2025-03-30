const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');

// Get all documents for current user
router.get('/', docsController.listDocuments);

// Create new document
router.post('/', docsController.createDocument);

// Get single document
router.get('/:id', docsController.getDocument);

// Update document
router.put('/:id', docsController.updateDocument);

// Archive document (soft delete)
router.put('/:id/archive', docsController.archiveDocument); // Added archive route

// Delete document permanently
router.delete('/:id', docsController.deleteDocumentPermanently); // Added delete route

// Append content to a document
router.post('/:id/append', docsController.appendDocument); // Added append route

module.exports = router;
