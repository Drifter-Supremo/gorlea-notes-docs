\# 🧠 Project Brief: Gorlea Notes

\#\# Overview  
Gorlea Notes is a custom chat-style note-taking app designed to help users with ADHD (and anyone with a fast-moving brain) quickly jot down thoughts, ideas, or reminders in natural language. The app uses AI to clean up the notes, then asks the user where to save them. Notes are appended to existing documents or saved into new ones within the app's storage system (Firestore).

The app blends \*\*structured note organization\*\*, \*\*hands-off automation\*\*, and a \*\*natural chat interface\*\* to create a smarter, more intuitive way to manage scattered thoughts. It also includes a basic document editor (Gorlea Docs) for viewing and managing saved notes.

\#\# Core Features (MVP)  
\- 📝 Chat-style interface (Gorlea Notes) for entering freeform notes.
  - Chat history persists in the browser (`localStorage`).
  - "New Chat" button to clear history.
\- 🤖 AI (Gemini) rewrites messy notes for clarity and structure.  
\- 📂 AI asks user where the note should be saved (existing doc or new).  
\- 📄 Notes are appended to existing Firestore documents or new documents are created.
  - Timestamp separator added when appending notes.
\- 🔐 Secure Google OAuth2 login (only for the user).  
\- ☁️ Backend (Express.js) handles AI calls and Firestore operations.
\- 📑 Basic document editor (Gorlea Docs) to list, view, create, and manage notes stored in Firestore.

\#\# Tech Stack  
\- Frontend: HTML/CSS/JS with Vite build tool. Tiptap editor for Gorlea Docs.
\- Backend: Express.js (Node.js)
\- AI Model: Google Gemini API (via secure server call)
\- Storage: Firestore (for document content, metadata)
\- Auth: Google OAuth2 (for user login)

\#\# Folders (Current Structure)
\- \`/memory-bank/\`: Planning, notes, prompts, guides  
\- \`/client-vite/\`: Frontend code (Vite project)
\- \`/server/\`: Backend code (Express.js project)
\- \`/credentials/\`: Service account keys (ignored by Git)

\#\# Key Goals  
\- Prioritize simplicity and mental clarity — no clutter.  
\- Minimize user decisions; AI should prompt with helpful options.  
\- Handle API integrations (AI, Firestore, Auth) \*\*securely and cleanly\*\*.  
\- Make note entry feel frictionless, just like chatting with Gorlea.

\#\# Stretch Goals (Post-MVP)  
\- 🔍 Search across saved notes  
\- 🗂 Tagging or categorization system  
\- 🕓 Timestamped entries or daily summary docs  
\- 🧠 AI smart folders based on topic/theme  
\- 🗣 Voice note input (transcribed and cleaned by AI)

\---

Let’s build something that makes your brain feel heard, not managed.

---

### Update: April 5, 2025 - Chat Scroll Improvements

- Ensured the chat interface provides a **smooth, frictionless experience** by fixing scroll issues.
- Diagnosed a bug where Gorlea's confirmation messages were **not auto-scrolling or were cut off**.
- Fixed by:
  - Adding **extra bottom padding** to the chat container.
  - Adding **margin below Gorlea's messages**.
  - Reverting to a **simple container scroll** method for reliability.
- This maintains the goal of **minimal cognitive load** and **natural chat flow** for ADHD users.
- Reinforces the product vision: **"make your brain feel heard, not managed."**
