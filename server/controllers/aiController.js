const axios = require('axios');
// Remove Google Docs utils, import Firestore utils
// const { searchDocs, createNewDoc, appendToDoc } = require('../utils/googleDocs'); 
const firestoreUtils = require('../utils/firestore');

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
            // Reverted to simpler prompt
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
 * @returns {Promise<Response>} JSON response with action status or error
 */
const saveNote = async (req, res) => {
  try {
    // docName is the potential title the user mentioned
    const { docName, content } = req.body; 
    // const tokens = req.session.tokens; // No longer needed for Firestore interaction directly here

    if (!docName || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Doc name and content are required'
        }
      });
    }

    // console.log('Save Note - Tokens present:', !!tokens); // Removed token log
    console.log('Save Note - Attempting to save to doc title:', docName);

    // Search for existing doc in Firestore by title
    const existingDoc = await firestoreUtils.findDocumentByTitle(docName);
    console.log('Save Note - Firestore search result:', existingDoc ? `Found ID: ${existingDoc.id}` : 'Not Found');

    if (existingDoc) {
      // Append to the existing doc
      await firestoreUtils.appendContent(existingDoc.id, content);
      
      // Return success indicating append action
      return res.json({
        success: true,
        data: {
          // docId: existingDoc.id, // Optionally return ID
          title: existingDoc.title, // Return the actual title found
          action: 'appended' // Indicate action taken
        }
      });
    } else {
      // No matching doc found, ask for confirmation to create
      // Use the user-provided docName as the suggested title
      return res.json({
        success: true,
        data: {
          needsConfirmation: true, // Signal frontend to ask user
          suggestedTitle: docName // Pass back the name user tried
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
 * @returns {Promise<Response>} JSON response with new doc info or error
 */
const createDoc = async (req, res) => {
  try {
    const { title, content } = req.body;
    // const tokens = req.session.tokens; // No longer needed

    // Title is optional here, Firestore util defaults it
    if (!content) { // Content is required though
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Title and content are required'
        }
      });
    }

    // Call the modified Firestore utility to create the document
    const newDoc = await firestoreUtils.createDocument(title, content); 
    
    // Return success indicating creation and new doc details
    return res.json({
      success: true,
      data: {
        docId: newDoc.id,
        title: newDoc.title, // Return the actual title (might be defaulted)
        action: 'created' // Indicate action taken
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
