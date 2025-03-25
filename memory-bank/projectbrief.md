\# 🧠 Project Brief: Gorlea Notes

\#\# Overview  
Gorlea Notes is a custom chat-style note-taking app designed to help users with ADHD (and anyone with a fast-moving brain) quickly jot down thoughts, ideas, or reminders in natural language. The app uses AI to clean up the notes, then asks the user where to save them. Notes are appended to existing Google Docs or saved into new ones, based on user intent.

The app blends \*\*structured note organization\*\*, \*\*hands-off automation\*\*, and a \*\*natural chat interface\*\* to create a smarter, more intuitive way to manage scattered thoughts.

\#\# Core Features (MVP)  
\- 📝 Chat-style interface for entering freeform notes.  
\- 🤖 AI (Gemini or GPT-4) rewrites messy notes for clarity and structure.  
\- 📂 AI asks user where the note should be saved (existing doc or new).  
\- 📄 App connects to Google Docs via Google Drive/Docs API.  
\- 🧩 Notes are appended to existing Google Docs or new Docs are created.  
\- 🔐 Secure Google OAuth2 login (only for the user).  
\- ☁️ Backend (Firebase Function or Express) handles all API calls to Google.

\#\# Tech Stack  
\- Frontend: HTML/CSS/JS (or React if needed later)  
\- Backend: Firebase Functions (Node.js) or Express server  
\- AI Model: Gemini API or OpenAI GPT-4 (via secure server call)  
\- Cloud: Google Drive \+ Google Docs APIs (requires OAuth2)  
\- Auth: Google OAuth2 (scoped for Docs/Drive access)  
\- Storage: Firebase (optional, to store logs or note metadata)

\#\# Folders  
\- \`/memory-bank/\`: Planning, notes, prompts, guides  
\- \`/src/\`: Frontend code  
\- \`/functions/\`: Firebase Functions (or \`/server/\` for Express backend)  
\- \`/auth/\`: Google OAuth logic and tokens  
\- \`/utils/\`: Shared helper functions (AI rewrite, doc creation, etc.)

\#\# Key Goals  
\- Prioritize simplicity and mental clarity — no clutter.  
\- Minimize user decisions; AI should prompt with helpful options.  
\- Handle Google API integration \*\*securely and cleanly\*\*.  
\- Make note entry feel frictionless, just like chatting with Gorlea.

\#\# Stretch Goals (Post-MVP)  
\- 🔍 Search across saved notes  
\- 🗂 Tagging or categorization system  
\- 🕓 Timestamped entries or daily summary docs  
\- 🧠 AI smart folders based on topic/theme  
\- 🗣 Voice note input (transcribed and cleaned by AI)

\---

Let’s build something that makes your brain feel heard, not managed.

