// Import styles
import './styles/main.css';

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
    
    contentDiv.appendChild(document.createTextNode(text));
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
    
    try {
        console.log('Processing message:', text);
        console.log('Current state:', { lastRewrittenNote: !!lastRewrittenNote, pendingDocTitle });

        // --- Check for Explicit Creation Command FIRST ---
        const lowerText = text.toLowerCase();
        const matchedCreatePattern = createPatterns.find(pattern => lowerText.startsWith(pattern));

        if (matchedCreatePattern && lastRewrittenNote) {
            let extractedTitle = '';
            // Extract title if pattern allows for it (i.e., not just "create new doc")
            if (matchedCreatePattern !== "create new doc") {
                 extractedTitle = text.substring(matchedCreatePattern.length).trim();
            }
            
            const finalTitle = extractedTitle || 'Untitled Document'; // Default if no title extracted

            console.log(`Handling direct creation command. Matched: "${matchedCreatePattern}", Title: "${finalTitle}"`);
            loadingMessage = addMessage(`Creating new document "${finalTitle}"...`, false, true);
            
            try {
                // Directly call the create API endpoint
                const response = await fetch('/api/ai/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', 
                    body: JSON.stringify({ title: finalTitle, content: lastRewrittenNote })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API Create Doc Error Response:", errorData);
                    throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
                }
                
                const resultData = await response.json();
                
                if (!resultData.success || !resultData.data) {
                     console.error("API Create Doc Success Response but missing data:", resultData);
                     throw new Error('API response missing expected data.');
                }

                const result = resultData.data; 
                
                if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                addMessage(`I've created a new document "${result.title}" and saved your note!`, false); 
                lastRewrittenNote = null; 
                pendingDocTitle = null; 
            } catch (error) {
                console.error('Direct create doc error:', error); 
                if(loadingMessage) messagesContainer.removeChild(loadingMessage); 
                addMessage(`Sorry, I had trouble creating the document. Please try again. Error: ${error.message}`, false, false, true);
            }
            return; // Exit after handling explicit create command
        }

        // --- Check if this is a confirmation to create a new doc (from previous prompt) ---
        if (confirmPatterns.some(pattern => lowerText === pattern) && lastRewrittenNote && pendingDocTitle) {
            console.log('Handling confirmation to create doc:', pendingDocTitle); // Keep this flow
            loadingMessage = addMessage('Creating new document...', false, true); // Assign to existing variable
            
            try {
                 // Make a fetch call to the backend API endpoint
                const response = await fetch('/api/ai/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // Send session cookies if any
                    body: JSON.stringify({ title: pendingDocTitle, content: lastRewrittenNote })
                });

                if (!response.ok) {
                    // Handle failed API response
                    const errorData = await response.json().catch(() => ({})); // Try to get error details
                    console.error("API Create Doc Error Response:", errorData);
                    throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
                }
                
                const resultData = await response.json();
                
                if (!resultData.success || !resultData.data) {
                     console.error("API Create Doc Success Response but missing data:", resultData);
                     throw new Error('API response missing expected data.');
                }

                const result = resultData.data; // Extract the actual data part (e.g., { docId, title, action })
                
                messagesContainer.removeChild(loadingMessage);
                // Use the title returned by the API (might be defaulted)
                addMessage(`I've created a new document "${result.title}" and saved your note!`, false); 
                lastRewrittenNote = null; // Clear state
                pendingDocTitle = null; // Clear state
            } catch (error) {
                console.error('Create doc error (in confirmation block):', error); // Log specific error
                if(loadingMessage) messagesContainer.removeChild(loadingMessage); // Ensure loading removed on error
                addMessage(`Sorry, I had trouble creating the document. Please try again. Error: ${error.message}`, false, false, true); // Show error message
            }
            return; // Exit handleSubmit after handling confirmation
        }

        // Check if this is a save command
        const isSaveCommand = savePatterns.some(pattern => text.toLowerCase().includes(pattern));
        console.log('Is save command:', isSaveCommand, 'Patterns matched:', 
            savePatterns.filter(pattern => text.toLowerCase().includes(pattern)));
        
        if (isSaveCommand) {
            if (!lastRewrittenNote) {
                addMessage('Sorry, I don\'t have a note to save. Please write a note first.', false, false, true);
                return;
            }

            // --- Improved Doc Name Extraction ---
            const matchedPattern = savePatterns.find(pattern => text.toLowerCase().includes(pattern));
            let docName = ''; // Initialize docName

            if (matchedPattern) {
                const patternIndex = text.toLowerCase().indexOf(matchedPattern);
                if (patternIndex !== -1) {
                    // Extract the substring AFTER the matched pattern
                    docName = text.substring(patternIndex + matchedPattern.length).trim();
                    
                    // Basic cleanup: remove leading "called " or "named " if present, case-insensitive
                    if (docName.toLowerCase().startsWith('called ')) {
                        docName = docName.substring(7).trim();
                    } else if (docName.toLowerCase().startsWith('named ')) {
                         docName = docName.substring(6).trim();
                    }
                    // Optional: Remove leading "a new doc " - might be too aggressive? Let's skip for now.
                }
            }
            
            // If extraction failed or resulted in empty string, maybe default or error?
            // For now, let's proceed even if docName might be empty or incorrect, 
            // the backend search/confirmation will handle it.
            if (!docName) {
                 console.warn("Could not reliably extract document name from save command:", text);
                 // Decide how to handle this - maybe ask user to clarify?
                 // For now, let saveNote handle potentially empty/wrong docName
            }

            console.log('Matched pattern:', matchedPattern); // Keep logging
            console.log('Extracted doc name:', docName);
            
            // Show loading state
            loadingMessage = addMessage('Saving your note...', false, true); // Assign to existing variable
            
            try {
                const result = await saveNote(docName, lastRewrittenNote);
                messagesContainer.removeChild(loadingMessage);
                
                if (result.needsConfirmation) {
                    pendingDocTitle = result.suggestedTitle;
                    addMessage(`I couldn't find a document named "${result.suggestedTitle}". Would you like me to create a new one with this name?`, false);
                } else {
                    addMessage(`I've saved your note to "${result.title}"!`, false);
                    lastRewrittenNote = null; // Clear the stored note after saving
                    pendingDocTitle = null;
                }
            } catch (error) {
                messagesContainer.removeChild(loadingMessage);
                addMessage('Sorry, I had trouble saving your note. Please try again.', false, false, true);
            }
            return;
        }

        // Otherwise, treat as new note
        loadingMessage = addMessage('Processing your note...', false, true); // Assign to existing variable
        
        // Get AI response
        const cleanedNote = await rewriteNote(text);
        
        // Remove loading message and show response
        messagesContainer.removeChild(loadingMessage);
        addMessage(cleanedNote, false);
        
        // Store the rewritten note and update first message state
        lastRewrittenNote = cleanedNote;
        isFirstMessage = false;
    } catch (error) {
        // Remove loading message and show error
        if (loadingMessage) {
            messagesContainer.removeChild(loadingMessage);
        }
        addMessage('Sorry, I had trouble processing your note. Please try again.', false, false, true);
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
