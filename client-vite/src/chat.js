import './styles/main.css';
import { marked } from 'marked'; // Import marked library

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newChatButton = document.getElementById('newChatButton');
const messagesContainer = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatContainer = document.querySelector('.chat-container');

// User info and chat history key
let currentUserId = null;
let chatHistoryKey = null;

// Fetch current user info on load
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user/me', { credentials: 'include' });
        if (!response.ok) throw new Error('Not logged in');
        const data = await response.json();
        if (data && data.id) {
            currentUserId = data.id;
            chatHistoryKey = `gorleaChatHistory_${currentUserId}`;
        } else {
            currentUserId = null;
            chatHistoryKey = null;
        }
    } catch (error) {
        console.warn('No user logged in or failed to fetch user info:', error);
        currentUserId = null;
        chatHistoryKey = null;
    }
}

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

const createPatterns = [
  "create new doc named",
  "create new doc called",
  "create a new doc called", // Added missing variation
  "create a doc called", // Added to fix misinterpretation
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
let isAwaitingRecentChoice = false;
let recentDocList = [];
let chatHistory = [];

// Chat History Persistence (user-specific)
function saveChatHistory() {
    if (!chatHistoryKey) return;
    try {
        localStorage.setItem(chatHistoryKey, JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

function loadChatHistory() {
    if (!chatHistoryKey) {
        chatHistory = [];
        messagesContainer.innerHTML = '';
        return;
    }
    const saved = localStorage.getItem(chatHistoryKey);
    if (saved) {
        try {
            chatHistory = JSON.parse(saved);
            messagesContainer.innerHTML = '';
            chatHistory.forEach(msg => {
                const el = createMessage(msg.text, msg.isUser, false, msg.isError);
                messagesContainer.appendChild(el);
            });
            scrollToBottom();
            if (chatHistory.length > 0 && welcomeScreen.style.display !== 'none') {
                welcomeScreen.style.opacity = '0';
                welcomeScreen.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                }, 300);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            chatHistory = [];
            localStorage.removeItem(chatHistoryKey);
        }
    } else {
        chatHistory = [];
        messagesContainer.innerHTML = '';
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
    } finally {
        // Added empty finally block to potentially resolve linter issue
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

// Scroll into view on mobile when keyboard appears (Listener removed - CSS handles this now)

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
        const response = await fetch('/api/docs?limit=5', { credentials: 'include' }); // Use relative path
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

// --- Helper function to clear chat state ---
function clearChatState() {
    if (chatHistoryKey) {
        localStorage.removeItem(chatHistoryKey);
    }
    chatHistory = [];
    messagesContainer.innerHTML = '';
    lastRewrittenNote = null;
    pendingDocTitle = null;
    isAwaitingRecentChoice = false;
    recentDocList = [];
    isFirstMessage = true;
    messageInput.value = '';
    messageInput.style.height = 'auto';
    // Ensure welcome screen is shown if no history
    if (chatHistory.length === 0) {
        welcomeScreen.style.display = 'flex'; // Or 'block', depending on original style
        welcomeScreen.style.opacity = '1';
        welcomeScreen.style.transform = 'translateY(0)';
    }
    scrollToBottom(); // Scroll after clearing
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

// Desktop New Chat Button
newChatButton.addEventListener('click', clearChatState);

// On load: fetch user info, then load chat history
(async () => {
    await fetchCurrentUser();
    loadChatHistory();
    scrollToBottom();
})();

// Add loaded class on DOMContentLoaded for fade-in effect
// Also add mobile menu logic here
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.querySelector('.app');
    if (appContainer) {
        appContainer.classList.add('loaded');
    }

    // --- Mobile Menu Toggle Logic ---
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileNav = document.getElementById('mobile-nav'); // Added reference for mobile nav panel
    const mobileNewChatButton = document.getElementById('mobile-newChatButton');
    const mobileLogoutButton = document.getElementById('mobile-logout-button'); // Assuming this ID exists

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            document.body.classList.toggle('mobile-menu-open');
        });
    }

    // Mobile New Chat Button (closes menu and clears state)
    if (mobileNewChatButton) {
        mobileNewChatButton.addEventListener('click', () => {
            document.body.classList.remove('mobile-menu-open'); // Close menu
            clearChatState(); // Clear chat state
        });
    }

    // Mobile Logout Button (closes menu and redirects - adjust action as needed)
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', async () => {
            document.body.classList.remove('mobile-menu-open'); // Close menu
            // Perform logout action (e.g., call API endpoint, redirect)
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (error) {
                console.error('Logout failed:', error);
            } finally {
                // Redirect to login page regardless of API call success/failure
                window.location.href = '/login.html';
            }
        });
    }
    // --- End Mobile Menu Toggle Logic ---

    // --- Visual Viewport API for Mobile Keyboard ---
    // Note: chatContainer is defined globally
    const inputArea = document.querySelector('.input-area'); // Get reference

    function handleViewportResize() {
        // Ensure elements and visualViewport exist
        if (!window.visualViewport || !inputArea || !chatContainer) {
            console.warn('VisualViewport handler: Missing required elements or API.');
            return;
        }

        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        // Calculate the difference, ensuring it's not negative
        const offset = Math.max(0, windowHeight - viewportHeight);

        // Apply styles only if the keyboard is likely visible (offset is significant)
        if (offset > 50) { // Threshold to detect keyboard
            // Apply styles to lift the input area above the keyboard
            inputArea.style.bottom = offset + 'px';

            // Adjust chat container padding to prevent overlap
            // Use a base padding value (adjust '16' if your default padding is different)
            const basePadding = 16; // Example: corresponds to 1rem if base font-size is 16px
            chatContainer.style.paddingBottom = (inputArea.offsetHeight + offset + basePadding) + 'px';

            // Scroll to bottom after styles are applied (use rAF for smoother updates)
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        } else {
            // Reset styles when keyboard is hidden
            inputArea.style.bottom = '0px';
            chatContainer.style.paddingBottom = ''; // Reset to default (removes inline style)
        }
    }

    if (window.visualViewport && inputArea && chatContainer) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        // Optional: Call handler once initially in case keyboard is already open on load.
        // Be cautious, this might cause a layout shift on desktop if not handled carefully.
        // handleViewportResize();
    }

    // Handle orientation changes as well, as they affect the viewport
    window.addEventListener('orientationchange', () => {
        // Delay slightly to allow viewport dimensions to stabilize after rotation
        setTimeout(handleViewportResize, 100);
    });
    // --- End Visual Viewport API Logic ---

    // --- Click Outside to Close Mobile Menu ---
    document.addEventListener('click', (event) => {
        // Check if the menu is open, if the click is outside the nav,
        // and if the click wasn't on the hamburger button itself or its children.
        const mobileNav = document.getElementById('mobile-nav'); // Ensure mobileNav is accessible here
        const hamburgerMenu = document.getElementById('hamburger-menu'); // Ensure hamburgerMenu is accessible here
        if (document.body.classList.contains('mobile-menu-open') &&
            mobileNav && !mobileNav.contains(event.target) &&
            hamburgerMenu && !hamburgerMenu.contains(event.target) && event.target !== hamburgerMenu) {
            document.body.classList.remove('mobile-menu-open');
        }
    });
    // --- End Click Outside Logic ---

});
