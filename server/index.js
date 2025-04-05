require('dotenv').config();
const express = require('express');
const expressSession = require('express-session'); // Renamed module import
const path = require('path');
const { default: open } = require('open');
const authRoutes = require('./routes/auth'); // Now for email/pass auth
const aiRoutes = require('./routes/ai');
const docsRoutes = require('./routes/docs');
const userRoutes = require('./routes/user'); // Import user routes
const { requireAuth } = require('./middleware/auth'); // Import new middleware
// const { db } = require('./utils/firestore'); // Keep this import if db is used elsewhere, otherwise remove
const { Firestore } = require('@google-cloud/firestore'); // Needed for FirestoreStore dataset
const { FirestoreStore } = require('@google-cloud/connect-firestore'); // Import FirestoreStore directly
const { firestoreClient } = require('./utils/firestore'); // Import the firestoreClient

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration with FirestoreStore
app.use(expressSession({ // Use renamed module import to get middleware
  store: new FirestoreStore({
    dataset: firestoreClient, // Use the firestoreClient instance
    kind: 'sessions' // Collection name in Firestore
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    // sameSite: 'lax', // Temporarily removed for local dev proxy testing
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Old inline auth middleware removed (now using middleware/auth.js)
// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/docs', express.static(path.join(__dirname, '../client/docs')));

// Mount routes
// Mount API routes
app.use('/api/auth', authRoutes); // Email/Password auth routes
app.use('/api/user', userRoutes); // User related routes (like /me)
app.use('/api/ai', requireAuth, aiRoutes); // Protect AI routes
app.use('/api/docs', requireAuth, docsRoutes); // Protect Docs API routes
// Landing page route
app.get('/', (req, res) => {
  // Check for the new session user object
  if (req.session.user) {
    return res.redirect('/chat');
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Chat route (requires auth)
app.get('/chat', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/chat.html'));
});

// Docs route (requires auth)
app.get('/docs', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/docs/index.html'));
});

// Start server and open browser
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running on ${url}`);
  console.log('Available routes:');
  console.log('  GET  /                     - Home page');
  console.log('  POST /api/auth/register    - Register new user {email, password}');
  console.log('  POST /api/auth/login       - Login user {email, password}');
  console.log('  POST /api/auth/logout      - Logout user');
  console.log('  GET  /api/user/me          - Get current user info (requires auth)');
  console.log('  GET  /chat                 - Chat page (requires auth)');
  console.log('  GET  /docs                 - Docs page (requires auth)');
  console.log('  GET  /api/docs             - List documents (requires auth)');
  console.log('  POST /api/docs             - Create document (requires auth)');
  // ... other /api/docs routes ...
  console.log('  POST /api/ai/process       - Process AI request (requires auth)');
  // Open browser
  open(url);
});
