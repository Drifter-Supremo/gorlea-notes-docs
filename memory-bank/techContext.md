# 🔧 Technical Context: Gorlea Notes & Docs

## Technology Stack

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Custom Properties for theming
- **Layout**: CSS Grid/Flexbox for responsive design
- **Editor**: Tiptap/Quill (to be selected)
- **Future Consideration**: React if complexity grows

### Backend
- **Runtime**: Node.js 20.x+
- **Framework**: Express.js
  - Session management
  - Route handling
  - Middleware support
- **API Style**: RESTful with JSON

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
- **Authentication**: Google OAuth 2.0
- **Session Management**: express-session
- **Token Storage**: Secure HTTP-only cookies
- **API Security**: 
  - CORS configuration
  - Rate limiting
  - Request validation

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
/client/
  ├── docs/                # Gorlea Docs frontend
  │   ├── index.html      # Document list
  │   ├── editor.html     # Document editor
  │   ├── scripts/
  │   │   ├── docList.js  # List functionality
  │   │   └── editor.js   # Editor functionality
  │   └── styles/
  │       └── docs.css    # Docs-specific styles
  ├── styles/
  │   └── main.css        # Shared styles
  └── scripts/
      └── app.js          # Notes functionality

/server/
  ├── index.js            # Entry point
  ├── routes/             # Route definitions
  │   ├── docs.js        # Document routes
  │   └── auth.js        # Auth routes
  ├── controllers/        # Request handlers
  │   ├── docsController.js
  │   └── authController.js
  ├── utils/             # Utilities
  │   └── firestore.js   # Firestore helpers
  └── config/            # Configuration
      └── firebase.js    # Firebase config
```

### Frontend Features
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
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

#### Frontend (Planned)
```json
{
  "dependencies": {
    "@tiptap/core": "^2.2.4",    // If Tiptap selected
    "quill": "^1.3.7",           // If Quill selected
    "html-to-text": "^9.0.5",    // For export
    "jspdf": "^2.5.1"            // For PDF export
  }
}
```

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

### API Documentation
- OpenAPI/Swagger spec
- Endpoint documentation
- Authentication flows
- Error codes and handling

### Code Documentation
- README files
- JSDoc comments
- Architecture diagrams
- Setup instructions

---

This technical context serves as the foundation for development decisions and ensures consistency across the project implementation.
