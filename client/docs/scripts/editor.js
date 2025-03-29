console.log("editor.js loaded"); // Debug log

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    const titleInput = document.getElementById('doc-title');
    const contentInput = document.getElementById('doc-content');
    const saveBtn = document.getElementById('save-btn');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const editorWrapper = document.getElementById('editor-content-wrapper'); // Get wrapper

    // Hide editor initially
    editorWrapper.classList.add('hidden');

    if (!docId) {
        showError('No document ID provided');
        return;
    }

    console.log(`Attempting to fetch document with ID: ${docId}`); // Log before fetch
    try {
        // Fetch document from Firestore via API
        const response = await fetch(`/api/docs/${docId}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Fetch response status: ${response.status}, ok: ${response.ok}`); // Log response status

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || JSON.stringify(errorData) || errorMsg;
            } catch (jsonError) {
                console.error("Could not parse error JSON:", jsonError);
                // Use the basic HTTP error message
            }
            throw new Error(errorMsg);
        } // End of if (!response.ok)
        
        const { data: document } = await response.json();
        console.log("Document data received:", document); // Log received data

        if (!document) {
            throw new Error("Document data is null or undefined after fetch.");
        }

        // Code to populate fields and show wrapper - moved back inside the try block
        titleInput.value = document.title || 'Untitled Document';
        contentInput.value = document.content || '';
        
        // Show editor content, hide loading message
        loadingMessage.style.display = 'none';
        errorMessage.classList.add('hidden');
        
        console.log("Attempting to show editor wrapper..."); // Log before showing wrapper
        editorWrapper.classList.remove('hidden'); // Show the editor wrapper
        console.log("Editor wrapper should now be visible."); // Log after showing wrapper

    } catch (error) {
        console.error("Error during document fetch or processing:", error); // Log the full error in catch
        showError(error.message || "An unknown error occurred"); // Call the single, correctly placed showError
        // No need to disable inputs explicitly if they are hidden by the wrapper
    }

    // Save handler
    saveBtn.addEventListener('click', async () => {
        // Frontend Title Validation
        const title = titleInput.value.trim();
        const finalTitle = title === '' ? 'Untitled Document' : title;
        // Update the input field visually as well
        if (title === '') {
            titleInput.value = finalTitle;
        }

        try {
            const response = await fetch(`/api/docs/${docId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: finalTitle, // Send validated title
                    content: contentInput.value
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save document');
            }
            // Optionally provide better feedback than alert
            saveBtn.textContent = 'Saved!';
            setTimeout(() => { saveBtn.textContent = 'Save'; }, 2000); 
        } catch (error) {
            // Show error near save button or use a more prominent notification
            alert(`Save failed: ${error.message}`); 
        }
    });

    // Define showError function ONCE, correctly placed
    function showError(message) {
        console.log(`Displaying error: ${message}`); // Log when showError is called (Added in previous step, kept here)
        loadingMessage.style.display = 'none'; // Restore hiding loading message on error
        editorWrapper.classList.add('hidden'); // Restore hiding editor on error
        errorMessage.textContent = `Error: ${message}`;
        errorMessage.classList.remove('hidden');
    }
});
