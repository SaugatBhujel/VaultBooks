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
        const fullName = document.getElementById('fullName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('Registration data collected');

        // Validate passwords match
        if (password !== confirmPassword) {
            console.log('Passwords do not match');
            document.getElementById('registerError').textContent = "Passwords don't match!";
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Check if username exists
        const existingUser = await db.getUser(username);
        if (existingUser) {
            console.log('Username exists');
            document.getElementById('registerError').textContent = 'Username already exists!';
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Add new user
        const newUser = {
            fullName,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        await db.addUser(newUser);
        console.log('New user added:', newUser);

        // Set session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('fullName', fullName);
        console.log('Login data saved');

        // Redirect to dashboard
        console.log('Redirecting to index.html');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Registration error:', error);
        document.getElementById('registerError').textContent = 'An error occurred during registration.';
        document.getElementById('registerError').style.display = 'block';
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