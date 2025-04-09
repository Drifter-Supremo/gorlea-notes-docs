# 🔧 Technical Context: Gorlea Notes & Docs

## Technology Stack

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: CSS Custom Properties for theming
- **Layout**: CSS Grid/Flexbox for responsive design
- **Editor**: Tiptap (Core, StarterKit, Underline)
- **Markdown Rendering**: Marked
- **Future Consideration**: React if complexity grows

### Backend
- **Runtime**: Node.js 20.x+
- **Framework**: Express.js
  - Session management
  - Route handling
  - Middleware support
- **API Style**: RESTful with JSON
- **Password Hashing**: `bcrypt`
- **Session Store**: `@google-cloud/connect-firestore` (Connects `express-session` to Firestore)

### AI Integration
- **Primary**: Google Gemini API
  - Pro tier for enhanced capabilities
  - Streaming API support
  - Note rewriting capabilities
- **Fallback**: OpenAI GPT-4 (future consideration)
  - Used if Gemini unavailable
  - Requires separate API key

### Storage
- **Primary**: Firestore
  - Document storage
  - User data
  - Metadata
- **Binary Storage**: Firebase Storage
  - Document attachments
  - Large content
  - Media files

### Security
- **Authentication**: Email/Password (using `bcrypt` for hashing), Google OAuth 2.0 (kept for reference)
- **Session Management**: `express-session` with `@google-cloud/connect-firestore` for persistent storage in Firestore.
- **Token Storage**: Secure HTTP-only cookies
- **API Security**:
  - CORS configuration
  - Rate limiting
  - Request validation

### External Services
- **Notion Integration:** Used for task management via the `github.com/pashpashpash/mcp-notion-server` MCP server. See `memory-bank/notionContext.md` for database IDs, user IDs, and usage details.

## Development Setup

### Environment Variables
```bash
# Firebase Configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# AI API Keys
GEMINI_API_KEY=
OPENAI_API_KEY=  # fallback

# Security
SESSION_SECRET=
COOKIE_SECRET=

# Environment
NODE_ENV=development
PORT=3000
```

### Project Structure
```bash
/client-vite/             # Vite frontend root
  ├── index.html          # Main entry (if needed, currently chat.html is primary)
  ├── chat.html           # Gorlea Notes chat interface entry
  ├── docs/               # Gorlea Docs specific HTML
  │   ├── index.html      # Document list entry
  │   └── editor.html     # Document editor entry
  ├── public/             # Static assets (e.g., logos)
  ├── src/                # Source files
  │   ├── main.js         # Main JS entry (if using index.html)
  │   ├── chat.js         # Gorlea Notes chat logic
  │   ├── docs/           # Gorlea Docs specific JS
  │   │   ├── docList.js
  │   │   └── editor.js
  │   ├── styles/         # CSS files
  │   │   ├── main.css
  │   │   └── docs.css
  │   └── ...             # Other JS modules
  ├── package.json
  └── vite.config.js      # Vite configuration (MPA, proxy)

/server/                  # Express backend root
  ├── index.js            # Entry point
  ├── config/             # Configuration (e.g., google.js)
  ├── controllers/        # Request handlers (e.g., authController.js, userController.js, aiController.js, docsController.js)
  ├── middleware/         # Custom middleware (e.g., requireAuth.js)
  ├── routes/             # Route definitions (e.g., auth.js, user.js, ai.js, docs.js)
  ├── utils/              # Utility functions (e.g., firestore.js)
  ├── package.json
  └── ...                 # Other files
```

### Frontend Features
- Chat interface (Gorlea Notes)
  - Chat message persistence via `localStorage`
  - "New Chat" button functionality
- Document list view
- Rich text editor (pending)
- Auto-expanding inputs
- Smooth animations
- Dark theme with gold accents
- Responsive mobile-first design

### Required Dependencies

#### Backend
```json
{
  "dependencies": {
    "express": "^4.18.3",
    "express-session": "^1.18.0",
    "firebase": "^10.8.0",
    "dotenv": "^16.4.5",
    "axios": "^1.6.7",
    "bcrypt": "^5.1.1", // Added for password hashing
    "@google-cloud/connect-firestore": "^3.0.0" // Added for persistent sessions
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

#### Frontend (`client-vite/package.json`)
```json
{
  "dependencies": {
    "@tiptap/core": "^2.2.4",
    "@tiptap/starter-kit": "^2.2.4",
    "@tiptap/extension-underline": "^2.2.4", // Example extension
    "marked": "^12.0.1" // Or latest version used
    // Other dependencies like html-to-text, jspdf if export is implemented
  },
  "devDependencies": {
    "vite": "^5.1.6" // Or latest version used
  }
}
```
*Note: This reflects current known dependencies. Check `package.json` for the exact list.*

## Technical Requirements

### Browser Support
- Modern browsers (last 2 versions)
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Android)

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2s
- API Response Time: < 500ms
- Editor Input Latency: < 50ms
- Save Operation: < 1s

### Security Requirements
- HTTPS only
- CSP headers
- CORS configuration
- Input sanitization
- OAuth2 best practices
- Regular dependency updates

### Error Handling
- Graceful degradation
- Offline capabilities
- Retry mechanisms
- User-friendly error messages
- Detailed error logging

## Development Workflow

### Version Control
- Git-based workflow
- Feature branches
- Semantic versioning
- Conventional commits

### Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript consideration
- JSDoc comments

### Testing Strategy
- Unit tests for utilities
- Integration tests for API
- E2E tests for critical flows
- Manual testing checklist

### Deployment
- Local development server
- Production deployment TBD
- Environment separation
- CI/CD consideration

## Monitoring & Logging

### Metrics to Track
- API response times
- Error rates
- AI processing duration
- Editor performance
- Document operations
- Storage usage

### Logging Requirements
- Structured JSON logging
- Error stack traces
- User actions (anonymized)
- Performance metrics
- Security events

## Documentation

### API Endpoints (Key Examples)
- **Authentication:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- **User:**
  - `GET /api/user/me`
- **Documents:**
  - `GET /api/docs`
  - `POST /api/docs`
  - `GET /api/docs/:id`
  - `PUT /api/docs/:id`
  - `PUT /api/docs/:id/archive`
  - `DELETE /api/docs/:id`
- **AI:**
  - `POST /api/ai/rewrite`
  - `POST /api/ai/suggest-save`

### API Documentation
- OpenAPI/Swagger spec (Planned)
- Endpoint documentation (In progress via Memory Bank)
- Authentication flows (See System Patterns)
- Error codes and handling (Standardized format)

### Code Documentation
- README files
- JSDoc comments
- Architecture diagrams (Mermaid in Memory Bank)
- Setup instructions (In Memory Bank)

---

This technical context serves as the foundation for development decisions and ensures consistency across the project implementation.

---

### Update: April 8, 2025 - Unified Local Development & Firebase Credentials

- Added a **unified local development environment**:
  - Root-level `npm run dev` script using `concurrently` to start both backend (`nodemon`) and frontend (`vite`) simultaneously.
  - Simplifies local testing and development.
- Backend now **loads environment variables from the root `.env` file** explicitly.
- **Firebase Admin SDK** initialization updated:
  - Uses **individual `FIREBASE_*` environment variables** instead of a JSON string or credentials file.
  - Credentials include `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, etc.
  - Compatible with Railway deployment and avoids file path issues.
- Backend session store (`@google-cloud/connect-firestore`) now correctly uses the initialized Firestore instance.
- Immediate next step: **Test all core functionality locally before deploying.**

---

### Update: April 5, 2025 - Chat Scroll Technical Fixes

- Fixed a scroll bug by:
  - Adding **extra bottom padding** to `.chat-container` (`calc(var(--footer-height) + 20px)`).
  - Adding **`margin-bottom: 1rem`** to `.gorlea-message`.
  - Reverting scroll logic to **`chatContainer.scrollTop = chatContainer.scrollHeight`** for reliability.
- Async UI updates (e.g., API confirmations) require **scroll logic that accounts for timing and layout changes**.
- Avoided complex scroll timing (animation frames, element targeting) in favor of **simple, robust container scroll**.
- Ensures a **smooth, distraction-free chat experience** aligned with ADHD-friendly design.
