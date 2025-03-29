// DOM Elements
const docsList = document.querySelector('.docs-list');
const newDocButton = document.querySelector('.new-doc-button');
const emptyState = document.querySelector('.empty-state');

// Fetch documents from API
async function fetchDocuments() {
    try {
        // Show loading state
        emptyState.textContent = 'Loading documents...';
        
        const response = await fetch('/api/docs', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Document fetch error:', error);
        emptyState.textContent = 'Error loading documents. Please refresh.';
        return [];
    }
}

// Create new document
async function createNewDocument() {
    try {
        newDocButton.disabled = true;
        newDocButton.innerHTML = 'Creating...';

        const response = await fetch('/api/docs', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create document');
        }

        const { data } = await response.json();
        window.location.href = `editor.html?id=${data.id}`;
    } catch (error) {
        console.error('Document creation error:', error);
        // Error handling remains the same
        alert('Failed to create document. Please try again.');
    } finally {
        // Always reset the button state after the attempt
        newDocButton.disabled = false;
        newDocButton.innerHTML = '<span>+</span> New Document';
    }
}

// Render document list
function renderDocumentList(documents) {
    if (documents.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    docsList.innerHTML = '';

    documents.forEach(doc => {
        const docCard = document.createElement('div');
        docCard.className = 'doc-card';
        
        // Removed date display logic

        // New Structure: doc-main for title, doc-actions for buttons + arrow
        docCard.innerHTML = `
            <div class="doc-main"> 
                <div class="doc-title">${doc.title || 'Untitled Document'}</div>
            </div>
            <div class="doc-actions"> 
                 <button class="doc-action-archive" data-id="${doc.id}" title="Archive">💾</button> 
                 <button class="doc-action-delete" data-id="${doc.id}" title="Delete">🗑️</button> 
                 <div class="doc-arrow">→</div> 
            </div>
        `;

        // Navigate to editor when clicking the main card area (excluding action buttons)
        docCard.addEventListener('click', (event) => {
            // Prevent navigation if an action button OR the arrow inside doc-actions is clicked
            if (event.target.closest('.doc-action-archive') || 
                event.target.closest('.doc-action-delete') ||
                event.target.closest('.doc-arrow')) { 
                return; 
            }
            // Navigate if clicking anywhere else on the card (like the title area)
            window.location.href = `editor.html?id=${doc.id}`;
        });

        // Add listeners specifically to the buttons
        const archiveBtn = docCard.querySelector('.doc-action-archive');
        const deleteBtn = docCard.querySelector('.doc-action-delete');
        // Add listener to the arrow for navigation (now it's inside doc-actions)
        const arrowDiv = docCard.querySelector('.doc-arrow'); 

        archiveBtn.addEventListener('click', (event) => {
            // event.stopPropagation(); // Not strictly needed if main listener checks target
            handleArchive(doc.id, docCard); 
        });

        deleteBtn.addEventListener('click', (event) => {
            // event.stopPropagation(); // Not strictly needed if main listener checks target
            handleDelete(doc.id, docCard); 
        });

        arrowDiv.addEventListener('click', (event) => {
             // event.stopPropagation(); // Not strictly needed if main listener checks target
             window.location.href = `editor.html?id=${doc.id}`;
        });


        docsList.appendChild(docCard);
    });
}

// Handle archiving a document
async function handleArchive(docId, cardElement) {
    console.log(`Archive clicked for doc: ${docId}`);
    try {
        const response = await fetch(`/api/docs/${docId}/archive`, {
            method: 'PUT',
            credentials: 'include', // Include cookies for session auth
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error
            throw new Error(errorData.error || 'Failed to archive document');
        }

        // Success: Remove card from UI and show temporary message
        cardElement.style.transition = 'opacity 0.3s ease-out';
        cardElement.style.opacity = '0';
        setTimeout(() => {
            cardElement.remove();
            // Check if list is now empty
            if (docsList.children.length === 0) {
                emptyState.textContent = 'No documents found.'; // Update empty state message
                emptyState.style.display = 'block';
            }
            // Optionally show a more persistent success message
            // For now, just log it
            console.log(`Document ${docId} archived successfully.`);
            // alert(`Document ${docId} archived!`); // Simple alert for now
        }, 300); // Wait for fade out

    } catch (error) {
        console.error('Archive error:', error);
        alert(`Failed to archive document: ${error.message}`);
    }
}

// Handle permanently deleting a document
async function handleDelete(docId, cardElement) {
    console.log(`Delete clicked for doc: ${docId}`);

    // Confirmation dialog
    if (!confirm(`Are you sure you want to permanently delete this document? This action cannot be undone.`)) {
        console.log('Delete cancelled by user.');
        return; // Stop if user cancels
    }

    console.log(`Proceeding with permanent deletion for doc: ${docId}`);
    try {
        const response = await fetch(`/api/docs/${docId}`, {
            method: 'DELETE',
            credentials: 'include', // Include cookies for session auth
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error
            throw new Error(errorData.error || 'Failed to delete document');
        }

        // Success: Remove card from UI and show temporary message
        cardElement.style.transition = 'opacity 0.3s ease-out';
        cardElement.style.opacity = '0';
        setTimeout(() => {
            cardElement.remove();
            // Check if list is now empty
            if (docsList.children.length === 0) {
                emptyState.textContent = 'No documents found.'; // Update empty state message
                emptyState.style.display = 'block';
            }
            // Optionally show a more persistent success message
            console.log(`Document ${docId} permanently deleted.`);
            // alert(`Document ${docId} permanently deleted!`); // Simple alert for now
        }, 300); // Wait for fade out

    } catch (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete document: ${error.message}`);
    }
}

// Initialize
async function init() {
    const documents = await fetchDocuments();
    renderDocumentList(documents);
    
    // Event listeners
    newDocButton.addEventListener('click', createNewDocument);
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
