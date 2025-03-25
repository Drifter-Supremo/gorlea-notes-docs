const axios = require('axios');

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

    console.log('Sending note to Gemini:', note);

    // Call Gemini 2.0 Flash API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [
          {
            parts: [{ text: `You are Gorlea, a smart AI note assistant. Always respond in plain text without any formatting. Just rewrite this note in a clearer and more structured way:\n\n"${note}"` }],
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

    console.log('Gemini response:', JSON.stringify(response.data, null, 2));

    // Extract the cleaned text from Gemini 2.0's response
    const cleaned = response.data.candidates[0].content.parts[0].text;

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

module.exports = { rewriteNote };
