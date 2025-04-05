/**
 * Checks the user's authentication status by calling the /api/user/me endpoint.
 * Redirects the user based on their status and the current page.
 * - If on login/register page and logged in, redirect to chat.
 * - If on a protected page (not login/register) and not logged in, redirect to login.
 */
async function checkAuthStatus() {
    const currentPage = window.location.pathname;
    const isAuthPage = currentPage.includes('/login.html') || currentPage.includes('/register.html');
    const protectedPages = ['/chat.html', '/docs/index.html', '/docs/editor.html']; // Added editor page
    const isProtectedPage = protectedPages.some(page => currentPage.includes(page));

    try {
        const response = await fetch('/api/user/me', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            // User is logged in
            const userData = await response.json(); // Get user data
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement && userData && userData.email) {
                userEmailElement.textContent = userData.email; // Display the email
                userEmailElement.style.display = ''; // Ensure display is not none if previously hidden
            } else if (userEmailElement) {
                 // If user data or email is missing, hide the element
                 userEmailElement.style.display = 'none';
            }

            if (isAuthPage) {
                console.log('User logged in, redirecting from auth page to chat.');
                window.location.href = '/chat.html'; // Or the main app page
            }
            // If on a protected page, they are allowed, do nothing.
        } else if (response.status === 401) {
            // User is not logged in
            if (isProtectedPage) {
                console.log('User not logged in, redirecting from protected page to login.');
                window.location.href = '/login.html';
            }
            // If on login/register page, they are allowed, do nothing.
            // Hide user email element if not logged in
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.style.display = 'none';
            }
        } else {
            // Handle other potential errors (e.g., server error)
            // Handle other potential errors (e.g., server error)
            console.error('Error checking auth status:', response.status, response.statusText);
            // Optionally display a generic error message to the user
             const userEmailElementOnError = document.getElementById('user-email');
            if (userEmailElementOnError) {
                userEmailElementOnError.style.display = 'none'; // Hide on error
            }
        }
    } catch (error) {
        console.error('Network error checking auth status:', error);
        // Handle network errors, maybe show a message
        // If the backend is down, we might want to prevent access to protected pages
        // Also hide user email element on network error
        const userEmailElementOnNetworkError = document.getElementById('user-email');
        if (userEmailElementOnNetworkError) {
            userEmailElementOnNetworkError.style.display = 'none'; // Hide on network error
        }
        if (isProtectedPage) {
             console.warn('Network error, cannot verify auth. Redirecting to login as a precaution.');
             // window.location.href = '/login.html'; // Decide if redirection is desired on network error
        }
    }
}

/**
 * Displays an error message on the form.
 * @param {string} formId - The ID of the form ('login-form' or 'register-form').
 * @param {string} message - The error message to display.
 */
function displayFormError(formId, message) {
    const errorElement = document.querySelector(`#${formId} #error-message`);
    if (errorElement) {
        errorElement.textContent = message;
    } else {
        console.error(`Could not find error message element for form ${formId}`);
    }
}

/**
 * Clears the error message on the form.
 * @param {string} formId - The ID of the form ('login-form' or 'register-form').
 */
function clearFormError(formId) {
    const errorElement = document.querySelector(`#${formId} #error-message`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Run auth check as soon as the DOM is ready
    // We don't await this, as it handles its own redirection
    checkAuthStatus();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Login Form Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormError('login-form');
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const errorMessageElement = document.getElementById('error-message');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Login successful:', data.message);
                    window.location.href = '/chat.html'; // Redirect to main app
                } else {
                    console.error('Login failed:', data.message);
                    displayFormError('login-form', data.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Network error during login:', error);
                displayFormError('login-form', 'Login failed due to a network error. Please try again.');
            }
        });
    }

    // --- Register Form Handler ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormError('register-form');
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value; // Get value from the new field

            // Add password confirmation check
            if (password !== confirmPassword) {
                displayFormError('register-form', 'Passwords do not match.');
                return; // Stop submission if passwords don't match
            }
            // if (password !== confirmPassword) {
            //     displayFormError('register-form', 'Passwords do not match.');
            //     return;
            // }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok || response.status === 201) { // Handle 201 Created status
                    console.log('Registration successful:', data.message);
                    // Redirect to login page after successful registration
                    window.location.href = '/login.html?registered=true'; // Add query param for potential feedback
                } else {
                    console.error('Registration failed:', data.message);
                    displayFormError('register-form', data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Network error during registration:', error);
                displayFormError('register-form', 'Registration failed due to a network error. Please try again.');
            }
        });
    }

    // --- Logout Functionality (Example - needs a trigger) ---
    // This function can be called from a logout button in the main app (e.g., chat.html)
    window.logoutUser = async () => { // Make it global for easy access from HTML onclick or other scripts
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (response.ok) {
                console.log('Logout successful');
                window.location.href = '/login.html';
            } else {
                const data = await response.json();
                console.error('Logout failed:', data.message || response.statusText);
                // Handle logout error - maybe inform user?
                alert('Logout failed. Please try again.'); // Simple alert for now
            }
        } catch (error) {
            console.error('Network error during logout:', error);
            alert('Logout failed due to a network error.');
        }
    };

    // Example: Add logout button handler if a button with id="logout-button" exists
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', window.logoutUser);
    }

}); // End DOMContentLoaded