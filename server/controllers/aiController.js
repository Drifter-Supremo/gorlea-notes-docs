const axios = require('axios');
const { searchDocs, createNewDoc, appendToDoc } = require('../utils/googleDocs');

/**
 * Rewrites a note using AI to improve clarity and structure
 * @param {Request} req - Express request object with note in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with cleaned note or error
 */
const rewriteNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Note content is required'
        }
      });
    }

    // Call Gemini 2.0 Flash API to rewrite the note
    const rewriteResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [
          {
            parts: [{ text: `You are Gorlea, a smart AI note assistant. Always respond in plain text without any formatting. Just rewrite this note in a clearer and more structured way. Then on a new line, ask "Would you like me to save this to an existing doc, or start a new one? Just tell me the name."\n\n"${note}"` }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: process.env.GEMINI_API_KEY,
        },
      }
    );

    // Extract the cleaned text from Gemini 2.0's response
    const cleaned = rewriteResponse.data.candidates[0].content.parts[0].text;

    return res.json({
      success: true,
      data: { cleaned }
    });

  } catch (error) {
    console.error('AI Rewrite Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle specific error types
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AI_PROCESSING_ERROR',
        message: 'Failed to process note'
      }
    });
  }
};

/**
 * Save a rewritten note to Google Docs
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with doc info or error
 */
const saveNote = async (req, res) => {
  try {
    const { docName, content } = req.body;
    const tokens = req.session.tokens;

    if (!docName || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Doc name and content are required'
        }
      });
    }

    console.log('Save Note - Tokens present:', !!tokens);
    console.log('Save Note - Doc name:', docName);

    // Search for existing docs with similar name
    const docs = await searchDocs(tokens, docName);
    console.log('Save Note - Search results:', docs);

    if (docs.length > 0) {
      // Use the first matching doc
      const doc = docs[0];
      const result = await appendToDoc(tokens, doc.id, content);
      
      return res.json({
        success: true,
        data: {
          docId: result.id,
          title: result.title,
          action: 'appended'
        }
      });
    } else {
      // No matching doc found, ask for confirmation
      return res.json({
        success: true,
        data: {
          needsConfirmation: true,
          suggestedTitle: docName
        }
      });
    }

  } catch (error) {
    console.error('Save Note Error:', {
      message: error.message,
      stack: error.stack,
      tokens: !!req.session.tokens,
      docName: req.body.docName
    });
    return res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_ERROR',
        message: 'Failed to save note'
      }
    });
  }
};

/**
 * Create a new Google Doc with the note
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with doc info or error
 */
const createDoc = async (req, res) => {
  try {
    const { title, content } = req.body;
    const tokens = req.session.tokens;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Title and content are required'
        }
      });
    }

    const result = await createNewDoc(tokens, title, content);
    
    return res.json({
      success: true,
      data: {
        docId: result.id,
        title: result.title,
        action: 'created'
      }
    });

  } catch (error) {
    console.error('Create Doc Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create document'
      }
    });
  }
};

module.exports = { rewriteNote, saveNote, createDoc };
