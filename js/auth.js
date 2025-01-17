// Global state
let isInitialized = false;
let isRedirecting = false;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 2000; // 2 seconds cooldown between redirects

// Check if user is logged in
async function checkAuth() {
    if (isRedirecting) {
        console.log('Already redirecting, skipping auth check');
        return;
    }

    const now = Date.now();
    if ((now - lastRedirectTime) < REDIRECT_COOLDOWN) {
        console.log('Redirect prevented - too soon');
        return;
    }

    console.log('Checking authentication...');
    
    // Get current path and strip any leading/trailing slashes
    const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');
    const isIndexPage = currentPath === '' || currentPath.includes('index.html');
    
    // Get auth status
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const username = sessionStorage.getItem('username');
    
    console.log('Auth check:', { isLoggedIn, username, currentPath, isAuthPage, isIndexPage });
    
    try {
        if (isLoggedIn && username) {
            // Update UI if on dashboard
            if (isIndexPage) {
                updateUserUI();
            }
            // Redirect if on auth page
            else if (isAuthPage) {
                console.log('Logged in user on auth page, redirecting to index...');
                isRedirecting = true;
                lastRedirectTime = now;
                window.location.replace('index.html');
            }
        } else if (!isAuthPage) {
            console.log('Not logged in and not on auth page, redirecting to login...');
            isRedirecting = true;
            lastRedirectTime = now;
            window.location.replace('login.html');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        isRedirecting = false;
    }
}

// Register function
async function register(event) {
    event.preventDefault();
    console.log('Register function called');
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const fullName = document.getElementById('fullName').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation
        if (!fullName || !username || !email || !password) {
            throw new Error('All fields are required');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Check if username exists
        console.log('Checking if username exists:', username);
        const existingUser = await window.db.getUser(username);
        
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Create user
        console.log('Creating new user...');
        const user = {
            fullName,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        await window.db.addUser(user);
        console.log('User registered successfully');

        // Set session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('fullName', fullName);
        sessionStorage.setItem('email', email);
        
        // Use the new redirect mechanism
        isRedirecting = true;
        lastRedirectTime = Date.now();
        window.location.replace('index.html');

    } catch (error) {
        console.error('Registration error:', error);
        const errorElement = document.getElementById('registerError');
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    } finally {
        submitButton.disabled = false;
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Login function
async function login(event) {
    if (isRedirecting) return;
    event.preventDefault();
    console.log('Login function called');
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        console.log('Validating credentials...');
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // Check credentials
        console.log('Checking credentials for username:', username);
        const user = await window.db.getUser(username);
        
        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }

        console.log('Login successful');

        // Set session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('fullName', user.fullName);
        sessionStorage.setItem('email', user.email);
        
        // Use redirect lock
        isRedirecting = true;
        lastRedirectTime = Date.now();
        window.location.replace('index.html');

    } catch (error) {
        console.error('Login error:', error);
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    } finally {
        if (!isRedirecting) {
            submitButton.disabled = false;
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }
}

// Logout function
function logout() {
    if (isRedirecting) return;
    
    console.log('Logging out...');
    sessionStorage.clear();
    
    try {
        const sessionToken = sessionStorage.getItem('sessionToken');
        if (sessionToken) {
            window.db.invalidateSession(sessionToken);
        }
    } catch (error) {
        console.error('Error invalidating session:', error);
    }
    
    isRedirecting = true;
    lastRedirectTime = Date.now();
    window.location.replace('login.html');
}

// Update UI with user info
function updateUserUI() {
    const username = sessionStorage.getItem('username');
    const fullName = sessionStorage.getItem('fullName') || username;
    const email = sessionStorage.getItem('email') || 'No email provided';
    
    const fullNameElement = document.getElementById('userFullName');
    const emailElement = document.getElementById('userEmail');
    
    if (fullNameElement) fullNameElement.textContent = fullName;
    if (emailElement) emailElement.textContent = email;
}

// Initialize auth module
async function init() {
    if (isInitialized || isRedirecting) {
        console.log('Auth module already initialized or redirect in progress');
        return;
    }
    
    try {
        console.log('Initializing auth module...');
        await window.db.init();
        isInitialized = true;
        
        // Initial auth check
        await checkAuth();
        
        // Set up periodic auth check
        setInterval(checkAuth, 30000); // Check every 30 seconds
        
    } catch (error) {
        console.error('Failed to initialize auth module:', error);
        throw error;
    }
}

// Export functions
window.auth = {
    register,
    login,
    logout,
    checkAuth,
    updateUserUI,
    init
};