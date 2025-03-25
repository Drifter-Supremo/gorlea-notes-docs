require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { default: open } = require('open');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Mount routes
app.use('/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Basic home route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
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
