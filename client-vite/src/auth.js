/**
 * Checks the user's authentication status by calling the /api/user/me endpoint.
 * Redirects the user based on their status and the current page.
 * - If on login/register page and logged in, redirect to chat.
 * - If on a protected page (not login/register) and not logged in, redirect to login.
 */

// API Base URL - Removed as we'll use relative paths
// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

async function checkAuthStatus() {
    const currentPage = window.location.pathname;
    // Simplified check: If it's not exactly /login.html or /register.html, assume it's protected
    const isAuthPage = currentPage.endsWith('/login.html') || currentPage.endsWith('/register.html');
    const isProtectedPage = !isAuthPage; // Any page that isn't login/register is considered protected

    try {
        // Use relative path for the fetch call
        const response = await fetch('/api/user/me', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // credentials: 'include' // Assuming cookies handle authentication
        });

        const userEmailElement = document.getElementById('user-email'); // Get email element reference

        if (response.ok) {
            // User is logged in
            const userData = await response.json(); // Get user data
            if (userEmailElement && userData && userData.email) {
                userEmailElement.textContent = userData.email; // Display the email
                userEmailElement.style.display = 'inline'; // Make sure it's visible
            } else if (userEmailElement) {
                 userEmailElement.style.display = 'none'; // Hide if no email data
            }

            if (isAuthPage) {
                console.log('User logged in, redirecting from auth page to chat.');
                window.location.href = '/chat.html'; // Redirect to chat page
            }
            // If on a protected page, they are allowed, do nothing.
        } else if (response.status === 401) {
            // User is not logged in
            if (userEmailElement) {
                userEmailElement.style.display = 'none'; // Hide email element
            }
            if (isProtectedPage) {
                console.log('User not logged in, redirecting from protected page to login.');
                window.location.href = '/login.html'; // Redirect to login page
            }
            // If on login/register page, they are allowed, do nothing.
        } else {
            // Handle other potential server errors (e.g., 500)
            console.error('Error checking auth status:', response.status, response.statusText);
            if (userEmailElement) {
                userEmailElement.style.display = 'none'; // Hide email element on error
            }
            // Optionally display a generic error message to the user on the current page
            // Consider if redirection is needed even on server errors for protected pages
            if (isProtectedPage) {
                 console.warn('Server error checking auth. User might not be authenticated.');
                 // window.location.href = '/login.html'; // Optional: Redirect on server error too?
            }
        }
    } catch (error) {
        console.error('Network error checking auth status:', error);
        // Handle network errors (e.g., backend is down)
        const userEmailElementOnNetworkError = document.getElementById('user-email');
        if (userEmailElementOnNetworkError) {
            userEmailElementOnNetworkError.style.display = 'none'; // Hide email element on network error
        }
        // Decide how to handle network errors on protected pages
        if (isProtectedPage) {
             console.warn('Network error, cannot verify auth. Redirecting to login as a precaution.');
             // window.location.href = '/login.html'; // Redirecting might be safest
        }
    }
}

/**
 * Displays an error message on the form.
 * @param {string} formId - The ID of the form ('login-form' or 'register-form').
 * @param {string} message - The error message to display.
 */
function displayFormError(formId, message) {
    // Use more specific selector to avoid conflicts if multiple forms exist
    const errorElement = document.querySelector(`#${formId} .error-message`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error(`Could not find error message element for form ${formId}`);
    }
}

/**
 * Clears the error message on the form.
 * @param {string} formId - The ID of the form ('login-form' or 'register-form').
 */
function clearFormError(formId) {
    const errorElement = document.querySelector(`#${formId} .error-message`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none'; // Hide the element
    }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Run auth check as soon as the DOM is ready
    checkAuthStatus(); // No need to await this

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Login Form Handler ---
    if (loginForm) {
        // Add error message placeholder if not present in HTML
        if (!loginForm.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'login-error-message'; // Assign an ID for targeting
            errorDiv.className = 'error-message'; // Add class for styling
            errorDiv.style.color = 'red'; // Basic styling
            errorDiv.style.display = 'none'; // Initially hidden
            loginForm.appendChild(errorDiv); // Append it to the form
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormError('login-form'); // Clear previous errors
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                // Use relative path for the fetch call
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json', // Indicate expected response type
                    },
                    body: JSON.stringify({ email, password }),
                    // credentials: 'include' // Usually needed if using cookies/sessions across origins
                });

                const data = await response.json(); // Always try to parse JSON

                if (response.ok) {
                    console.log('Login successful:', data.message || 'OK');
                    // Successful login, redirect to chat page
                    window.location.href = '/chat.html';
                } else {
                    // Handle specific error statuses or use the message from the backend
                    console.error('Login failed:', data.message || `HTTP error ${response.status}`);
                    displayFormError('login-form', data.message || `Login failed (Status: ${response.status})`);
                }
            } catch (error) {
                console.error('Network error during login:', error);
                displayFormError('login-form', 'Login failed due to a network error. Please try again.');
            }
        });
    }

    // --- Register Form Handler ---
    if (registerForm) {
         // Add error message placeholder if not present in HTML
        if (!registerForm.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'register-error-message'; // Assign an ID
            errorDiv.className = 'error-message';
            errorDiv.style.color = 'red';
            errorDiv.style.display = 'none';
            // Insert it before the submit button or at the end
            registerForm.insertBefore(errorDiv, registerForm.querySelector('button[type="submit"]'));
        }

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormError('register-form'); // Clear previous errors
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;

            // Basic client-side validation
            if (password !== confirmPassword) {
                displayFormError('register-form', 'Passwords do not match.');
                return;
            }
            if (!email || !password) {
                 displayFormError('register-form', 'Email and password cannot be empty.');
                 return;
            }

            try {
                // Use relative path for the fetch call
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    // credentials: 'include' // May not be needed for registration itself
                });

                const data = await response.json(); // Always try to parse JSON

                if (response.ok || response.status === 201) { // Handle 201 Created status
                    console.log('Registration successful:', data.message || 'User created');
                    // Redirect to login page after successful registration
                    // Optionally pass a query param to show a success message on the login page
                    window.location.href = '/login.html?registered=true';
                } else {
                    // Handle specific error statuses or use the message from the backend
                    console.error('Registration failed:', data.message || `HTTP error ${response.status}`);
                    displayFormError('register-form', data.message || `Registration failed (Status: ${response.status})`);
                }
            } catch (error) {
                console.error('Network error during registration:', error);
                displayFormError('register-form', 'Registration failed due to a network error. Please try again.');
            }
        });
    }

    // --- Logout Functionality ---
    // Make logout function globally accessible IF NEEDED from HTML inline onclick
    // It's generally better to attach listeners programmatically like above
    window.logoutUser = async () => {
        console.log('Attempting logout...');
        try {
            // Use relative path for the fetch call
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json', // Expect JSON response
                },
                // credentials: 'include' // Include credentials (like cookies) if needed for logout
            });

            // Check if logout was successful (e.g., backend sends 200 OK or 204 No Content)
            if (response.ok) {
                console.log('Logout successful');
                // Redirect to login page after successful logout
                window.location.href = '/login.html?loggedout=true'; // Add query param for feedback
            } else {
                // Try to parse error message from backend
                let errorMsg = `Logout failed with status: ${response.status}`;
                try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                console.error('Logout failed:', errorMsg);
                alert(`Logout failed: ${errorMsg}`); // Inform user
            }
        } catch (error) {
            console.error('Network error during logout:', error);
            alert('Logout failed due to a network error. Please try again.');
        }
    };

    // Example: Attach logout handler to a button with id="logout-button"
    // This is better practice than using onclick="" in HTML
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', window.logoutUser);
    }

}); // End DOMContentLoaded
