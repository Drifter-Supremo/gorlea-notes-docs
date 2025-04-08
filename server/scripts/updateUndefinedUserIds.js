const firestoreUtils = require('../utils/firestore');
const { db } = require('../utils/firestore');

const CORRECT_USER_ID = 'ePQ1Bkf220jBIxWsTcPh';

async function updateUndefinedUserIds() {
    try {
        console.log('Starting migration to update documents with undefined userIds...');
        
        // Get all documents where userId is undefined
        const snapshot = await db.collection('documents')
            .where('userId', '==', undefined)
            .get();

        if (snapshot.empty) {
            console.log('No documents with undefined userId found.');
            return;
        }

        console.log(`Found ${snapshot.size} documents with undefined userId`);

        // Batch update all documents
        const batch = db.batch();
        snapshot.forEach(doc => {
            const docRef = db.collection('documents').doc(doc.id);
            batch.update(docRef, { userId: CORRECT_USER_ID });
        });

        await batch.commit();
        console.log(`Successfully updated ${snapshot.size} documents with userId: ${CORRECT_USER_ID}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Run the migration
updateUndefinedUserIds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
