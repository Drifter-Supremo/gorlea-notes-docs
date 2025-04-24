// Import main styles
import './styles/main.css';

console.log("Main entry point loaded.");

// Enhanced: Intercept Gorlea Docs button to preserve intent after login

document.addEventListener('DOMContentLoaded', () => {
    const docsBtn = document.querySelector('.nav-button[href="/docs/index.html"]');
    if (docsBtn) {
        docsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            // Check auth status
            try {
                const resp = await fetch('/api/user/me', { credentials: 'include' });
                if (resp.ok) {
                    // Already logged in
                    window.location.href = '/docs/index.html';
                } else {
                    // Not logged in: redirect to login with redirect param
                    window.location.href = '/login.html?redirect=/docs/index.html';
                }
            } catch {
                // On error, fail safe: go to login
                window.location.href = '/login.html?redirect=/docs/index.html';
            }
        });
    }
});

// Add loaded class on DOMContentLoaded for fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const landingContainer = document.querySelector('.landing-container');
    if (landingContainer) {
        landingContainer.classList.add('loaded');
    }
});
