// Middleware to check if a user is authenticated via session
exports.requireAuth = (req, res, next) => {
    // Check if the session exists and if the user object is stored in the session
    if (req.session && req.session.user) {
        // User is authenticated, proceed to the next middleware or route handler
        return next();
    } else {
        // User is not authenticated
        console.warn('Authentication required: No active user session found.');
        return res.status(401).json({ message: 'Authentication required.' }); // Unauthorized
    }
};