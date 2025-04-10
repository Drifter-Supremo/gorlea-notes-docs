// Import main styles
import './styles/main.css';

console.log("Main entry point loaded.");

// Add any specific JS for the landing page here if needed in the future.

// Add loaded class on DOMContentLoaded for fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const landingContainer = document.querySelector('.landing-container');
    if (landingContainer) {
        landingContainer.classList.add('loaded');
    }
});
