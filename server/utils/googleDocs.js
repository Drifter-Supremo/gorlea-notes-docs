const { google } = require('googleapis');
const config = require('../config/google');

/**
 * Format current timestamp for doc entries
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = () => {
  const now = new Date();
  return `🕒 ${now.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;
};

/**
 * Search for docs with similar titles
 * @param {Object} tokens - Google OAuth tokens
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching documents
 */
const searchDocs = async (tokens, query) => {
  console.log('Search Docs - Starting search with query:', query);
  
  const auth = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
  auth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });
  
  const drive = google.drive({ version: 'v3', auth });
  
  try {
    console.log('Search Docs - Initialized Google Drive API');
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.document' and name contains '${query}'`,
      fields: 'files(id, name)',
      orderBy: 'modifiedTime desc'
    });

    console.log('Search Docs - API Response:', response.data);
    return response.data.files;
  } catch (error) {
    console.error('Error searching docs:', {
      message: error.message,
      stack: error.stack,
      query,
      hasTokens: !!tokens
    });
    throw error;
  }
};

/**
 * Create a new Google Doc
 * @param {Object} tokens - Google OAuth tokens
 * @param {string} title - Document title
 * @param {string} content - Document content
 * @returns {Promise<Object>} Created document info
 */
const createNewDoc = async (tokens, title, content) => {
  const auth = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
  auth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer'
  });
  
  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });
  
  try {
    // Create empty doc
    const file = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: 'application/vnd.google-apps.document'
      }
    });

    // Add content using Docs API
    const formattedContent = `${formatTimestamp()}\n${content}\n---\n`;
    
    await docs.documents.batchUpdate({
      documentId: file.data.id,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: formattedContent
          }
        }]
      }
    });

    return {
      id: file.data.id,
      title: title
    };
  } catch (error) {
    console.error('Error creating doc:', error);
    throw error;
  }
};

/**
 * Append content to an existing Google Doc
 * @param {Object} tokens - Google OAuth tokens
 * @param {string} docId - Document ID
 * @param {string} content - Content to append
 * @returns {Promise<Object>} Updated document info
 */
const appendToDoc = async (tokens, docId, content) => {
  const auth = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
  auth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer'
  });
  
  const docs = google.docs({ version: 'v1', auth });
  
  try {
    // Get document
    const doc = await docs.documents.get({ documentId: docId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

    // Append content with timestamp and separator
    const formattedContent = `\n${formatTimestamp()}\n${content}\n---\n`;
    
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: endIndex - 1 },
            text: formattedContent
          }
        }]
      }
    });

    return {
      id: docId,
      title: doc.data.title
    };
  } catch (error) {
    console.error('Error appending to doc:', error);
    throw error;
  }
};

module.exports = {
  searchDocs,
  createNewDoc,
  appendToDoc,
  formatTimestamp
};
