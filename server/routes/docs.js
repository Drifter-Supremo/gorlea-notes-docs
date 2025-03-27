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

module.exports = router;
