require('dotenv').config({ path: '../.env' }); // Explicitly load root .env file
const express = require('express');
const expressSession = require('express-session');
const path = require('path');
// const { default: open } = require('open'); // Removed for Railway deployment
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const docsRoutes = require('./routes/docs');
const userRoutes = require('./routes/user');
const { requireAuth } = require('./middleware/auth');
const { Firestore } = require('@google-cloud/firestore');
const { FirestoreStore } = require('@google-cloud/connect-firestore');
const { db } = require('./utils/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// Define static path early for use in routes
const staticPath = path.join(__dirname, '../client-vite/dist');

// Session configuration with FirestoreStore
app.use(expressSession({
  store: new FirestoreStore({
    dataset: db,
    kind: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    // sameSite: 'lax', // Consider adding 'lax' or 'strict' in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
// Mount API routes BEFORE static file serving and catch-all
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/docs', requireAuth, docsRoutes);

// --- Explicit HTML Routes ---
// Serve specific HTML files for direct navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'), (err) => {
    if (err) res.status(404).send('Home page not found'); // Handle potential error
  });
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'login.html'), (err) => {
    if (err) res.status(404).send('Login page not found');
  });
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'register.html'), (err) => {
    if (err) res.status(404).send('Register page not found');
  });
});
app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'chat.html'), (err) => {
    if (err) res.status(404).send('Chat page not found');
  });
});
// Handle both /docs and /docs/index.html
app.get(['/docs', '/docs/index.html'], (req, res) => {
  res.sendFile(path.join(staticPath, 'docs/index.html'), (err) => {
    if (err) res.status(404).send('Docs list page not found');
  });
});
app.get('/docs/editor.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'docs/editor.html'), (err) => {
    if (err) res.status(404).send('Editor page not found');
  });
});

// --- Static Assets Route ---
// Serve other static files (CSS, JS, images) AFTER specific HTML routes
app.use(express.static(staticPath));

// --- Optional: Catch-all for 404 ---
// If none of the above matched, send a 404
app.use((req, res) => {
  res.status(404).send("Sorry, can't find that!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API routes available at /api/...');
  // open(`http://localhost:${PORT}`); // Removed for Railway deployment
});
