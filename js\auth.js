// Authentication System

// Authentication functions
function login(email, password) {
    return new Promise((resolve, reject) => {
        // For demo purposes, using hardcoded credentials
        const demoCredentials = {
            email: 'demo@example.com',
            password: 'demo123'
        };

        if (email === demoCredentials.email && password === demoCredentials.password) {
            // Set authentication token
            localStorage.setItem('auth_token', 'demo_token');
            localStorage.setItem('user_email', email);
            resolve({ success: true });
        } else {
            reject(new Error('Invalid credentials'));
        }
    });
}

function logout() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    // Redirect to login page
    window.location.href = 'login.html';
}

function isAuthenticated() {
    return localStorage.getItem('auth_token') !== null;
}

function getCurrentUser() {
    return localStorage.getItem('user_email');
}

// Export functions
window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;

// Initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (isLoginPage) {
        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    await login(email, password);
                    window.location.href = 'index.html';
                } catch (error) {
                    // Show error message
                    const errorElement = document.getElementById('loginError');
                    if (errorElement) {
                        errorElement.textContent = error.message;
                        errorElement.style.display = 'block';
                    }
                }
            });
        }
    } else {
        // Check authentication for other pages
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Setup logout button
        const logoutButton = document.querySelector('[onclick="logout()"]');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }

        // Update UI with user data
        const userData = getCurrentUser();
        if (userData) {
            // Update user name in header
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = userData;
            }

            // Update user avatar if exists
            const userAvatar = document.querySelector('.avatar');
            if (userAvatar) {
                // Removed avatar update logic as it's not provided in the new code
            }
        }
    }
});
