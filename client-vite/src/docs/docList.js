// Import styles
import '../styles/main.css'; // Import shared styles
import '../styles/docs.css'; // Import docs specific styles
import '../styles/doclist-enhancements.css'; // Import document list enhancements

// API Base URL - Removed as we'll use relative paths
// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

/* DOM Elements - Defined at top level for global access */
const docList = document.getElementById('doc-list');
const noDocsMessage = document.getElementById('no-docs-message');
const newDocButton = document.querySelector('.new-doc-button');
const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('doc-search-input');
const noResultsMessage = document.getElementById('no-results-message');

let allDocuments = [];
let debounceTimer;

const hamburgerMenu = document.getElementById('hamburger-menu');
const mobileNav     = document.getElementById('mobile-nav');
if (hamburgerMenu) {
 hamburgerMenu.addEventListener('click', () =>
   document.body.classList.toggle('mobile-menu-open')
 );
 document.addEventListener('click', e => {
   if (document.body.classList.contains('mobile-menu-open') &&
       !mobileNav.contains(e.target) &&
       !hamburgerMenu.contains(e.target)) {
     document.body.classList.remove('mobile-menu-open');
   }
 });
}
// OPTIONAL mobile buttons
document.getElementById('mobile-newDoc')?.addEventListener('click', () => {
 document.body.classList.remove('mobile-menu-open');
 createNewDocument();
});
document.getElementById('mobile-home')?.addEventListener('click', () => {
 window.location.href = '/docs/index.html';
});
document.getElementById('mobile-logout')?.addEventListener('click', () => {
 document.body.classList.remove('mobile-menu-open');
 window.logoutUser();
});
const mobileUserEmailEl = document.getElementById('mobile-user-email');
if (mobileUserEmailEl) {
  mobileUserEmailEl.textContent =
    document.getElementById('user-email')?.textContent || '';
}

// Fetch documents from API
async function fetchDocuments() {
    // Removed loading state handling from here, will be managed in init
    try {
        const response = await fetch('/api/docs', { // Use relative path
            credentials: 'include', // Include cookies for session auth
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const { data } = await response.json();
        return data; // Return the fetched documents
    } catch (error) {
        console.error('Document fetch error:', error);
        // Re-throw the error to be caught by the caller (init function)
        throw error;
    }
}

// Create new document
async function createNewDocument() {
    try {
        newDocButton.disabled = true;
        newDocButton.innerHTML = 'Creating...';

        const response = await fetch('/api/docs', { // Use relative path
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
        // The editor path is relative to the current /docs/ path, so no change needed here
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
// (Old renderDocumentList function removed; replaced by renderDocuments)

/**
 * Highlight search matches in the given text.
 * @param {string} text
 * @param {string} query
 * @returns {string} HTML string with <span class="highlight">...</span> around matches
 */
function highlightMatches(text, query) {
    if (!query || !query.trim()) return text;
    // Escape regex special characters in query
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

/**
 * Filter allDocuments by query (case-insensitive, matches in title).
 * @param {string} query
 * @returns {Array}
 */
function filterDocuments(query) {
    if (!query || !query.trim()) return allDocuments;
    const q = query.trim().toLowerCase();
    return allDocuments.filter(doc => {
        const titleMatch = (doc.title || '').toLowerCase().includes(q);
        // Assuming doc.content exists and is a string. If not, this needs adjustment
        // based on how content is fetched/stored.
        const contentMatch = (doc.content || '').toLowerCase().includes(q);
        return titleMatch || contentMatch;
    });
}

/**
 * Renders the list of documents or a 'no results' message.
 * @param {Array} documents - The array of document objects to render.
 * @param {string} query - The current search query for highlighting.
 */
function renderDocuments(documents, query) {
    // Ensure DOM elements are accessible (might be better to pass them or ensure they are global)
    const docList = document.getElementById('doc-list');
    const noResultsMessage = document.getElementById('no-results-message');

    if (!docList || !noResultsMessage) {
        console.error("Required elements for rendering not found (#doc-list, #no-results-message).");
        return;
    }

    // Clear previous list content
    docList.innerHTML = '';

    if (documents.length === 0) {
        docList.style.display = 'none'; // Hide the list container
        if (query && query.trim()) {
            noResultsMessage.textContent = `No documents found matching "${query}".`;
            noResultsMessage.style.display = 'block'; // Show no results message
        } else {
            // If no query and no documents, the main 'noDocsMessage' should be shown by init()
            // We just ensure the 'no results' specific message is hidden here.
            noResultsMessage.style.display = 'none';
        }
    } else {
        docList.style.display = 'grid'; // Show the list container (using grid as per init)
        noResultsMessage.style.display = 'none'; // Hide no results message

        documents.forEach(doc => {
            const card = document.createElement('div');
            card.classList.add('doc-card');
            card.dataset.docId = doc.id; // Store doc ID for actions

            // Title with highlighting
            const titleHtml = highlightMatches(doc.title || 'Untitled Document', query);

            card.innerHTML = `
                <h3 class="doc-title">${titleHtml}</h3>
                <button class="action-button delete-button" title="Delete Permanently">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            `;

            // Add event listener for delete button
            card.querySelector('.delete-button').addEventListener('click', (e) => {
                e.stopPropagation();
                handleDelete(doc.id, card);
            });

            // Make the whole card clickable to edit (optional, can be removed if only buttons are desired)
            card.addEventListener('click', () => {
                 window.location.href = `editor.html?id=${doc.id}`;
            });


            docList.appendChild(card);
        });
    }
}
// Handle archiving a document
async function handleArchive(docId, cardElement) {
    console.log(`Archive clicked for doc: ${docId}`);
    try {
        const response = await fetch(`/api/docs/${docId}/archive`, { // Use relative path
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
            // Check if list is now empty using the correct elements
            const docList = document.getElementById('doc-list'); // Re-select in case needed
            const noDocsMessage = document.getElementById('no-docs-message');
            if (docList && noDocsMessage && docList.children.length === 0) {
                docList.style.display = 'none'; // Hide the list container
                noDocsMessage.style.display = 'block'; // Show the message
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
        const response = await fetch(`/api/docs/${docId}`, { // Use relative path
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
             // Check if list is now empty using the correct elements
            const docList = document.getElementById('doc-list'); // Re-select in case needed
            const noDocsMessage = document.getElementById('no-docs-message');
            if (docList && noDocsMessage && docList.children.length === 0) {
                docList.style.display = 'none'; // Hide the list container
                noDocsMessage.style.display = 'block'; // Show the message
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
    // Guard clause if essential elements aren't found
    if (!docList || !noDocsMessage || !newDocButton) {
        console.error("Essential DOM elements (#doc-list, #no-docs-message, .new-doc-button) not found.");
        return;
    }

    // Add event listener
    newDocButton.addEventListener('click', createNewDocument);

    // Initial state: hide list and message
    docList.style.display = 'none';
    noDocsMessage.style.display = 'none';
    if (noResultsMessage) noResultsMessage.style.display = 'none';

    try {
        const documents = await fetchDocuments();
        allDocuments = Array.isArray(documents) ? documents : [];

        if (allDocuments.length === 0) {
            // No documents: show message, hide list and search
            noDocsMessage.style.display = 'block';
            docList.style.display = 'none';
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            if (searchIcon) searchIcon.style.display = 'none';
            if (searchInput) searchInput.style.display = 'none';
        } else {
            // Documents exist: hide message, show list, render docs, show search
            noDocsMessage.style.display = 'none';
            docList.style.display = 'grid';
            if (searchIcon) searchIcon.style.display = '';
            if (searchInput) searchInput.style.display = '';
            renderDocuments(allDocuments, '');
        }
    } catch (error) {
        // Error fetching: log error, hide both list and message
        console.error("Initialization failed:", error);
        docList.style.display = 'none';
        noDocsMessage.style.display = 'none';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
    }

    // --- Search UI logic (desktop only) ---
    if (searchIcon && searchInput) {
        searchIcon.addEventListener('click', () => {
            searchInput.classList.toggle('search-active');
            if (searchInput.classList.contains('search-active')) {
                searchInput.style.display = 'inline-block';
                searchInput.focus();
            } else {
                searchInput.value = '';
                searchInput.style.display = 'none';
                renderDocuments(allDocuments, '');
            }
        });
        // Also allow keyboard activation for accessibility
        searchIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                searchIcon.click();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = searchInput.value;
                const filtered = filterDocuments(query);
                renderDocuments(filtered, query);
            }, 300);
        });
    }
}

// Start when DOM is loaded
// Ensure this runs only if we are on the correct page
if (document.getElementById('doc-list')) { // Check if the main list container exists
    document.addEventListener('DOMContentLoaded', init);
}

// Add loaded class on DOMContentLoaded for fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.querySelector('.docs-app');
    if (appContainer) {
        appContainer.classList.add('loaded');
    }
});
