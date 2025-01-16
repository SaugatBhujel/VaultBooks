// Check if user is logged in
async function checkAuth() {
    console.log('Checking auth...');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    console.log('Is logged in:', isLoggedIn);
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    // If user is logged in and trying to access login/register pages
    if (isLoggedIn === 'true' && (currentPage === 'login.html' || currentPage === 'register.html')) {
        console.log('Redirecting to index.html from auth pages');
        window.location.href = 'index.html';
        return;
    }
    
    // If user is not logged in and trying to access index page
    if (isLoggedIn !== 'true') {
        console.log('Not logged in');
        // Only redirect if trying to access index.html
        if (currentPage === 'index.html' || currentPage === '') {
            console.log('Redirecting to login.html');
            window.location.href = 'login.html';
        }
    }
}

// Register function
async function register(event) {
    event.preventDefault();
    console.log('Starting registration...');
    try {
        // Get form values
        const fullName = document.getElementById('fullName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('Form data:', { fullName, username, email });

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error("Passwords don't match!");
        }

        // Validate required fields
        if (!fullName || !username || !email || !password) {
            throw new Error('All fields are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        console.log('Validation passed, checking for existing user...');

        try {
            // Check if username exists
            const existingUser = await db.getUser(username);
            console.log('Existing user check result:', existingUser);

            if (existingUser) {
                throw new Error('Username already exists!');
            }

            // Create new user object
            const newUser = {
                fullName,
                username,
                email,
                password,
                createdAt: new Date().toISOString()
            };

            console.log('Adding new user to database...');
            await db.addUser(newUser);
            console.log('User added successfully:', newUser);

            // Set session
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('fullName', fullName);
            console.log('Session data saved');

            // Redirect to dashboard
            window.location.href = 'index.html';
        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            throw new Error(dbError.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        const errorElement = document.getElementById('registerError');
        if (errorElement) {
            errorElement.textContent = error.message || 'An error occurred during registration.';
            errorElement.style.display = 'block';
        }
    } finally {
        // Reset button state
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    }
}

// Login function
async function login(event) {
    event.preventDefault();
    console.log('Starting login...');
    try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Login attempt for username:', username);
        
        // Get user from database
        const user = await db.getUser(username);
        console.log('User found:', !!user);

        if (user && user.password === password) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('fullName', user.fullName);
            console.log('Login successful, data saved');
            window.location.href = 'index.html';
        } else {
            console.log('Invalid credentials');
            document.getElementById('loginError').textContent = 'Invalid username or password!';
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = 'An error occurred during login.';
        document.getElementById('loginError').style.display = 'block';
    }
}

// Logout function
function logout() {
    console.log('Logging out...');
    try {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('fullName');
        console.log('Login data cleared');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update username in the UI
function updateUserUI() {
    console.log('Updating UI...');
    try {
        const fullName = sessionStorage.getItem('fullName') || 'User';
        console.log('Current user:', fullName);
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.innerHTML = `<i class="fas fa-user"></i> ${fullName}`;
            console.log('UI updated');
        }
    } catch (error) {
        console.error('Update UI error:', error);
    }
}

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing auth...');
    try {
        checkAuth();
        updateUserUI();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});