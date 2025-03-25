const axios = require('axios');
const googleConfig = require('../config/google');

const authController = {
  // Initiate login by redirecting to Google OAuth
  async login(req, res) {
    const authUrl = googleConfig.getAuthUrl();
    res.redirect(authUrl);
  },

  // Handle OAuth callback
  async callback(req, res) {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    try {
      // Exchange code for tokens
      const response = await axios.post(googleConfig.tokenUrl, {
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: googleConfig.redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token } = response.data;

      // Store tokens in session
      req.session.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token
      };

      // Redirect to app home
      res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error.message);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Handle logout
  async logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.redirect('/');
    });
  }
};

module.exports = authController;
