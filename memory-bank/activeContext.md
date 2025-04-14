# 🎯 Active Context: Gorlea Notes & Docs

## Current Sprint Focus
Production Testing & Refinement (Railway) - Mostly Complete
- Core functionality (Auth, Docs CRUD, AI Features) verified in production.
- Minor remaining tests (Direct Editor Link).

## Active Decisions

### 1. Framework Selection
- **Decision**: Starting with vanilla HTML/CSS/JS
- **Rationale**: 
  - Simpler initial implementation
  - Faster MVP development
  - Can migrate to React later if needed
- **Status**: Confirmed
- **Impact**: Affects initial project structure and development approach

### 2. Backend Architecture
- **Decision**: Express.js server with Firestore
- **Rationale**:
  - More direct control over implementation
  - Simpler local development
  - Better for learning/understanding the flow
  - Native Firebase integration
- **Status**: Implemented
- **Impact**: Backend structure and storage approach established

### 3. AI Provider
- **Decision**: Gemini 2.0 Flash
- **Rationale**:
  - Latest model with enhanced performance
  - Optimized for real-time interactions
  - Cost-effective for MVP
- **Status**: Implemented
- **Impact**: Successfully handling note rewriting with good results (Confirmed working in production)

### 4. Document Storage
- **Decision**: Migrating from Google Docs to Firestore
- **Rationale**:
  - More control over document structure
  - Simpler implementation
  - Better integration with existing auth
  - Reduced API complexity
- **Status**: In Progress
- **Impact**: Simplifies storage layer, removes Google API dependencies

### 5. Editor Selection
- **Decision**: Evaluating Tiptap vs Quill
- **Rationale**:
  - Both provide rich text editing
  - Modern, maintained libraries
  - Good documentation
  - Active communities
- **Status**: To be decided
- **Impact**: Will affect editor implementation approach

## Current Work Threads

### 1. Project Infrastructure
- [✓] Initialize project repository
- [✓] Set up development environment
- [ ] Configure ESLint and Prettier
- [✓] Create initial project structure
- [✓] Set up Express server
- [✓] Configure Firestore
- [✓] Deploy to Railway (Initial setup & debugging complete)

### 2. Authentication Flow
- [✓] Configure Google OAuth (Reference only)
- [✓] Implement token management (Server-side session)
- [✓] Set up secure session handling (Persistent Firestore store via `@google-cloud/connect-firestore`)
- [✓] Create login/logout flow (Email/Password implemented)
- [✓] Resolve production session persistence issues (Railway)
- [ ] Add token refresh mechanism (Lower priority)

### 3. Gorlea Notes Interface
- [✓] Design basic UI layout
- [✓] Implement chat input
- [✓] Create message display
- [✓] Add basic styling
- [✓] Integrate AI processing

### 4. Gorlea Docs Phase 1
- [✓] Create /docs route
- [✓] Implement document list view
- [✓] Add new document button
- [✓] Set up Firestore document storage
- [✓] Add loading/error states
- [✓] Implement editor page (Phase 2 - Basic Load/Save)

## Technical Considerations

### Active Issues
1. Editor Selection:
   - Evaluating Tiptap and Quill features
   - Considering performance implications
   - Assessing customization needs
   - Reviewing community support

2. **Notion Integration:** Configured and available for task management via MCP tools. See `memory-bank/notionContext.md` for IDs and usage details.

3. Recent Changes (March 26):
   - Created document list view
   - Implemented Firestore document storage
   - Added document CRUD endpoints
   - Set up protected routes

3. Current Blockers:
   - Editor implementation pending
   - Export functionality not started
   - Document content storage structure TBD

### Open Questions
1. Best approach for rich text storage in Firestore
2. Export format preferences
3. Editor customization requirements
4. Future collaborative features

## Recent Changes

- **(April 13, 2025)** Fixed Mobile Keyboard Overlap (`client-vite/chat.html`):
    - **Problem:** On mobile devices, the virtual keyboard obscured the chat input and recent messages. Previous CSS attempts (e.g., `100vh` adjustments) were unreliable.
    - **Solution:** Implemented JavaScript using the `visualViewport` API in `client-vite/src/chat.js`. This API accurately detects the visible area excluding the keyboard.
    - **Implementation:**
        - Added event listeners (`resize`, `scroll`) for `visualViewport`.
        - Dynamically calculated the available height and adjusted the `bottom` style of the fixed footer (`#chat-footer`) and the `padding-bottom` of the chat messages container (`#messages`) to ensure the input stays visible and the chat area resizes correctly when the keyboard appears/disappears.
        - Reverted previous CSS-only attempts in `client-vite/src/styles/main.css`.
        - Modified `client-vite/vite.config.js` temporarily for HTTPS local testing required by `visualViewport` on some mobile browsers/setups.
    - **Outcome:** The chat input and messages now correctly adjust on mobile when the keyboard is shown or hidden, resolving the overlap issue.
    - **Files Modified:** `client-vite/src/chat.js`, `client-vite/src/styles/main.css`, `client-vite/vite.config.js` (for testing).


- **(April 13, 2025)** Implemented Mobile Responsiveness for Chat UI (`client-vite/chat.html`):
    - **Goal:** Create a functional and visually appealing mobile layout for the chat interface.
    - **Implementation:**
        - Added CSS media queries (`@media (max-width: 768px)`) in `client-vite/src/styles/main.css`.
        - Modified `client-vite/chat.html` structure for mobile header (logo left, hamburger right, fixed 60px height).
        - Implemented hamburger button toggle logic in `client-vite/src/chat.js`.
        - Created a side navigation panel (`#side-nav`) that slides in from the right.
    - **Process:** Involved iterative CSS adjustments to fix layout issues (e.g., header alignment, panel positioning/transition) and JS fixes for toggle functionality. Overcame an accidental file overwrite by reverting and reapplying changes carefully.
    - **Files Modified:** `client-vite/chat.html`, `client-vite/src/styles/main.css`, `client-vite/src/chat.js`.

- **(April 11, 2025)** Attempted mobile responsiveness overhaul:
    - Added mobile-specific CSS overrides using `@media (max-width: 768px)` to `main.css` and `docs.css`.
    - Attempted a mobile-first CSS restructuring, which inadvertently broke desktop layout.
    - **Decision:** Rolled back changes to commit `fb8588a` ("mobile layout fix") via `git reset --hard`.
    - **Outcome:** Project reverted to previous state. Mobile responsiveness remains basic; focus shifted back to desktop MVP functionality for now.
- **(April 11, 2025)** Fixed Tiptap editor spacing and added paste sanitization:
    - Adjusted CSS in `docs.css` for consistent line-height and margins.
    - Added `transformPastedHTML` to Tiptap config in `editor.js` to clean pasted HTML.
    - Fixed related syntax error in `editor.js`.
- **(April 11, 2025)** Fixed frontend document creation error:
    - Resolved `ReferenceError: newDocButton is not defined` in `client-vite/src/docs/docList.js`.
    - Moved DOM element definitions (`newDocButton`, `docList`, `noDocsMessage`) to top-level scope.
    - Document creation flow now works correctly for new users.
- **(April 11, 2025)** Added new Documentation mode:
    - Created `UpdaterBot` mode in `.roomodes` for managing memory bank updates.
    - Configured with specific responsibilities, rules, and file access restrictions (`/memory-bank/*.md`).

- **(April 10, 2025)** Railway Deployment & Debugging:
    - Created Railway project linked to GitHub (`master` branch).
    - Configured Build Command: `npm install && cd server && npm install && cd ../client-vite && npm install && npm run build`
    - Configured Start Command: `node server/index.js`
    - Added required environment variables (Firebase Admin, Gemini, Session Secret, NODE_ENV=production).
    - **Troubleshooting:**
        - Fixed initial Nixpacks build failure by adding `.node-version` file (specifying Node 20).
        - Fixed `npm: command not found` by ensuring `.node-version` was on the correct branch (`master`).
        - Fixed `Cannot find module 'dotenv'` error by ensuring server dependencies were installed via `cd server && npm install` in the build command.
        - Fixed `Cannot GET /login.html` (and other pages) by:
            - Initially removing `app.get('*', ...)` catch-all in `server/index.js`.
            - Investigating build output (Vite *was* building HTML files to `server/public`).
            - Adding explicit `app.get()` routes for each HTML page in `server/index.js`.
            - Confirming `vite.config.js` correctly used `resolve` for `outDir`.
            - Adding `login.html` and `register.html` to Vite build inputs (`vite.config.js`).
        - Fixed `401 Unauthorized` after login (session not persisting) by:
            - Confirming `credentials: 'include'` was present in frontend `fetch` calls (`auth.js`).
            - Adding `app.set('trust proxy', 1)` to `server/index.js`.
            - Explicitly setting `cookie.sameSite = 'Lax'` in `expressSession` config (`server/index.js`).
    - **Result:** Successful deployment with working login and navigation. URL: `https://gorlea-notes-docs-production.up.railway.app/` (Verify this URL).
- **(April 10, 2025)** Page Load Transition & Logo Flash Fix:
    - Implemented CSS fade-in transition (`opacity: 0` to `opacity: 1`) for main page containers (`.app`, `.docs-app`, etc.) triggered by adding a `.loaded` class via JavaScript on `DOMContentLoaded`.
    - Added inline `width` and `height` styles to logo `<img>` tags in HTML files (`chat.html`, `index.html`, `login.html`, `register.html`, `docs/index.html`) to prevent flash/layout shift before CSS loads.
- **(April 10, 2025)** Favicon Implementation:
    - Added Gorlea logo (`/gorlea-logo.png`) as favicon to main HTML pages (`chat.html`, `docs/index.html`, `docs/editor.html`, `index.html`). Login/Register pages already had it.
- **(April 10, 2025)** Docs List "No Documents" Message:
    - Refactored `client-vite/docs/index.html` to separate list container (`#doc-list`) and message container (`#no-docs-message`).
    - Updated `client-vite/src/docs/docList.js` (`init` function) to correctly show/hide the list or the message based on fetched document count. Simplified error handling. Moved DOM selections into `init`.
- **(April 10, 2025)** Git Reset:
    - Rolled back changes using `git reset --hard HEAD` to commit `b847c74` after previous attempts to fix docs list UI caused broader issues.
- **(April 8, 2025)** Core Functionality Debugging:
    - Fixed editor loading issue by removing `apiBaseUrl` definition in `editor.js`
    - Worked around document listing/editing issue via manual `userId` updates in existing documents
    - Investigated AI processing failures ("Failed to get AI response" errors)
- **(April 6, 2025)** Unified button styling across app:
    - Created `.gorlea-button` class with gold background, rounded rectangle shape, consistent size, padding, and hover effects.
    - Applied `.gorlea-button` to all header buttons on chat, docs list, and editor pages.
    - Removed conflicting classes (`.header-button`, `.button-accent`, `.docs-button`) for consistency.
    - Updated Logout buttons on docs list and editor pages to use `.gorlea-button`.
    - Changed New Chat icon color from white to black for better theme alignment.

- **(April 5, 2025)** Implemented UI overhaul for improved user experience:
    - Enhanced editor page with improved action buttons and sticky toolbar for better usability.
    - Upgraded document list page with better card styling and visual feedback on interactions.
    - Added document creation/edited dates in the list view for better context.
    - Applied consistent button styling and hover effects across the application.
    - Improved spacing and visual hierarchy for clearer information architecture.
    - Enhanced mobile responsiveness for better cross-device experience.

- **(April 5, 2025)** Removed timestamp insertion when appending notes:
    - Updated `appendContent` in `server/utils/firestore.js` to no longer add a timestamp separator.
    - Now, new notes are appended with a simple paragraph break for clean separation.
    - This change improves document readability and minimalism.

- **(April 5, 2025)** Implemented Email/Password Authentication:
    - Added backend routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`) and controller (`authController.js`).
    - Added user route (`/api/user/me`) and controller (`userController.js`) to fetch user data.
    - Implemented password hashing using `bcrypt`.
    - Added `requireAuth` middleware to protect routes.
    - Created frontend pages (`login.html`, `register.html`) and logic (`auth.js`).
- **(April 5, 2025)** Configured Persistent Session Store:
    - Integrated `@google-cloud/connect-firestore` with `express-session` to store sessions in Firestore.
    - Updated server setup (`index.js`) with Firestore session store configuration.
- **(April 5, 2025)** Fixed User Email Display in Headers:
    - Updated `chat.js`, `docList.js`, and `editor.js` to fetch user email from `/api/user/me` and display it in the header if logged in.
- **(April 2, 2025)** Fixed chat scroll issue: Modified `revealMessageBlocks` in `chat.js` to call `scrollToBottom()` only after the entire animation completes.
- **(April 2, 2025)** Implemented block-reveal animation for Gorlea messages:
    - Removed character-typing effect (`typeMessageEffect` and cursor CSS).
    - Added `revealMessageBlocks` function and associated CSS animation (`revealBlockFadeIn`).
    - Updated `handleSubmit` in `chat.js` to use block-reveal for AI responses and follow-up prompts.
- **(April 2, 2025)** Removed Gorlea message bubble background: Updated CSS in `main.css` for `.gorlea-message .message-content`.
- **(April 2, 2025)** Moved "New Chat" button to header: Updated `chat.html` and `main.css`.
- **(April 2, 2025)** Removed "Chat cleared" confirmation message from `chat.js`.
- **(April 2, 2025)** Implemented "New Chat" button functionality:
    - Added button element to `client-vite/chat.html`.
    - Added styling in `client-vite/src/styles/main.css`.
    - Added JS logic in `client-vite/src/chat.js` to clear `localStorage`, `chatHistory` array, and message display.
- **(April 2, 2025)** Added timestamp separator when appending notes:
    - Modified `appendContent` in `server/utils/firestore.js` to prepend `*Saved: [Date Time]*` before new content.
- **(April 2, 2025)** Implemented chat persistence using `localStorage`:
    - Added `chatHistory` array, `saveChatHistory`, and `loadChatHistory` functions to `client-vite/src/chat.js`.
    - Modified `addMessage` to save non-loading messages.
    - Called `loadChatHistory` on script load.
- **(April 1, 2025)** Replaced text labels with icons in Tiptap toolbar:
    - Updated buttons in `docs/editor.html` to use Material Symbols SVGs.
    - Added CSS in `styles/docs.css` to style the SVGs within buttons.
- **(April 1, 2025)** Implemented Tiptap editor toolbar:
    - Installed `@tiptap/extension-underline`.
    - Added toolbar HTML structure (with text labels) to `docs/editor.html`.
    - Added JavaScript logic in `docs/editor.js` to handle button clicks (using Tiptap commands) and update button active states.
    - Added CSS styles for the toolbar and buttons in `styles/docs.css`.
- **(April 1, 2025)** Made navigation buttons open in new tabs:
    - Modified "Gorlea Docs" button in `chat.html` (changed to `<a>` tag) and "Gorlea Notes" links in `docs/index.html` & `docs/editor.html` to include `target="_blank" rel="noopener noreferrer"`.
- **(April 1, 2025)** Improved AI rewrite formatting & fixed duplicate prompt:
    - Updated AI prompt in `aiController.js` to request Markdown output, preserve quotes, and remove the redundant follow-up question.
    - Installed `marked` library in `client-vite`.
    - Updated `chat.js` (`createMessage`) to render Markdown in Gorlea's responses.
    - Updated `chat.js` (`handleSubmit`) to store the rewritten note as HTML using `marked.parse()`.
- **(April 1, 2025)** Fixed chat command logic loop (Attempt 3):
    - Added missing `"create a new doc called"` pattern to `createPatterns` array in `chat.js`. (Previous attempts involving `trim()` and `return` were addressing symptoms, not the root cause identified by user).
- **(April 1, 2025)** Added "Gorlea Notes" navigation button to Docs pages:
    - Inserted styled link (`<a href="/chat.html" class="button button-accent">Gorlea Notes</a>`) into the headers of `client-vite/docs/index.html` and `client-vite/docs/editor.html`.
- **(April 1, 2025)** Implemented "Show Recent Docs" feature in chat:
    - Modified `listDocuments` in `server/utils/firestore.js` to accept an optional `limit`.
    - Updated `listDocuments` controller in `server/controllers/docsController.js` to handle `limit` query parameter.
    - Added state, command patterns (`show recent`), API call (`fetchAndDisplayRecentDocs`), and logic to `client-vite/src/chat.js` to fetch, display, and handle selection of recent documents.
- **(April 1, 2025)** Fixed chat auto-scrolling issue:
    - Added reference to `.chat-container` in `client-vite/src/chat.js`.
    - Updated `scrollToBottom` function to target `.chat-container` instead of `#messages`.
- **(March 29)** Diagnosed chat auto-scroll issue: `scrollToBottom` in `chat.js` targets `#messages` instead of the scrollable parent `.chat-container`.
- **(March 29)** Simplified AI rewrite prompt (`aiController.js`) after improving frontend intent handling.
- **(March 29)** Refined chatbot save/create logic (`chat.js`):
    - Improved document name extraction from save commands.
    - Added explicit patterns (`createPatterns`) to handle direct creation intent (e.g., "create new doc named X").
    - Prioritized checking creation patterns before general save patterns in `handleSubmit`.
- **(March 29)** Implemented case-insensitive document title search:
    - Added `title_lowercase` field to Firestore documents on create/update (`firestore.js`).
    - Modified `findDocumentByTitle` to query the lowercase field (`firestore.js`).
- **(March 29)** Integrated Tiptap rich text editor (Phase D):
    - Installed `@tiptap/core` and `@tiptap/starter-kit` via npm in `client-vite`.
    - Updated `editor.html` to use `<div id="editor">` instead of `<textarea>`.
    - Updated `editor.js` to import Tiptap, initialize the editor, set initial content from fetched data, and trigger autosave via `onUpdate`.
    - Modified `performAutosave` in `editor.js` to use `editor.getHTML()` for saving content.
    - Updated `docs.css` to style the Tiptap editor area (`#editor .ProseMirror`).
- **(March 29)** Debugged Vite setup issues:
    - Fixed `document.getElementById is not a function` error in `editor.js` by renaming shadowed `document` variable to `docData`.
    - Diagnosed `401 Unauthorized` on `/api/ai/*` routes: Caused by `requireAuth` middleware checking `req.session.tokens` which are no longer set. Temporarily removed `requireAuth` from `server/routes/ai.js` to unblock development.
    - Fixed `ReferenceError: loadingMessage is not defined` in `chat.js`.
- **(March 29)** Started Vite migration (Phase A):
    - Initialized Vite project in `client-vite`.
    - Migrated HTML, CSS, JS files from `client` to `client-vite/src`.
    - Configured Vite for MPA and API proxy (`vite.config.js`).
    - Updated HTML/JS for module loading and CSS imports.
- **(March 29)** Cleaned up editor UI:
    - Removed manual Save button (`#save-btn`) and visual autosave status (`#autosave-status`) from `editor.html`.
    - Modified `editor.js` to remove related DOM manipulation and use `console.log`/`console.error` for autosave feedback instead.
- **(March 29)** Implemented editor autosave functionality:
    - Added debounce utility and `performAutosave` function in `editor.js`.
    - Autosave triggers on title/content input (2s delay) and on "Docs Home" button click (immediate, awaits completion before navigation).
    - Initially included visual feedback elements (`#autosave-status`).
- **(March 29)** Fixed document card icon alignment:
    - Refactored card HTML structure in `docList.js` (`.doc-main`, `.doc-actions`).
    - Adjusted CSS in `editor.css` (`.doc-card`, `.doc-actions`) for correct Flexbox layout.
- **(March 29)** Added Archive (soft delete) and Delete (permanent) functionality to document list:
    - Added Archive/Delete buttons to document cards in `docList.js`.
    - Implemented backend routes (`PUT /api/docs/:id/archive`, `DELETE /api/docs/:id`) and corresponding controller/utility functions.
    - Added frontend logic in `docList.js` to call APIs and update UI.
    - Included confirmation dialog for permanent delete.
- **(March 29)** Implemented Gorlea Docs editor flow enhancements:
    - Added "Docs Home" button to `editor.html`.
    - Ensured "New Document" button state resets correctly in `docList.js` using `finally`.
    - Added title validation (defaulting to "Untitled Document") on frontend save (`editor.js`) and backend update (`docsController.js`).
    - Refactored button styling in `editor.css` using a shared `.button-accent` class for "New Document" and "Docs Home" buttons.
- **(March 27)** Simplified `docList.js` UI (removed date display).
- **(March 27)** Refactored Firestore logic (`firestore.js`):
    - Replaced `updatedAt` with `lastOpenedAt`.
    - Added update `lastOpenedAt` on `getDocument`.
    - Updated sorting in `listDocuments` to use `lastOpenedAt`.
- **(March 27)** Debugged editor page visibility:
    - Corrected HTML structure in `editor.html` (elements misplaced outside wrapper).
    - Verified asset paths and server config.
    - Added JS logging.
    - Used systematic CSS debugging to isolate cause.
    - Removed logo from `editor.html` as it was causing layout conflict.
- **(March 27)** Refactored Firestore logic (`firestore.js`):
    - Replaced `updatedAt` with `lastOpenedAt`.
    - Added update `lastOpenedAt` on `getDocument`.
    - Updated sorting in `listDocuments` to use `lastOpenedAt`.
- **(March 27)** Simplified `docList.js` UI (removed date display).
- Added document list view (March 26, 8:31 AM)
- Implemented Firestore document storage (March 26, 8:32 AM)
- Created document CRUD endpoints (March 26, 8:33 AM)
- Added protected routes for docs (March 26, 8:31 AM)
- **(March 29)** Implemented Gorlea Docs editor flow enhancements:
    - Added "Docs Home" button to `editor.html`.
    - Ensured "New Document" button state resets correctly in `docList.js` using `finally`.
    - Added title validation (defaulting to "Untitled Document") on frontend save (`editor.js`) and backend update (`docsController.js`).
    - Refactored button styling in `editor.css` using a shared `.button-accent` class for "New Document" and "Docs Home" buttons.
- **(March 29)** Added Archive (soft delete) and Delete (permanent) functionality to document list:
    - Added Archive/Delete buttons to document cards in `docList.js`.
    - Implemented backend routes (`PUT /api/docs/:id/archive`, `DELETE /api/docs/:id`) and corresponding controller/utility functions.
    - Added frontend logic in `docList.js` to call APIs and update UI.
    - Included confirmation dialog for permanent delete.
- **(March 29)** Fixed document card icon alignment:
    - Refactored card HTML structure in `docList.js` (`.doc-main`, `.doc-actions`).
    - Adjusted CSS in `editor.css` (`.doc-card`, `.doc-actions`) for correct Flexbox layout.
- **(March 29)** Implemented editor autosave functionality:
    - Added debounce utility and `performAutosave` function in `editor.js`.
    - Autosave triggers on title/content input (2s delay) and on "Docs Home" button click (immediate, awaits completion before navigation).
    - Initially included visual feedback elements (`#autosave-status`).
- **(March 29)** Cleaned up editor UI:
    - Removed manual Save button (`#save-btn`) and visual autosave status (`#autosave-status`) from `editor.html`.
    - Modified `editor.js` to remove related DOM manipulation and use `console.log`/`console.error` for autosave feedback instead.
- **(March 29)** Started Vite migration (Phase A):
    - Initialized Vite project in `client-vite`.
    - Migrated HTML, CSS, JS files from `client` to `client-vite/src`.
    - Configured Vite for MPA and API proxy (`vite.config.js`).
    - Updated HTML/JS for module loading and CSS imports.
- **(March 29)** Debugged Vite setup issues:
    - Fixed `document.getElementById is not a function` error in `editor.js` by renaming shadowed `document` variable to `docData`.
    - Diagnosed `401 Unauthorized` on `/api/ai/*` routes: Caused by `requireAuth` middleware checking `req.session.tokens` which are no longer set. Temporarily removed `requireAuth` from `server/routes/ai.js` to unblock development.
    - Fixed `ReferenceError: loadingMessage is not defined` in `chat.js`.
- **(March 29)** Integrated Tiptap rich text editor (Phase D):
    - Installed `@tiptap/core` and `@tiptap/starter-kit` via npm in `client-vite`.
    - Updated `editor.html` to use `<div id="editor">` instead of `<textarea>`.
    - Updated `editor.js` to import Tiptap, initialize the editor, set initial content from fetched data, and trigger autosave via `onUpdate`.
    - Modified `performAutosave` in `editor.js` to use `editor.getHTML()` for saving content.
    - Updated `docs.css` to style the Tiptap editor area (`#editor .ProseMirror`).
- **(March 29)** Implemented case-insensitive document title search:
    - Added `title_lowercase` field to Firestore documents on create/update (`firestore.js`).
    - Modified `findDocumentByTitle` to query the lowercase field (`firestore.js`).
- **(March 29)** Refined chatbot save/create logic (`chat.js`):
    - Improved document name extraction from save commands.
    - Added explicit patterns (`createPatterns`) to handle direct creation intent (e.g., "create new doc named X").
    - Prioritized checking creation patterns before general save patterns in `handleSubmit`.
- **(March 29)** Simplified AI rewrite prompt (`aiController.js`) after improving frontend intent handling.
- **(March 29)** Diagnosed chat auto-scroll issue: `scrollToBottom` in `chat.js` targets `#messages` instead of the scrollable parent `.chat-container`.


## Next Steps - Updated (April 11, 2025)

### Current Focus: Stabilize Desktop MVP
1.  **Complete Production Testing:** Verify remaining items (Editor Direct Link, Debugging Failsafe).
2.  **Address Desktop Scroll Issue:** Investigate and fix the chatbox scroll problem reported on desktop.
3.  **Refine Existing Features:** Polish core desktop functionality based on testing feedback.
4.  **Monitor Production:** Keep an eye on the Railway deployment for any issues.

### Deferred Tasks
1.  **Major Mobile Responsiveness Overhaul:** Postponed. The current basic mobile overrides will remain, but a full mobile-first redesign is deferred to focus on the desktop MVP.
2.  **Future Features:** Revisit stretch goals (Search, Tagging, etc.) after the desktop MVP is stable and validated.
### Subsequent Tasks
1.  **Gorlea Notes Chat Testing:** Verify chat functionality, AI processing, and note saving in production.
2.  **Refinement & Bug Fixes:** Address any issues found during testing.
3.  **Monitoring:** Set up basic Railway monitoring if needed.
4.  **Future Features:** Revisit stretch goals (Search, Tagging, etc.).

## Recent Changes - Added
- **Unified Development Environment:**
  - Added root-level `npm run dev` script using `concurrently`
  - Backend and frontend now start simultaneously
  - Simplified local testing workflow
- **Firebase Credential Management:**
  - Switched to individual `FIREBASE_*` environment variables
  - More secure and deployment-friendly
  - Backend explicitly loads root `.env` file
- **Session Store Fix:**
  - Firestore session store now correctly uses initialized Firestore instance


## Risk Register

### Active Risks
1. Editor integration complexity
2. Firestore document size limits
3. Export functionality challenges
4. Session management in production
5. Rich text storage optimization

### Mitigation Strategies
1. Thorough editor evaluation
2. Document size monitoring
3. Export format testing
4. Proper security measures
5. Storage optimization planning

---

Last Updated: 2025-04-13 3:15 PM PDT
Next Review: 2025-04-09

---

### Update: April 5, 2025 - Chat Scroll Debugging & Fixes

- **Issue:** Gorlea's confirmation messages were sometimes cut off or not auto-scrolling.
- **Root Causes:**
  - Removed padding/margin from Gorlea messages.
  - Async message timing (API confirmations added after initial AI response).
  - Overly complex scroll logic relying on `.last-message` and animation frames.
- **Debugging Process:**
  - Inspected CSS and container layout.
  - Tested scroll timing with various methods.
  - Identified async timing as a key factor.
- **Fixes Applied:**
  - Added **extra bottom padding** to `.chat-container`.
  - Added **margin-bottom** to `.gorlea-message`.
  - Reverted to **simple container scroll** (`scrollTop = scrollHeight`) for reliability.
- **Current Status:** Chat now **auto-scrolls smoothly** for all messages, including async confirmations.
- **Lessons Learned:**
  - Async UI updates require scroll logic that accounts for timing and layout.
  - Sufficient padding/margin is critical for reliable scrolling.
  - Simpler scroll methods can be more robust.
- **Next:** Continue refining chat UX, test edge cases, and document these patterns.
