// Import Tiptap
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline'; // Import Underline

// Import styles
import '../styles/main.css'; // Import shared styles
import '../styles/docs.css'; // Import docs specific styles
import '../styles/editor-enhancements.css'; // Import editor-specific enhancements

// API Base URL - Use relative paths by default
const apiBaseUrl = ''; // Set to empty string for relative paths

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

    // --- Tiptap Editor Instance & Toolbar Logic ---
    let editor = null; // To hold the Tiptap instance

    console.log(`Attempting to fetch document with ID: ${docId}`); // Log before fetch
    try {
        // Fetch document from Firestore via API
        const response = await fetch(`${apiBaseUrl}/api/docs/${docId}`, {
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
                    StarterKit,
                    Underline, // Add Underline extension
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
             return; // Stop execution if editor didn't initialize
        }

        // --- Toolbar Setup ---
        setupToolbar(editor); // Call function to setup toolbar listeners
        
        // Setup floating toolbar behavior when scrolling
        setupFloatingToolbar();

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
            const response = await fetch(`/api/docs/${docId}`, { // Use relative path
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

// --- Toolbar Setup Function ---
function setupToolbar(editor) {
    const toolbarButtons = {
        bold: document.getElementById('toolbar-bold'),
        italic: document.getElementById('toolbar-italic'),
        underline: document.getElementById('toolbar-underline'),
        strike: document.getElementById('toolbar-strike'),
        paragraph: document.getElementById('toolbar-paragraph'),
        h1: document.getElementById('toolbar-h1'),
        h2: document.getElementById('toolbar-h2'),
        h3: document.getElementById('toolbar-h3'),
        ul: document.getElementById('toolbar-ul'),
        ol: document.getElementById('toolbar-ol'),
        undo: document.getElementById('toolbar-undo'),
        redo: document.getElementById('toolbar-redo'),
    };

    // Add click listeners
    toolbarButtons.bold?.addEventListener('click', () => editor.chain().focus().toggleBold().run());
    toolbarButtons.italic?.addEventListener('click', () => editor.chain().focus().toggleItalic().run());
    toolbarButtons.underline?.addEventListener('click', () => editor.chain().focus().toggleUnderline().run());
    toolbarButtons.strike?.addEventListener('click', () => editor.chain().focus().toggleStrike().run());
    toolbarButtons.paragraph?.addEventListener('click', () => editor.chain().focus().setParagraph().run());
    toolbarButtons.h1?.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 1 }).run());
    toolbarButtons.h2?.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 2 }).run());
    toolbarButtons.h3?.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 3 }).run());
    toolbarButtons.ul?.addEventListener('click', () => editor.chain().focus().toggleBulletList().run());
    toolbarButtons.ol?.addEventListener('click', () => editor.chain().focus().toggleOrderedList().run());
    toolbarButtons.undo?.addEventListener('click', () => editor.chain().focus().undo().run());
    toolbarButtons.redo?.addEventListener('click', () => editor.chain().focus().redo().run());

    // Update button states on transaction
    editor.on('transaction', () => {
        toolbarButtons.bold?.classList.toggle('is-active', editor.isActive('bold'));
        toolbarButtons.italic?.classList.toggle('is-active', editor.isActive('italic'));
        toolbarButtons.underline?.classList.toggle('is-active', editor.isActive('underline'));
        toolbarButtons.strike?.classList.toggle('is-active', editor.isActive('strike'));
        toolbarButtons.paragraph?.classList.toggle('is-active', editor.isActive('paragraph'));
        toolbarButtons.h1?.classList.toggle('is-active', editor.isActive('heading', { level: 1 }));
        toolbarButtons.h2?.classList.toggle('is-active', editor.isActive('heading', { level: 2 }));
        toolbarButtons.h3?.classList.toggle('is-active', editor.isActive('heading', { level: 3 }));
        toolbarButtons.ul?.classList.toggle('is-active', editor.isActive('bulletList'));
        toolbarButtons.ol?.classList.toggle('is-active', editor.isActive('orderedList'));
        
        // Disable/enable undo/redo buttons
        if (toolbarButtons.undo) toolbarButtons.undo.disabled = !editor.can().undo();
        if (toolbarButtons.redo) toolbarButtons.redo.disabled = !editor.can().redo();
    });

     // Initial state update
     if (toolbarButtons.undo) toolbarButtons.undo.disabled = !editor.can().undo();
     if (toolbarButtons.redo) toolbarButtons.redo.disabled = !editor.can().redo();
}

// Function to setup floating toolbar that follows the scroll
function setupFloatingToolbar() {
    const toolbar = document.getElementById('editor-toolbar');
    const editorContainer = document.querySelector('.editor-container');
    const header = document.querySelector('.docs-header');
    
    if (!toolbar || !editorContainer || !header) {
        console.error("Missing required elements for floating toolbar");
        return;
    }
    
    // Make the toolbar fixed and positioned properly
    toolbar.style.position = 'sticky';
    toolbar.style.top = '10px';
    toolbar.style.zIndex = '1000';
    toolbar.style.marginBottom = '20px';
    
    // Make sure the toolbar has a proper width
    toolbar.style.width = 'calc(100% - 40px)';
    
    // Add a background that stands out when scrolling
    toolbar.style.backgroundColor = 'rgba(30, 30, 46, 0.95)';
    toolbar.style.backdropFilter = 'blur(10px)';
    
    // Add a transition effect for smooth visual changes when scrolling
    toolbar.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease';
    
    // Listen for scroll events to enhance the floating effect
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const headerHeight = header.offsetHeight;
        
        if (scrollY > headerHeight) {
            toolbar.classList.add('floating');
            toolbar.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            toolbar.style.borderColor = 'rgba(255, 215, 0, 0.2)';
        } else {
            toolbar.classList.remove('floating');
            toolbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            toolbar.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
    });
    
    // Add animation effect when toolbar buttons are clicked
    const toolbarButtons = toolbar.querySelectorAll('.toolbar-button');
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add a visual feedback effect
            this.classList.add('button-clicked');
            
            // Show ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('button-ripple');
            this.appendChild(ripple);
            
            // Remove effects after animation completes
            setTimeout(() => {
                this.classList.remove('button-clicked');
                ripple.remove();
            }, 500);
        });
    });
}
