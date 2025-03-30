require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { default: open } = require('open');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const docsRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
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

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.tokens) {
    return res.redirect('/?error=' + encodeURIComponent('Please sign in'));
  }
  next();
};

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/docs', express.static(path.join(__dirname, '../client/docs')));

// Mount routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // Mount auth routes at /api/auth too for status endpoint
app.use('/api/ai', aiRoutes);
app.use('/api/docs', docsRoutes);

// Landing page route
app.get('/', (req, res) => {
  if (req.session.tokens) {
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
  console.log('  GET  /              - Home page');
  console.log('  GET  /auth/login    - Initiate Google OAuth');
  console.log('  GET  /auth/callback - OAuth callback');
  console.log('  GET  /auth/logout   - Logout');
  
  // Open browser
  open(url);
});
