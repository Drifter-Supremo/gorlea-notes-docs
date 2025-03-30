// Import styles
import './styles/main.css';

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcomeScreen');

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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

        // Check if this is a confirmation to create a new doc
        if (confirmPatterns.some(pattern => text.toLowerCase() === pattern) && lastRewrittenNote && pendingDocTitle) {
            console.log('Handling confirmation to create doc:', pendingDocTitle);
            loadingMessage = addMessage('Creating new document...', false, true); // Assign to existing variable
            
            try {
                const result = await createDoc(pendingDocTitle, lastRewrittenNote);
                messagesContainer.removeChild(loadingMessage);
                addMessage(`I've created a new document "${result.title}" and saved your note!`, false);
                lastRewrittenNote = null; // Clear the stored note after saving
                pendingDocTitle = null; // Clear the pending title
            } catch (error) {
                messagesContainer.removeChild(loadingMessage);
                addMessage('Sorry, I had trouble creating the document. Please try again.', false, false, true);
            }
            return;
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

            // Extract doc name by finding the first matching pattern and handling it appropriately
            const matchedPattern = savePatterns.find(pattern => text.toLowerCase().includes(pattern));
            let docName;
            
            if (matchedPattern.includes('to')) {
                // For patterns with 'to', extract everything after 'to'
                docName = text.toLowerCase().split('to').pop().trim();
            } else {
                // For patterns without 'to', extract everything after the pattern
                docName = text.toLowerCase().replace(matchedPattern, '').trim();
            }
            
            console.log('Matched pattern:', matchedPattern);
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
