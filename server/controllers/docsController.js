const firestoreUtils = require('../utils/firestore');

const docsController = {
  async listDocuments(req, res) {
    try {
      console.log('Listing documents...');
      const documents = await firestoreUtils.listDocuments();
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
      console.log('Creating new document...');
      const docId = await firestoreUtils.createDocument();
      console.log('Successfully created document:', docId);
      res.status(201).json({ 
        data: docId
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
  }
};

module.exports = docsController;
