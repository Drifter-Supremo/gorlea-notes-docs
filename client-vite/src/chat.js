// Import styles
import './styles/main.css';
import { marked } from 'marked'; // Import marked library

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatContainer = document.querySelector('.chat-container'); // Added reference to the scrollable container

// Save command patterns
const savePatterns = [
  // Basic patterns
  'save to',
  'save it to',
  'save this to',
  'save that to',
  
  // With yes/yeah variations
  'yeah save to',
  'yeah save it to',
  'yes save to',
  'yes save it to',
  'yep save to',
  'yep save it to',
  'yup save to',
  'yup save it to',
  
  // With please/ok
  'please save to',
  'please save it to',
  'ok save to',
  'ok save it to',
  
  // Just save it
  'save it',
  'save this',
  'save that',
  'yeah save it',
  'yes save it',
  'yep save it',
  'yup save it',
  'please save it',
  'ok save it'
];

const confirmPatterns = [
  'yes',
  'yeah',
  'yep',
  'yup',
  'ok',
  'sure',
  'please'
];

// Patterns indicating user wants to create a new document
const createPatterns = [
  "create new doc named",
  "create new doc called",
  "create a new doc called", // Added missing variation
  "start new doc called",
  "save to new doc called",
  "save to a new doc called",
  "create a note called", // Treat note/doc interchangeably for creation
  "save it to a new note called",
  "create new doc" // Handle case where user doesn't provide title initially
].map(p => p.toLowerCase()); // Ensure patterns are lowercase for matching


// Track state
let isFirstMessage = true;
let lastRewrittenNote = null;
let pendingDocTitle = null;
let isAwaitingRecentChoice = false; // New state: Are we waiting for user to pick from recent list?
let recentDocList = []; // New state: Store the fetched recent docs

// Command patterns for showing recent docs
const showRecentPatterns = [
    "show recent",
    "list recent",
    "show recent docs",
    "list recent docs",
    "recent docs"
].map(p => p.toLowerCase());

// API Integration
async function createDoc(title, content) {
    try {
        const response = await fetch('/api/ai/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) {
            throw new Error('Failed to create document');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Create doc error:', error);
        throw error;
    }
}

async function saveNote(docName, content) {
    try {
        const response = await fetch('/api/ai/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ docName, content })
        });

        if (!response.ok) {
            throw new Error('Failed to save note');
        }

        const data = await response.json();
        
        // If we need to create a new doc
        if (data.data.needsConfirmation) {
            return {
                needsConfirmation: true,
                suggestedTitle: data.data.suggestedTitle
            };
        }

        return data.data;
    } catch (error) {
        console.error('Save error:', error);
        throw error;
    }
}

async function rewriteNote(text) {
    try {
        const response = await fetch('/api/ai/rewrite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ note: text })
        });

        if (!response.ok) {
            throw new Error('Failed to process note');
        }

        const data = await response.json();
        return data.data.cleaned;
    } catch (error) {
        console.error('Note processing error:', error);
        throw error;
    }
}

// Hide welcome screen when user starts typing
messageInput.addEventListener('input', () => {
    if (welcomeScreen.style.opacity !== '0') {
        welcomeScreen.style.opacity = '0';
        welcomeScreen.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
        }, 300);
    }
    autoExpandTextarea();
});

// Auto-expand textarea as user types
function autoExpandTextarea() {
    // Reset height to auto to accurately calculate scroll height
    messageInput.style.height = 'auto';
    
    // Set new height based on scroll height
    const newHeight = Math.min(messageInput.scrollHeight, 150); // Max height: 150px
    messageInput.style.height = newHeight + 'px';
}

// Create a new message element
function createMessage(text, isUser = true, isLoading = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'gorlea-message'}`;
    if (isLoading) messageDiv.className += ' loading';
    if (isError) messageDiv.className += ' error';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (!isUser) {
        // Add Gorlea header for AI messages
        const headerDiv = document.createElement('div');
        headerDiv.className = 'gorlea-header';
        headerDiv.innerHTML = `
            <img src="gorlea-logo.png" alt="Gorlea" class="message-logo">
            <span>Gorlea</span>
        `;
        contentDiv.appendChild(headerDiv);
    }
    
    // Render Markdown for Gorlea's messages, plain text for user's
    if (!isUser && !isLoading && !isError) { 
        // Basic sanitization (consider a more robust sanitizer if needed)
        const sanitizedHtml = marked.parse(text, { breaks: true }); // breaks: true converts newlines to <br>
        contentDiv.innerHTML = sanitizedHtml; 
    } else {
        // For user messages, loading, or errors, just use text node
        contentDiv.appendChild(document.createTextNode(text));
    }
    
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

// Add a new message to the chat
function addMessage(text, isUser = true, isLoading = false, isError = false) {
    const message = createMessage(text, isUser, isLoading, isError);
    messagesContainer.appendChild(message);
    scrollToBottom();
    return message;
}

// --- New Function: Fetch and Display Recent Docs ---
async function fetchAndDisplayRecentDocs() {
    const loadingMessage = addMessage('Fetching recent documents...', false, true);
    try {
        const response = await fetch('/api/docs?limit=5', { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const result = await response.json();
        if (!result.data || result.data.length === 0) {
            addMessage('You don\'t seem to have any documents yet.', false);
            recentDocList = []; // Clear list
        } else {
            recentDocList = result.data; // Store the fetched docs
            let messageText = "Here are your 5 most recently used documents:\n";
            recentDocList.forEach((doc, index) => {
                // Ensure title exists and is not empty before displaying
                const displayTitle = doc.title && doc.title.trim() !== '' ? doc.title.trim() : 'Untitled Document';
                messageText += `${index + 1}. ${displayTitle}\n`; 
            });
            messageText += "\nPlease reply with the number (1-5) to save, or type 'create new doc' or provide a different name.";
            addMessage(messageText, false);
            isAwaitingRecentChoice = true; // Set state to wait for user's numeric choice
        }
    } catch (error) {
        console.error('Error fetching recent documents:', error);
        addMessage('Sorry, I had trouble fetching your recent documents. Please try saving by name or creating a new one.', false, false, true);
        isAwaitingRecentChoice = false; // Reset state on error
        recentDocList = [];
    } finally {
        if (loadingMessage) messagesContainer.removeChild(loadingMessage);
    }
}

// Scroll chat to bottom
function scrollToBottom() {
    // Defer scroll slightly to allow DOM to update heights
    setTimeout(() => {
        // Target the chatContainer for scrolling, not the messagesContainer itself
        if (chatContainer) { 
             chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, 0); 
}

// Handle message submission
async function handleSubmit() {
    let loadingMessage = null; // Declare loadingMessage here, initialized to null
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Add user message
    addMessage(text, true);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // --- Restructured Logic using if/else if ---
    try {
        console.log('Processing message:', text);
        const lowerText = text.toLowerCase();
        console.log('Current state:', { 
            lastRewrittenNote: !!lastRewrittenNote, 
            pendingDocTitle, 
            isAwaitingRecentChoice 
        });

        // --- Priority 1: Handle Explicit Create Command ---
        
        // Use Regex to find matching create pattern (Removed temporary debug code)
        let matchedCreatePattern = null; 
        for (const pattern of createPatterns) {
            const trimmedPattern = pattern.trim();
            // Create a regex that matches the pattern at the beginning (^) of the string
            const regex = new RegExp('^' + trimmedPattern, 'i'); // 'i' for case-insensitive (though lowerText is already lowercase)
            if (regex.test(lowerText)) {
                matchedCreatePattern = pattern; // Store the original pattern from the array
                console.log(`DEBUG: Regex matched pattern: "${trimmedPattern}"`);
                break; // Stop after finding the first match
            }
        }
        
        if (matchedCreatePattern) {
            // Log the matched pattern (it's already trimmed from the loop)
            console.log(`Intent: Explicit Create. Matched: "${matchedCreatePattern}"`); 
            if (!lastRewrittenNote) {
                addMessage('Please provide a note first before creating a document with it.', false, false, true);
            } else {
                let extractedTitle = '';
                if (matchedCreatePattern !== "create new doc") {
                    extractedTitle = text.substring(matchedCreatePattern.length).trim();
                }
                const finalTitle = extractedTitle || 'Untitled Document';
                
                loadingMessage = addMessage(`Creating new document "${finalTitle}"...`, false, true);
                try {
                    const result = await createDoc(finalTitle, lastRewrittenNote); // Use API function
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                    addMessage(`I've created a new document "${result.title}" and saved your note!`, false); 
                    lastRewrittenNote = null; 
                    pendingDocTitle = null; 
                    isAwaitingRecentChoice = false; // Reset state
                    recentDocList = [];
                    return; // <<< ADD THIS RETURN STATEMENT >>>
                } catch (error) {
                    console.error('Direct create doc error:', error); 
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage); 
                    addMessage(`Sorry, I had trouble creating the document. Please try again. Error: ${error.message}`, false, false, true);
                }
            }
        
        // --- Priority 2: Handle Numeric Choice for Recent Docs ---
        } else if (isAwaitingRecentChoice && /^[1-5]$/.test(text)) {
            console.log(`Intent: Recent Doc Choice. Choice: ${text}`);
            if (!lastRewrittenNote) {
                 addMessage('Hmm, I seem to have lost the note. Please try again.', false, false, true);
                 isAwaitingRecentChoice = false; // Reset state
                 recentDocList = [];
            } else {
                const choiceIndex = parseInt(text, 10) - 1;
                if (choiceIndex >= 0 && choiceIndex < recentDocList.length) {
                    const chosenDoc = recentDocList[choiceIndex];
                    const chosenTitle = chosenDoc.title; 
                    loadingMessage = addMessage(`Saving note to "${chosenTitle}"...`, false, true);
                    try {
                        const result = await saveNote(chosenTitle, lastRewrittenNote); 
                        if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                        if (result.needsConfirmation) { 
                            console.error("Unexpected 'needsConfirmation' after selecting recent doc.");
                            addMessage(`Hmm, something unexpected happened trying to save to "${chosenTitle}". Please try again.`, false, false, true);
                        } else {
                            addMessage(`I've saved your note to "${result.title}"!`, false);
                            lastRewrittenNote = null; // Clear note state
                        }
                    } catch (error) {
                        console.error('Error saving note after recent choice:', error);
                        if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                        addMessage(`Sorry, I had trouble saving your note to "${chosenTitle}". Please try again. Error: ${error.message}`, false, false, true);
                    } finally {
                        isAwaitingRecentChoice = false; // Reset state
                        recentDocList = [];
                        pendingDocTitle = null; 
                    }
                } else {
                    addMessage("That wasn't a valid choice. Please enter a number from 1 to 5, or type 'create new doc'.", false, false, true);
                    // Keep isAwaitingRecentChoice = true
                }
            }

        // --- Priority 3: Handle Confirmation to Create (after 'not found') ---
        } else if (confirmPatterns.some(pattern => lowerText === pattern) && pendingDocTitle) {
            console.log(`Intent: Confirm Create. Title: ${pendingDocTitle}`);
             if (!lastRewrittenNote) {
                 addMessage('Hmm, I seem to have lost the note to save. Please try again.', false, false, true);
                 pendingDocTitle = null; // Reset state
                 isAwaitingRecentChoice = false;
                 recentDocList = [];
             } else {
                isAwaitingRecentChoice = false; // Reset recent choice state
                recentDocList = [];
                loadingMessage = addMessage('Creating new document...', false, true); 
                try {
                    const result = await createDoc(pendingDocTitle, lastRewrittenNote); // Use API function
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                    addMessage(`I've created a new document "${result.title}" and saved your note!`, false); 
                    lastRewrittenNote = null; // Clear state
                    pendingDocTitle = null; 
                } catch (error) {
                    console.error('Create doc error (in confirmation block):', error); 
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage); 
                    addMessage(`Sorry, I had trouble creating the document. Please try again. Error: ${error.message}`, false, false, true);
                }
             }

        // --- Priority 4: Handle Request to Show Recent Docs ---
        } else if (showRecentPatterns.some(pattern => lowerText === pattern)) {
             console.log('Intent: Show Recent Docs.');
             if (!lastRewrittenNote) {
                 addMessage('Please provide a note first before asking for recent docs to save to.', false, false, true);
             } else {
                isAwaitingRecentChoice = false; // Reset just in case
                recentDocList = [];
                pendingDocTitle = null; // Clear any pending creation title
                await fetchAndDisplayRecentDocs(); // Fetch and show the list
             }

        // --- Priority 5: Handle General Save Command ---
        } else if (savePatterns.some(pattern => lowerText.includes(pattern))) {
            console.log('Intent: Save Command.');
            if (!lastRewrittenNote) {
                addMessage('Sorry, I don\'t have a note to save. Please write a note first.', false, false, true);
            } else {
                // --- Doc Name Extraction (same as before) ---
                const matchedPattern = savePatterns.find(pattern => text.toLowerCase().includes(pattern));
                let docName = ''; 
                if (matchedPattern) {
                    const patternIndex = text.toLowerCase().indexOf(matchedPattern);
                    if (patternIndex !== -1) {
                        docName = text.substring(patternIndex + matchedPattern.length).trim();
                        if (docName.toLowerCase().startsWith('called ')) {
                            docName = docName.substring(7).trim();
                        } else if (docName.toLowerCase().startsWith('named ')) {
                            docName = docName.substring(6).trim();
                        }
                    }
                }
                if (!docName) {
                    console.warn("Could not reliably extract document name from save command:", text);
                }
                console.log('Extracted doc name:', docName);
                
                loadingMessage = addMessage('Saving your note...', false, true); 
                try {
                    const result = await saveNote(docName, lastRewrittenNote);
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                    
                    if (result.needsConfirmation) {
                        pendingDocTitle = result.suggestedTitle;
                        addMessage(`I couldn't find a document named "${result.suggestedTitle}". Would you like me to create a new one with this name? (Or type 'show recent' to see recent documents)`, false); 
                        isAwaitingRecentChoice = false; 
                        recentDocList = [];
                    } else {
                        addMessage(`I've saved your note to "${result.title}"!`, false);
                        lastRewrittenNote = null; 
                        pendingDocTitle = null;
                        isAwaitingRecentChoice = false; 
                        recentDocList = [];
                    }
                } catch (error) {
                    isAwaitingRecentChoice = false; // Reset state on error
                    recentDocList = [];
                    pendingDocTitle = null;
                    if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                    addMessage('Sorry, I had trouble saving your note. Please try again.', false, false, true);
                }
            }

        // --- Default: Treat as a new note to rewrite ---
        } else {
            console.log('Intent: Rewrite Note (Default).');
            loadingMessage = addMessage('Processing your note...', false, true); 
            try {
                const cleanedNoteMarkdown = await rewriteNote(text); // Get Markdown from AI
                if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                
                // Display the formatted message (createMessage will handle parsing)
                addMessage(cleanedNoteMarkdown, false); 
                
                // Store the HTML version for saving to the editor later
                lastRewrittenNote = marked.parse(cleanedNoteMarkdown, { breaks: true }); 
                
                isFirstMessage = false;
                // Reset other states
                isAwaitingRecentChoice = false; 
                recentDocList = [];
                pendingDocTitle = null; 
                // Ask where to save
                addMessage("Where would you like to save this note? (e.g., 'save to My Notes', 'create new doc called Project X', or 'show recent')", false);
            } catch (error) {
                 if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                 addMessage('Sorry, I had trouble processing your note. Please try again.', false, false, true);
                 // Don't clear lastRewrittenNote here, maybe the rewrite failed but the original text is still valid? Or clear it? Let's clear it for safety.
                 lastRewrittenNote = null;
                 isAwaitingRecentChoice = false; 
                 recentDocList = [];
                 pendingDocTitle = null; 
            }
        }

    } catch (error) {
        // General catch block for unexpected errors in the try block itself
        console.error("Unexpected error in handleSubmit:", error);
        // Reset state on any major error
        isAwaitingRecentChoice = false;
        recentDocList = [];
        pendingDocTitle = null;
        lastRewrittenNote = null; // Clear note state too
        if (loadingMessage) {
            messagesContainer.removeChild(loadingMessage);
        }
        addMessage('Sorry, something went wrong. Please try again.', false, false, true);
    }
}

// Event Listeners
messageInput.addEventListener('input', autoExpandTextarea);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
});

sendButton.addEventListener('click', handleSubmit);

// Initial scroll to bottom
scrollToBottom();
