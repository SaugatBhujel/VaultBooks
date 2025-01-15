// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    
    // If user is logged in and trying to access login/register pages
    if (isLoggedIn && (currentPage === 'login.html' || currentPage === 'register.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    // If user is not logged in and trying to access index page
    if (!isLoggedIn) {
        // Only redirect if trying to access index.html
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'login.html';
        }
    }
}

// Register function
function register(event) {
    event.preventDefault();
    try {
        const fullName = document.getElementById('fullName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            document.getElementById('registerError').textContent = "Passwords don't match!";
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Get existing users or initialize empty array
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if username already exists
        if (users.some(user => user.username === username)) {
            document.getElementById('registerError').textContent = 'Username already exists!';
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Check if email already exists
        if (users.some(user => user.email === email)) {
            document.getElementById('registerError').textContent = 'Email already registered!';
            document.getElementById('registerError').style.display = 'block';
            return;
        }

        // Add new user
        users.push({
            fullName,
            username,
            email,
            password
        });

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        // Auto login after registration
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('fullName', fullName);

        // Redirect to dashboard
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
    try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('fullName', user.fullName);
            window.location.href = 'index.html';
        } else {
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
    try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('fullName');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update username in the UI
function updateUserUI() {
    try {
        const fullName = localStorage.getItem('fullName') || 'User';
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.innerHTML = `<i class="fas fa-user"></i> ${fullName}`;
        }
    } catch (error) {
        console.error('Update UI error:', error);
    }
}

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    try {
        checkAuth();
        updateUserUI();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}); 