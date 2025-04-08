const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore'); // Keep this import if used by session store, otherwise remove

/**
 * Initialize Firebase Admin SDK using individual FIREBASE_* environment variables.
 */
try {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  };

  // console.log('DEBUG: FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID); // Removed debug log
  // console.log('DEBUG: Constructed serviceAccount object:', serviceAccount); // Removed debug log

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized using FIREBASE_* environment variables.');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  throw new Error('Could not initialize Firebase Admin. Check your FIREBASE_* environment variables.');
}


const db = admin.firestore(); // Get Firestore instance from initialized Admin SDK

// Collection reference
const DOCS_COLLECTION = 'documents';
const USERS_COLLECTION = 'users'; // Added for users

// Firestore utility functions (Keep existing functions as they are)
const firestoreUtils = {
    // List documents, optionally limited
    async listDocuments(userId, limit = null) {
        try {
            // Main query with sorting
            // Note: We are NOT filtering out archived documents here by default.
            // Add .where('isArchived', '==', false) if needed.
            let query = db.collection(DOCS_COLLECTION)
                .where('userId', '==', userId) // Filter by user
                .orderBy('lastOpenedAt', 'desc');

            // Apply limit if provided and valid
            if (limit && typeof limit === 'number' && limit > 0) {
                query = query.limit(limit);
                // console.log(`Firestore: Limiting listDocuments to ${limit} results.`); // Removed debug log
            }

            const snapshot = await query.get(); // Execute the query

            // Explicitly extract the required fields
            return snapshot.docs.map(doc => {
                const data = doc.data(); // Get the document data
                return {
                    id: doc.id,
                    title: data.title || 'Untitled Document', // Provide default title if missing
                    createdAt: data.createdAt || null, // Include createdAt timestamp
                    lastOpenedAt: data.lastOpenedAt || data.createdAt || null // Include lastOpenedAt, fallback to createdAt
                };
            });
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
            // console.log(`Firestore: Searching for title_lowercase == "${lowercaseTitle}"`); // Removed debug log

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
    async createDocument(userId, title = 'Untitled Document', content = '<p></p>') {
        try {
            const finalTitle = title.trim() === '' ? 'Untitled Document' : title; // Ensure title isn't empty
            const docData = {
                userId: userId, // Associate document with user
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
            // console.log(`Firestore: Updated document ${docId} with fields:`, Object.keys(updates)); // Removed debug log

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

            // --- Add simple spacing separator ---
            const separator = `<p><br></p>`;
            const contentWithSeparator = separator + contentToAppend;
            // --- End simple separator ---

            // Append the new content (with separator)
            const newContent = existingContent + contentWithSeparator;

            // Update content and lastOpenedAt timestamp
            await docRef.update({
                content: newContent,
                lastOpenedAt: admin.firestore.Timestamp.now()
            });

            // console.log(`Appended content to document ${docId}`); // Removed debug log
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
    },

    // --- User Management Functions ---

    // Find a user by email
    async findUserByEmail(email) {
        try {
            const snapshot = await db.collection(USERS_COLLECTION)
                .where('email', '==', email.toLowerCase()) // Ensure case-insensitive search
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null; // No user found
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            return {
                id: userData.userId || userDoc.id, // Use userId field if exists, otherwise fallback to doc ID
                ...userData
            };
        } catch (error) {
            console.error('Firestore findUserByEmail error:', error);
            throw error;
        }
    },

    // Create a new user
    async createUser(email, hashedPassword) {
        try {
            // Check if user already exists (optional, but good practice)
            const existingUser = await this.findUserByEmail(email);
            if (existingUser) {
                const error = new Error('User with this email already exists.');
                error.code = 'auth/email-already-in-use'; // Custom error code
                throw error;
            }

            const userData = {
                email: email.toLowerCase(), // Store email in lowercase
                password: hashedPassword, // Store the hashed password
                createdAt: admin.firestore.Timestamp.now()
            };

            const userRef = await db.collection(USERS_COLLECTION).add(userData);
            return {
                id: userRef.id,
                email: userData.email // Return only necessary info
            };
        } catch (error) {
            // Re-throw specific errors or handle generally
            if (error.code !== 'auth/email-already-in-use') {
                console.error('Firestore createUser error:', error);
            }
            throw error; // Propagate the error
        }
    }
};

// Export the utility functions and the db instance
module.exports = {
    ...firestoreUtils,
    db: db
};
