// server/scripts/migrateDocs.js (Revised Logic)
const admin = require('firebase-admin');
const path = require('path');

// --- Firebase Admin Initialization ---
try {
    const serviceAccountPath = path.join(__dirname, '../../credentials/gorlea-tasks-firebase-adminsdk-fbsvc-d160951b11.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'gorlea-tasks'
    });
    console.log('Firebase Admin initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}

const db = admin.firestore();
const DOCS_COLLECTION = 'documents';

// --- Get User ID from Command Line ---
const targetUserId = process.argv[2];
if (!targetUserId) {
    console.error('Error: Missing User ID.');
    console.error('Usage: node server/scripts/migrateDocs.js <YOUR_USER_ID>');
    process.exit(1);
}
console.log(`Target User ID for migration: ${targetUserId}`);

// --- Migration Logic (Revised) ---
async function migrateDocuments() {
    console.log(`Fetching all documents from '${DOCS_COLLECTION}' to check for missing userId...`);
    let documentsToUpdateCount = 0;
    const updates = []; // Array to hold update promises

    try {
        // Fetch ALL documents in the collection.
        // Warning: For very large collections, consider batching this process.
        const snapshot = await db.collection(DOCS_COLLECTION).get();

        if (snapshot.empty) {
            console.log('No documents found in the collection.');
            return;
        }

        console.log(`Found ${snapshot.size} total documents. Checking each...`);

        snapshot.forEach(doc => {
            const data = doc.data();
            // Check if the userId field is missing or explicitly null/undefined
            if (!data.hasOwnProperty('userId') || data.userId == null) {
                console.log(` - Document ID: ${doc.id} needs migration. Preparing update.`);
                documentsToUpdateCount++;
                // Add the update operation promise to the array
                updates.push(doc.ref.update({ userId: targetUserId }));
            } else {
                // Optional: Log documents that already have a userId
                // console.log(` - Document ID: ${doc.id} already has userId: ${data.userId}. Skipping.`);
            }
        });

        if (documentsToUpdateCount === 0) {
            console.log('No documents required migration.');
            return;
        }

        console.log(`Attempting to migrate ${documentsToUpdateCount} documents...`);

        // Execute all update promises concurrently
        await Promise.all(updates);

        console.log(`Successfully migrated ${documentsToUpdateCount} documents.`);
        console.log('Migration complete.');

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1); // Exit on error
    }
}

// --- Run the Migration ---
migrateDocuments().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Unhandled error during migration script execution:', error);
    process.exit(1);
});