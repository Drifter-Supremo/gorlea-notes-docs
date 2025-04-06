import './styles/main.css';

// API Base URL - Removed as we'll use relative paths
// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// DOM Elements
const docListContainer = document.getElementById('docList');
const newDocButton = document.getElementById('newDocButton');
const logoutButton = document.getElementById('logoutButton'); // Added logout button reference

// Function to fetch documents
async function fetchDocuments() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/docs`, { // Updated
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Send cookies
        });

        if (response.status === 401) {
            // Unauthorized, redirect to login
            window.location.href = '/auth.html'; // Redirect to auth page
            return; // Stop further execution
        }

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const result = await response.json();
        displayDocuments(result.data);
    } catch (error) {
        console.error('Fetch documents error:', error);
        docListContainer.innerHTML = '<p class="error-message">Error loading documents. Please try again later.</p>';
    }
}

// Function to display documents
function displayDocuments(documents) {
    docListContainer.innerHTML = ''; // Clear previous list

    if (!documents || documents.length === 0) {
        docListContainer.innerHTML = '<p>✨ No documents yet. Create your first document!</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'doc-list'; // Add class for styling

    documents.forEach(doc => {
        const li = document.createElement('li');
        li.className = 'doc-list-item'; // Add class for styling

        const link = document.createElement('a');
        link.href = `/editor.html?docId=${doc.id}`; // Link to editor page with docId
        link.textContent = doc.title || 'Untitled Document'; // Use title or fallback
        link.className = 'doc-link'; // Add class for styling

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button'; // Add class for styling
        deleteButton.onclick = (event) => {
            event.preventDefault(); // Prevent link navigation
            event.stopPropagation(); // Stop event bubbling
            handleDelete(doc.id, li); // Pass li element to remove on success
        };

        li.appendChild(link);
        li.appendChild(deleteButton);
        ul.appendChild(li);
    });

    docListContainer.appendChild(ul);
}

// Function to handle document deletion
async function handleDelete(docId, listItemElement) {
    // Optional: Add confirmation dialog
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }

    try {
        const response = await fetch(`/api/docs/${docId}`, { // Use relative path
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Send cookies
        });

        if (response.status === 401) {
            window.location.href = '/auth.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }

        // Remove the list item from the DOM on successful deletion
        listItemElement.remove();

        // Optional: Check if the list is now empty and display the message
        if (docListContainer.querySelector('ul') && docListContainer.querySelector('ul').children.length === 0) {
             docListContainer.innerHTML = '<p>✨ No documents yet. Create your first document!</p>';
        }

        // Optional: Show success message (e.g., using a temporary notification)
        console.log('Document deleted successfully');


    } catch (error) {
        console.error('Delete document error:', error);
        // Optional: Show error message to the user
        alert('Error deleting document. Please try again.');
    }
}


// Function to handle logout
async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', { // Use relative path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            // Even if logout fails on the server, clear client-side state and redirect
            console.error('Logout failed on server, but redirecting anyway.');
        }

        // Redirect to login page after logout attempt
        window.location.href = '/auth.html';

    } catch (error) {
        console.error('Logout error:', error);
        // Redirect even if there's a network error during logout
        window.location.href = '/auth.html';
    }
}


// Event Listener for New Document Button
newDocButton.addEventListener('click', () => {
    window.location.href = '/editor.html'; // Redirect to editor page without docId
});

// Event Listener for Logout Button
logoutButton.addEventListener('click', handleLogout); // Added logout listener


// Initial fetch
fetchDocuments();
