const firestoreUtils = require('../utils/firestore');

const docsController = {
  async listDocuments(req, res) {
    try {
      // Check for limit query parameter
      const limitParam = req.query.limit;
      let limit = null;
      if (limitParam) {
        limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit <= 0) {
          return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive number.' });
        }
        console.log(`Listing documents with limit: ${limit}`);
      } else {
        console.log('Listing all documents (no limit specified)...');
      }

      // Pass the parsed limit (or null) to the utility function
      const documents = await firestoreUtils.listDocuments(req.session.user.id, limit); 
      console.log('Successfully listed', documents.length, 'documents');
      res.json({ data: documents });
    } catch (error) {
      console.error('Error listing documents:', error.stack);
      res.status(500).json({ 
        error: 'Failed to fetch documents',
        details: error.message 
      });
    }
  },

  async createDocument(req, res) {
    try {
      // Extract optional title and content from body
      const { title, content } = req.body; 
      console.log('Creating new document with:', { title, content: content ? '[content provided]' : '[no content]' });
      // Pass title and content to the updated utility function
      const newDoc = await firestoreUtils.createDocument(req.session.user.id, title, content); 
      console.log('Successfully created document:', newDoc.id);
      res.status(201).json({ 
        data: newDoc // Return the full new document object
      });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Failed to create document' });
    }
  },

  async getDocument(req, res) {
    try {
      const { id } = req.params;
      console.log('Fetching document:', id);
      const document = await firestoreUtils.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json({ data: document });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  },

    async updateDocument(req, res) {
        try {
            const { id } = req.params;
            let { title, content } = req.body; // Use let for title

            // Backend Title Validation
            const trimmedTitle = title ? title.trim() : ''; // Handle potential null/undefined title
            const finalTitle = trimmedTitle === '' ? 'Untitled Document' : trimmedTitle;

            console.log('Updating document:', id, 'with title:', finalTitle); // Log the final title being used

            // Prepare updates object
            const updates = {
                title: finalTitle,
                content: content // Keep content as is (or add validation if needed later)
                // Note: lastOpenedAt is updated by getDocument called within updateDocument
            };

            await firestoreUtils.updateDocument(id, updates);
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating document:', error.stack); // Log stack trace
      res.status(500).json({ error: 'Failed to update document' });
    }
  },

  // Archive document (soft delete)
  async archiveDocument(req, res) {
    try {
      const { id } = req.params;
      console.log('Archiving document:', id);
      await firestoreUtils.deleteDocument(id); // Uses existing soft delete util
      res.json({ success: true, message: 'Document archived successfully' });
    } catch (error) {
      console.error('Error archiving document:', error.stack);
      res.status(500).json({ error: 'Failed to archive document' });
    }
  },

  // Delete document permanently
  async deleteDocumentPermanently(req, res) {
    try {
      const { id } = req.params;
      console.log('Permanently deleting document:', id);
      await firestoreUtils.hardDeleteDocument(id); // Use new hard delete util
      res.json({ success: true, message: 'Document permanently deleted' });
    } catch (error) {
      console.error('Error permanently deleting document:', error.stack);
      // Consider specific error handling, e.g., for not found
      res.status(500).json({ error: 'Failed to permanently delete document' });
    }
  },

  // Append content to a document
  async appendDocument(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
             return res.status(400).json({ error: 'Content is required to append.' });
        }

        console.log(`Appending content to document: ${id}`);
        await firestoreUtils.appendContent(id, content);
        // Send a simple success response, maybe just status 200 or 204
        // Or confirm with a message if preferred by the calling service (AI controller)
        res.status(200).json({ success: true, message: 'Content appended successfully' }); 

    } catch (error) {
        console.error(`Error appending content to document ${req.params.id}:`, error.stack);
        // Handle specific errors like 'Document not found'
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.status(500).json({ error: 'Failed to append content' });
    }
  }
};

module.exports = docsController;
