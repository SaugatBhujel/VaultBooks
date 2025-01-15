// Check if user is logged in
function checkAuth() {
    console.log('Checking auth...');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
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
function register(event) {
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

        // Get existing users or initialize empty array
        let users = [];
        try {
            const existingUsers = localStorage.getItem('users');
            console.log('Existing users:', existingUsers);
            users = existingUsers ? JSON.parse(existingUsers) : [];
        } catch (e) {
            console.error('Error parsing users:', e);
            users = [];
        }

        // Check if username already exists
        if (users.some(user => user.username === username)) {
            console.log('Username exists');
            document.getElementById('registerError').textContent = 'Username already exists!';
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Check if email already exists
        if (users.some(user => user.email === email)) {
            console.log('Email exists');
            document.getElementById('registerError').textContent = 'Email already registered!';
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Add new user
        const newUser = {
            fullName,
            username,
            email,
            password
        };
        users.push(newUser);
        console.log('New user added:', newUser);

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Users saved to localStorage');

        // Auto login after registration
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('fullName', fullName);
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
function login(event) {
    event.preventDefault();
    console.log('Starting login...');
    try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Login attempt for username:', username);
        
        // Get users from localStorage
        let users = [];
        try {
            const existingUsers = localStorage.getItem('users');
            console.log('Existing users:', existingUsers);
            users = existingUsers ? JSON.parse(existingUsers) : [];
        } catch (e) {
            console.error('Error parsing users:', e);
            users = [];
        }
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);
        console.log('User found:', !!user);

        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('fullName', user.fullName);
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
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('fullName');
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
        const fullName = localStorage.getItem('fullName') || 'User';
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