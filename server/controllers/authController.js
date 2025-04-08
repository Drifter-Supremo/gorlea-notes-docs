const bcrypt = require('bcrypt');
const firestoreUtils = require('../utils/firestore');

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

// Controller for user registration
exports.register = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (password.length < 6) { // Example: Enforce minimum password length
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user in Firestore
        const newUser = await firestoreUtils.createUser(email, hashedPassword);

        console.log(`User registered successfully: ${newUser.email}`);
        // Respond with success (don't log in automatically on register)
        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.warn(`Registration failed: Email already exists - ${email}`);
            return res.status(409).json({ message: 'Email already in use.' }); // 409 Conflict
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Controller for user login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const user = await firestoreUtils.findUserByEmail(email);
        
        // console.log('DEBUG: Full user object from Firestore:', JSON.stringify(user, null, 2)); // Removed debug log

        if (!user) {
            console.warn(`Login failed: User not found - ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
        }

        // Compare provided password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.warn(`Login failed: Invalid password for user - ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
        }

        // --- Establish Session ---
            // Store essential, non-sensitive user info in the session
            req.session.user = {
                id: user.id, // This will now use the correct userId from firestoreUtils.findUserByEmail
                email: user.email
            };
            console.log('Session created with user ID:', req.session.user.id);
        // Note: express-session handles saving the session automatically on response end

        console.log(`User logged in successfully: ${user.email}`);
        // Respond with success and user info (excluding password hash)
        res.status(200).json({
            message: 'Login successful.',
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Controller for user logout
exports.logout = (req, res) => {
    if (req.session.user) {
        const userEmail = req.session.user.email; // Log who is logging out
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ message: 'Could not log out, please try again.' });
            }
            console.log(`User logged out: ${userEmail}`);
            res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
            res.status(200).json({ message: 'Logout successful.' });
        });
    } else {
        // No active session to destroy
        res.status(200).json({ message: 'No active session to log out.' });
    }
};
