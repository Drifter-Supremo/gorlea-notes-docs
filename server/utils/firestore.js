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
    // List all documents
    async listDocuments() {
        try {
            const snapshot = await db.collection(DOCS_COLLECTION)
                .where('isArchived', '==', false)
                .orderBy('lastOpenedAt', 'desc') // Sort by lastOpenedAt
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Firestore list documents error:', error);
            throw error;
        }
    },

    // Create a new document
    async createDocument(title = 'Untitled Document') {
        try {
            const docData = {
                title,
                content: '',
                createdAt: admin.firestore.Timestamp.now(),
                lastOpenedAt: admin.firestore.Timestamp.now(), // Use lastOpenedAt
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

    // Get a single document
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

    // Update a document
    async updateDocument(docId, updates) {
        try {
            const docRef = db.collection(DOCS_COLLECTION).doc(docId);
            // Only apply the specific updates provided
            await docRef.update(updates); 

            // Get and return the updated document
            return await this.getDocument(docId);
        } catch (error) {
            console.error('Firestore update document error:', error);
            throw error;
        }
    },

    // Delete a document (soft delete by archiving)
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
