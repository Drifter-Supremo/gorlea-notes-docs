require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',  // For file creation/editing
  'https://www.googleapis.com/auth/docs'         // For Google Docs access
];

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scopes: SCOPES,
  
  // Google OAuth endpoints
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',

  // Generate OAuth URL
  getAuthUrl() {
    const url = new URL(this.authUrl);
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('redirect_uri', this.redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', this.scopes.join(' '));
    url.searchParams.append('access_type', 'offline');
    url.searchParams.append('prompt', 'consent');
    return url.toString();
  }
};

module.exports = config;
