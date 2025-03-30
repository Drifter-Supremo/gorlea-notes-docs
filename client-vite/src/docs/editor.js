// Import Tiptap
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

// Import styles
import '../styles/main.css'; // Import shared styles
import '../styles/docs.css'; // Import docs specific styles

console.log("Top level document:", document); // DEBUG: Check document object
console.log("editor.js loaded"); // Debug log

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    const titleInput = document.getElementById('doc-title');
    // const contentInput = document.getElementById('doc-content'); // Removed
    // const saveBtn = document.getElementById('save-btn'); // Removed
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const editorWrapper = document.getElementById('editor-content-wrapper'); // Get wrapper
    // const autosaveStatus = document.getElementById('autosave-status'); // Removed
    const homeButton = document.querySelector('.docs-home-button'); // Get home button

    // Hide editor initially
    if (editorWrapper) editorWrapper.classList.add('hidden'); // Add null check

    if (!docId) {
        showError('No document ID provided');
        return;
    }

    // --- Tiptap Editor Instance ---
    let editor = null; // To hold the Tiptap instance

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
        
        // Rename destructured variable to avoid shadowing global 'document'
        const { data: docData } = await response.json(); 
        console.log("Document data received:", docData); // Log received data

        if (!docData) {
            throw new Error("Document data is null or undefined after fetch.");
        }

        // Code to populate fields and show wrapper - moved back inside the try block
        if (titleInput) titleInput.value = docData.title || 'Untitled Document'; // Use docData
        // contentInput.value = docData.content || ''; // Removed

        // Initialize Tiptap Editor HERE, after fetching content
        const editorElement = document.getElementById('editor'); 
        if (editorElement) {
            editor = new Editor({
                element: editorElement,
                extensions: [
                    StarterKit, // Use the basic starter kit
                ],
                // Use fetched content, default to empty paragraph if null/undefined/empty string
                content: docData.content || '<p></p>', 
                onUpdate: ({ editor }) => {
                    // Trigger autosave on update
                    debouncedAutosave(); 
                },
            });
            console.log("Tiptap editor initialized.");
        } else {
             console.error("Editor element #editor not found!");
             showError("Failed to initialize text editor."); // Show error if element missing
        }
        
        // Show editor content, hide loading message
        if (loadingMessage) loadingMessage.style.display = 'none'; // Add null check
        if (errorMessage) errorMessage.classList.add('hidden'); // Add null check
        
        console.log("Attempting to show editor wrapper..."); // Log before showing wrapper
        if (editorWrapper) editorWrapper.classList.remove('hidden'); // Show the editor wrapper
        console.log("Editor wrapper should now be visible."); // Log after showing wrapper

    } catch (error) {
        console.error("Error during document fetch or processing:", error); // Log the full error in catch
        showError(error.message || "An unknown error occurred"); // Call the single, correctly placed showError
        // No need to disable inputs explicitly if they are hidden by the wrapper
    }

    // Manual Save handler removed

    // --- Autosave Implementation ---

    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Core autosave logic
    async function performAutosave() {
        if (!editor) {
            console.error("Autosave failed: Editor not initialized.");
            return;
        }
        // console.log("Autosave triggered..."); // Keep original trigger log if desired
        console.log('Autosave: Saving...'); // Replaced UI update
        // saveBtn.disabled = true; // Removed reference

        // Reuse title validation from manual save
        const title = titleInput ? titleInput.value.trim() : 'Untitled Document'; // Add null check
        const finalTitle = title === '' ? 'Untitled Document' : title;
        if (title === '' && titleInput) {
            titleInput.value = finalTitle; // Update input visually
        }

        // Get content from Tiptap
        const content = editor.getHTML(); // Get HTML content from Tiptap

        try {
            const response = await fetch(`/api/docs/${docId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Credentials': 'include' // Ensure credentials are sent if needed by session
                },
                body: JSON.stringify({
                    title: finalTitle,
                    content: content // Send Tiptap HTML content
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Autosave failed');
            }

            console.log('Autosave: All changes saved.'); // Replaced UI update
            // setTimeout removed

        } catch (error) {
            console.error('Autosave: Failed.', error); // Replaced UI update, log error object
            // Optionally make error more prominent or persistent
        } finally {
             // saveBtn.disabled = false; // Removed reference
        }
        // Return the promise in case save-on-exit needs to await it
        // (Implicitly returns promise from async function)
    }

    // Create debounced version
    const debouncedAutosave = debounce(performAutosave, 2000); // 2-second delay

    // Add input listeners 
    if (titleInput) titleInput.addEventListener('input', debouncedAutosave); // Keep title listener
    // Tiptap's onUpdate handles content changes, so no separate listener needed here

    // Add save-on-exit listener
    if (homeButton) { // Add null check
        homeButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent immediate navigation
            console.log("Home button clicked, triggering final save...");
            try {
                // Perform one final save immediately, await its completion
                await performAutosave(); 
            } catch (saveError) {
                console.error("Error during final save on exit:", saveError);
                // Decide if navigation should still happen despite error
                // Maybe ask user? For now, we'll navigate anyway.
            } finally {
                 // Navigate after save attempt is complete
                console.log("Navigating to /docs");
                window.location.href = homeButton.href;
            }
        });
    }

    // --- End Autosave Implementation ---


    // Define showError function ONCE, correctly placed
    function showError(message) {
        console.log(`Displaying error: ${message}`); // Log when showError is called (Added in previous step, kept here)
        if (loadingMessage) loadingMessage.style.display = 'none'; // Restore hiding loading message on error
        if (editorWrapper) editorWrapper.classList.add('hidden'); // Restore hiding editor on error
        if (errorMessage) {
            errorMessage.textContent = `Error: ${message}`;
            errorMessage.classList.remove('hidden');
        }
    }

    // --- Tiptap Initialization (Moved Down) ---
    // We need to wait for the DOMContentLoaded event AND the async fetch to complete
    // before initializing Tiptap with the fetched content.
    // The initialization logic will be added here later using imports.
    // For now, we just log that it's needed.
    if (document.readyState === 'complete' || document.readyState !== 'loading') {
        // If DOM is already loaded (might happen if fetch is very fast)
        // Initialize Tiptap here if needed, or rely on the fetch success block
    } else {
        // This listener might be redundant if fetch takes longer than DOM load
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Tiptap here if needed
        });
    }
    // Tiptap initialization is now handled within the main async flow after fetch

});
