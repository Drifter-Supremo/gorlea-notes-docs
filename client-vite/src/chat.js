// Import styles
import './styles/main.css';
import { marked } from 'marked'; // Import marked library

// API Base URL - Read from environment variable, fallback for local dev
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''; // Use empty string for relative paths locally or set to 'http://localhost:3000' if needed

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newChatButton = document.getElementById('newChatButton'); // Get the new button
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
let chatHistory = []; // Array to store chat messages for persistence

// --- Chat History Persistence ---
const CHAT_HISTORY_KEY = 'gorleaChatHistory';

function saveChatHistory() {
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    } catch (error) {
        console.error("Error saving chat history to localStorage:", error);
        // Optionally notify the user or handle the error
    }
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
            // Clear existing messages before loading history
            messagesContainer.innerHTML = ''; 
            // Render messages from history
            chatHistory.forEach(msg => {
                // Re-create message elements from stored data
                const messageElement = createMessage(msg.text, msg.isUser, false, msg.isError); // Don't mark as loading
                messagesContainer.appendChild(messageElement);
            });
            scrollToBottom();
            // Check if the welcome screen should be hidden based on loaded history
            if (chatHistory.length > 0 && welcomeScreen.style.display !== 'none') {
                 welcomeScreen.style.opacity = '0';
                 welcomeScreen.style.transform = 'translateY(-20px)';
                 setTimeout(() => {
                     welcomeScreen.style.display = 'none';
                 }, 300);
            }
        } catch (error) {
            console.error("Error loading chat history from localStorage:", error);
            chatHistory = []; // Reset history on error
            localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
        }
    }
}

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
        const response = await fetch(`${apiBaseUrl}/api/ai/create`, { // Updated
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
        const response = await fetch(`${apiBaseUrl}/api/ai/save`, { // Updated
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
        const response = await fetch(`${apiBaseUrl}/api/ai/rewrite`, { // Updated
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

// Create a new message element (Refined for typing effect)
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

    // Add a wrapper for the actual text content
    const textWrapper = document.createElement('div');
    textWrapper.className = 'text-content-wrapper'; // Use this class to target for typing/rendering

    // Render Markdown for Gorlea's messages, plain text for user's (Initial render)
    if (!isUser && !isLoading && !isError) {
        // Initial render uses Markdown parser
        const sanitizedHtml = marked.parse(text, { breaks: true });
        textWrapper.innerHTML = sanitizedHtml;
    } else {
        // For user messages, loading, or errors, just use text node
        textWrapper.appendChild(document.createTextNode(text));
    }

    contentDiv.appendChild(textWrapper); // Append the text wrapper to the main content div
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

// Add a new message to the chat and optionally save it
function addMessage(text, isUser = true, isLoading = false, isError = false) {
    // Remove existing last-message class
    const prevLast = messagesContainer.querySelector('.last-message');
    if (prevLast) prevLast.classList.remove('last-message');

    const messageElement = createMessage(text, isUser, isLoading, isError);
    messageElement.classList.add('last-message');
    messagesContainer.appendChild(messageElement);
    
    // Only save non-loading messages to history
    if (!isLoading) {
        chatHistory.push({ text, isUser, isError });
        saveChatHistory();
    }
    
    scrollToBottom();
    return messageElement; // Return the DOM element
}

// --- Block Reveal Effect Function (Restored) ---
function revealMessageBlocks(targetWrapper, fullHtml, delay = 250, callback) { // Slower delay
    // Create a temporary div to parse the HTML and get top-level blocks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml; // Parse the complete HTML
    const blocks = Array.from(tempDiv.childNodes); // Get direct children (p, ul, ol, etc.)

    targetWrapper.innerHTML = ''; // Clear the target wrapper initially
    targetWrapper.style.opacity = 1; // Ensure wrapper is visible

    let index = 0;

    function revealNextBlock() {
        if (index < blocks.length) {
            const block = blocks[index];
            // Clone the node to avoid issues if it's already attached elsewhere
            const blockClone = block.cloneNode(true); 
            
            // Add animation class only to element nodes
            if (blockClone.nodeType === Node.ELEMENT_NODE) { 
                 blockClone.classList.add('reveal-block');
            } else if (blockClone.nodeType === Node.TEXT_NODE && blockClone.textContent.trim() !== '') {
                // Wrap non-empty text nodes in a span for animation
                const span = document.createElement('span');
                span.textContent = blockClone.textContent;
                span.classList.add('reveal-block');
                targetWrapper.appendChild(span);
            } else {
                 // Append other node types (like comments) directly without animation
                 targetWrapper.appendChild(blockClone);
            }
            
            // Only append elements with the class if they were created
            if (blockClone.nodeType === Node.ELEMENT_NODE && blockClone.classList.contains('reveal-block')) {
                 targetWrapper.appendChild(blockClone);
             }


            // scrollToBottom(); // Don't scroll as each block is added
            index++;
            setTimeout(revealNextBlock, delay); // Schedule next block reveal
        } else {
            // All blocks revealed
            scrollToBottom(); // Scroll only once when all blocks are done
            if (callback) {
                callback(); // Execute original callback after scrolling
            }
        }
    }

    // Add a small initial delay before starting the first block reveal
    setTimeout(revealNextBlock, 50); 
}
// --- End Block Reveal Effect Function ---


// --- New Function: Fetch and Display Recent Docs ---
async function fetchAndDisplayRecentDocs() {
    const loadingMessage = addMessage('Fetching recent documents...', false, true);
    try {
        const response = await fetch(`${apiBaseUrl}/api/docs?limit=5`, { credentials: 'include' }); // Updated
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
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
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
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        scrollToBottom();
                      });
                    });
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
                const cleanedNoteMarkdown = await rewriteNote(text); // Get raw Markdown text from AI
                if(loadingMessage) messagesContainer.removeChild(loadingMessage);

                // --- Implement Block Reveal Effect ---
                // 1. Create the message structure with empty text content initially
                const gorleaMessageElement = createMessage('', false); // Pass empty string
                const textWrapperElement = gorleaMessageElement.querySelector('.text-content-wrapper'); // Target the wrapper

                // Add the initially empty message structure to the DOM
                messagesContainer.appendChild(gorleaMessageElement);
                // textWrapperElement.style.opacity = 0; // Opacity handled by animation class now
                scrollToBottom();

                // 2. Parse the final HTML immediately
                const finalHtml = marked.parse(cleanedNoteMarkdown, { breaks: true });

                // 3. Start the block reveal effect
                revealMessageBlocks(textWrapperElement, finalHtml, 250, () => { // Slower delay: 250ms
                    // 4. Callback executed AFTER reveal finishes:
                    
                    // Save the *original Markdown* to history AFTER reveal
                    chatHistory.push({ text: cleanedNoteMarkdown, isUser: false, isError: false });
                    saveChatHistory();

                    // Store the parsed HTML version for saving to the editor later
                    lastRewrittenNote = finalHtml; 

                    // Ask the follow-up question AFTER reveal is done
                    // Apply reveal effect to follow-up message too? Let's do it.
                    const followupMessageElement = createMessage('', false); // Create empty structure
                    const followupTextWrapper = followupMessageElement.querySelector('.text-content-wrapper');
                    messagesContainer.appendChild(followupMessageElement);
                    scrollToBottom();
                    const followupText = "Where would you like to save this note? (e.g., 'save to My Notes', 'create new doc called Project X', or 'show recent')";
                    revealMessageBlocks(followupTextWrapper, `<p>${followupText}</p>`, 100, () => { // Faster reveal for short prompt
                         // Save follow-up to history after it's revealed
                         chatHistory.push({ text: followupText, isUser: false, isError: false });
                         saveChatHistory();
                    });
                });
                // --- End Block Reveal Effect Implementation ---
                
                isFirstMessage = false;
                // Reset other states immediately after initiating the rewrite/reveal
                isAwaitingRecentChoice = false; 
                recentDocList = [];
                pendingDocTitle = null; 
                // Ask where to save - Handled within the revealMessageBlocks callback now
            } catch (error) {
                 if(loadingMessage) messagesContainer.removeChild(loadingMessage);
                 // Ensure error messages are also saved to history via addMessage
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

// --- New Chat Button Listener ---
newChatButton.addEventListener('click', () => {
    // Optional: Add confirmation dialog? For now, clear directly.
    // console.log('New Chat button clicked'); 
    
    // Clear localStorage
    localStorage.removeItem(CHAT_HISTORY_KEY);
    
    // Clear the in-memory history array
    chatHistory = [];
    
    // Clear the messages displayed on the screen
    messagesContainer.innerHTML = '';
    
    // Reset relevant states for a clean slate
    lastRewrittenNote = null;
    pendingDocTitle = null;
    isAwaitingRecentChoice = false;
    recentDocList = [];
    isFirstMessage = true; // Reset this if needed

    // Optionally show welcome screen again, or just clear input
    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset height
    // To show welcome screen again:
    // welcomeScreen.style.display = 'flex'; // Or 'block' depending on original display
    // welcomeScreen.style.opacity = '1';
    // welcomeScreen.style.transform = 'translateY(0)';

    // addMessage("Chat cleared. Ready for your next note!", false); // Remove confirmation message
});
// --- End New Chat Button Listener ---


// Initial load and scroll
loadChatHistory(); // Load history before initial scroll
scrollToBottom();
