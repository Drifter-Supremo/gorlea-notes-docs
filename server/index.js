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

// --- Static Files & Frontend Routing ---
// Serve static files from the Vite build output directory
const staticPath = path.join(__dirname, '../client-vite/dist');
app.use(express.static(staticPath));

// Catch-all route to serve index.html for frontend routing
// This should be AFTER all API routes and static file serving
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API routes available at /api/...');
  // open(`http://localhost:${PORT}`); // Removed for Railway deployment
});
