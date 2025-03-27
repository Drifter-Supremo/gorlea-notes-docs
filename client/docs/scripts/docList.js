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
        newDocButton.disabled = false;
        newDocButton.innerHTML = '<span>+</span> New Document';
        alert('Failed to create document. Please try again.');
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

        docCard.innerHTML = `
            <div class="doc-content">
                <div class="doc-title">${doc.title || 'Untitled Document'}</div>
            </div>
            <div class="doc-arrow">→</div>
        `;
        docCard.addEventListener('click', () => {
            window.location.href = `editor.html?id=${doc.id}`;
        });
        docsList.appendChild(docCard);
    });
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
