const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require(path.join(__dirname, '../../credentials/gorlea-tasks-firebase-adminsdk-fbsvc-d160951b11.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'gorlea-tasks'
});

const db = admin.firestore();

// Collection reference
const DOCS_COLLECTION = 'documents';

// Firestore utility functions
const firestoreUtils = {
    // List documents, optionally limited
    async listDocuments(limit = null) { // Add optional limit parameter
        try {
            let query = db.collection(DOCS_COLLECTION)
                .where('isArchived', '==', false)
                .orderBy('lastOpenedAt', 'desc'); // Start query chain

            // Apply limit if provided and valid
            if (limit && typeof limit === 'number' && limit > 0) {
                query = query.limit(limit);
                console.log(`Firestore: Limiting listDocuments to ${limit} results.`); // Debug log
            }

            const snapshot = await query.get(); // Execute the query
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Firestore list documents error:', error);
            throw error;
        }
    },

    // Find a document by title (case-insensitive)
    async findDocumentByTitle(title) {
        try {
            // Convert search title to lowercase
            const lowercaseTitle = title.toLowerCase(); 
            console.log(`Firestore: Searching for title_lowercase == "${lowercaseTitle}"`); // Debug log
            
            // Query using the dedicated lowercase field
            const snapshot = await db.collection(DOCS_COLLECTION)
                .where('title_lowercase', '==', lowercaseTitle) // Query lowercase field
                .where('isArchived', '==', false)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null; // No matching document found
            }
            
            // Return the first match
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Firestore findDocumentByTitle error:', error);
            throw error;
        }
    },

    // Create a new document, now accepting initial content
    async createDocument(title = 'Untitled Document', content = '<p></p>') { 
        try {
            const finalTitle = title.trim() === '' ? 'Untitled Document' : title; // Ensure title isn't empty
            const docData = {
                title: finalTitle, // Store original case title
                title_lowercase: finalTitle.toLowerCase(), // Store lowercase version for searching
                content: content, 
                createdAt: admin.firestore.Timestamp.now(),
                lastOpenedAt: admin.firestore.Timestamp.now(), 
                isArchived: false
            };

            const docRef = await db.collection(DOCS_COLLECTION).add(docData);
            return {
                id: docRef.id,
                ...docData
            };
        } catch (error) {
            console.error('Firestore create document error:', error);
            throw error;
        }
    },

    // Get a single document (keeping existing logic)
    async getDocument(docId) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                throw new Error('Document not found');
            }
            
            // Update lastOpenedAt timestamp whenever the document is fetched
            await docRef.update({ lastOpenedAt: admin.firestore.Timestamp.now() });

            return {
                id: docSnap.id,
                ...docSnap.data()
                // Note: The returned data might not reflect the very latest lastOpenedAt
                // if the update hasn't fully propagated, but it's updated in Firestore.
            };
        } catch (error) {
            console.error('Firestore get document error:', error);
            throw error;
        }
    },

    // Update a document (keeping existing logic)
    async updateDocument(docId, updates) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            
            // If the title is being updated, also update the lowercase version
            if (updates.title !== undefined) {
                const finalTitle = updates.title.trim() === '' ? 'Untitled Document' : updates.title;
                updates.title = finalTitle; // Ensure title isn't empty in update
                updates.title_lowercase = finalTitle.toLowerCase();
            }

            // Add/update lastOpenedAt timestamp on any update
            updates.lastOpenedAt = admin.firestore.Timestamp.now();

            // Apply the updates
            await docRef.update(updates); 
            console.log(`Firestore: Updated document ${docId} with fields:`, Object.keys(updates));

            // Get and return the updated document data (excluding the lowercase title potentially)
            // Note: getDocument also updates lastOpenedAt, which is slightly redundant here but harmless
            return await this.getDocument(docId);
        } catch (error) {
            console.error('Firestore update document error:', error);
            throw error;
        }
    },

    // Append content to an existing document
    async appendContent(docId, contentToAppend) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                throw new Error(`Document with ID ${docId} not found for appending.`);
            }

            const existingContent = docSnap.data().content || '';
            // Simple HTML concatenation, assuming contentToAppend is also HTML
            // Add a separator if desired, e.g., '<hr>' or just ensure contentToAppend starts with <p>
            const newContent = existingContent + contentToAppend; 

            // Update content and lastOpenedAt timestamp
            await docRef.update({ 
                content: newContent,
                lastOpenedAt: admin.firestore.Timestamp.now() 
            });
            
            console.log(`Appended content to document ${docId}`);
            return true; // Indicate success

        } catch (error) {
            console.error(`Firestore appendContent error for doc ${docId}:`, error);
            throw error;
        }
    },


    // Delete a document (soft delete by archiving - keeping existing logic)
    async deleteDocument(docId) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            // Only update isArchived
            await docRef.update({
                isArchived: true 
            });
            return true;
        } catch (error) {
            console.error('Firestore delete document error:', error);
            throw error;
        }
    },

    // Permanently delete a document
    async hardDeleteDocument(docId) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            await docRef.delete();
            return true;
        } catch (error) {
            console.error('Firestore hard delete document error:', error);
            // Check for specific errors if needed, e.g., not found
            throw error;
        }
    }
};

module.exports = firestoreUtils;
