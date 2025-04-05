// Controller to get the current user's information from the session
exports.getCurrentUser = (req, res) => {
    if (req.session && req.session.user) {
        // User is authenticated, return their info (id and email) directly
        res.status(200).json(req.session.user); // Return user object directly
    } else {
        // No user session found
        res.status(401).json({ message: 'Not authenticated.' }); // Unauthorized
    }
};