# 🚀 Railway Deployment Plan for Gorlea Notes

This file outlines the step-by-step plan for deploying the Gorlea Notes application to Railway, based on the sequential thinking process completed on April 9, 2025.

---

## Deployment Steps

1.  **Confirm Environment Variables:**
    *   Ensure all necessary variables are identified and documented, referencing `techContext.md` and recent updates.
    *   Required: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `GEMINI_API_KEY`, `SESSION_SECRET`, `COOKIE_SECRET`, `NODE_ENV=production`.
    *   Note: `GOOGLE_APPLICATION_CREDENTIALS` file path is *not* used; individual `FIREBASE_*` vars are used instead.

2.  **Create Railway Project:**
    *   Create a new project in the Railway dashboard.
    *   Link it to the GitHub repository containing the Gorlea Notes codebase.

3.  **Configure Build Settings in Railway:**
    *   Set **Root Directory** to the repository root.
    *   Set **Build Command**. Example: `cd client-vite && npm run build && cp -r dist ../server/public` (Verify server serves static files from `server/public`).
    *   Confirm Railway automatically handles `npm install` in both `/server` and `/client-vite` directories (or adjust build command if needed).

4.  **Configure Start Command in Railway:**
    *   Set the **Start Command** to `node server/index.js`.

5.  **Add Environment Variables to Railway:**
    *   Input all required environment variables (from Step 1) into Railway's variable management system.
    *   Pay special attention to handling multi-line variables like `FIREBASE_PRIVATE_KEY`.

6.  **Deploy & Monitor:**
    *   Trigger the initial deployment via the Railway dashboard or CLI.
    *   Monitor the build and deployment logs closely for any errors.

7.  **Test Deployed Application:**
    *   Access the application using the URL provided by Railway.
    *   Thoroughly test core functionality:
        *   User registration and login.
        *   Chat interface and message persistence.
        *   AI note rewriting.
        *   Document listing, creation, and editing.
        *   Session persistence across browser restarts.

8.  **Optional Post-Deployment:**
    *   Configure a custom domain if desired.
    *   Set up basic application monitoring or alerting through Railway or external services.

---

This plan serves as a checklist for the deployment process. Refer back to other memory bank files (`techContext.md`, `systemPatterns.md`) for specific configuration details.
