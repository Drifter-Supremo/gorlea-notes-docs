# 🔧 Technical Context: Gorlea Notes

## Technology Stack

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Custom Properties for theming
- **Layout**: CSS Grid/Flexbox for responsive design
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
- **Fallback**: OpenAI GPT-4
  - Used if Gemini unavailable
  - Requires separate API key

### Google Integration
- **Required APIs**:
  - Google Drive API v3
  - Google Docs API v1
  - Google OAuth 2.0
- **Scopes**:
  ```
  https://www.googleapis.com/auth/drive.file
  https://www.googleapis.com/auth/docs
  ```

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
# Google API Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

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
# Server
/server/
  ├── index.js              # Entry point
  ├── routes/              # Route definitions
  │   └── auth.js         # Auth routes
  ├── controllers/        # Request handlers
  │   └── authController.js
  ├── config/            # Configuration
  │   └── google.js     # OAuth config
  └── package.json      # Dependencies

# Frontend
/client/
  ├── index.html          # Main HTML with chat interface
  ├── styles/
  │   └── main.css       # All styles (dark theme, messages, animations)
  ├── scripts/
  │   └── app.js         # Frontend logic (chat, input handling)
  └── gorlea-logo.png    # App logo
```

### Frontend Features
- ChatGPT-style welcome screen
- Auto-expanding message input
- Smooth message animations
- Dark theme with gold accents
- Responsive mobile-first design

### Required Dependencies

#### Backend
```json
{
  "dependencies": {
    "express": "^4.18.3",
    "express-session": "^1.18.0",
    "dotenv": "^16.4.5",
    "axios": "^1.6.7",
    "open": "^10.1.0"
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
    "marked": "latest",     // Markdown rendering
    "dompurify": "latest"   // XSS prevention
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
- AI Processing: < 3s

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
- OAuth success rate
- Document operations

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
