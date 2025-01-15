// Dashboard Data Structure
let dashboardData = {
    stats: {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalSales: 0
    },
    transactions: [],
    products: [],
    customers: [],
    settings: {
        theme: 'light',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY'
    }
};

// Initialize Dashboard
function initializeDashboard() {
    loadDashboardData();
    updateStats();
    updateAllTables();
    initializeCharts();
}

// Load Data
function loadDashboardData() {
    const savedData = localStorage.getItem('dashboardData');
    if (savedData) {
        dashboardData = JSON.parse(savedData);
    } else {
        // Initialize with sample data for demonstration
        generateSampleData();
    }
}

// Save Data
function saveDashboardData() {
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}

// Generate Sample Data
function generateSampleData() {
    // Sample Transactions
    const transactionTypes = ['income', 'expense'];
    const categories = ['sales', 'services', 'supplies', 'salary', 'rent', 'utilities'];
    
    for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dashboardData.transactions.push({
            id: Date.now() - i,
            date: date.toISOString().split('T')[0],
            description: `Transaction ${i + 1}`,
            type: transactionTypes[Math.floor(Math.random() * 2)],
            amount: Math.floor(Math.random() * 1000) + 100,
            category: categories[Math.floor(Math.random() * categories.length)]
        });
    }

    // Sample Products
    const productCategories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports'];
    for (let i = 0; i < 10; i++) {
        dashboardData.products.push({
            id: Date.now() - i,
            name: `Product ${i + 1}`,
            category: productCategories[Math.floor(Math.random() * productCategories.length)],
            price: Math.floor(Math.random() * 100) + 10,
            stock: Math.floor(Math.random() * 50) + 1,
            description: `Description for Product ${i + 1}`
        });
    }

    // Sample Customers
    const statuses = ['active', 'inactive'];
    for (let i = 0; i < 8; i++) {
        dashboardData.customers.push({
            id: Date.now() - i,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            address: `Address ${i + 1}`,
            status: statuses[Math.floor(Math.random() * 2)],
            totalOrders: Math.floor(Math.random() * 10)
        });
    }

    updateStats();
    saveDashboardData();
}

// Update Statistics
function updateStats() {
    dashboardData.stats = {
        totalRevenue: calculateTotalRevenue(),
        totalExpenses: calculateTotalExpenses(),
        totalProducts: dashboardData.products.length,
        totalCustomers: dashboardData.customers.length,
        totalSales: calculateTotalSales()
    };

    // Update stats display
    document.getElementById('totalRevenue').textContent = formatCurrency(dashboardData.stats.totalRevenue);
    document.getElementById('totalExpenses').textContent = formatCurrency(dashboardData.stats.totalExpenses);
    document.getElementById('totalProducts').textContent = dashboardData.stats.totalProducts;
    document.getElementById('totalCustomers').textContent = dashboardData.stats.totalCustomers;
    document.getElementById('totalSales').textContent = dashboardData.stats.totalSales;
}

// Calculate Totals
function calculateTotalRevenue() {
    return dashboardData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

function calculateTotalExpenses() {
    return dashboardData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

function calculateTotalSales() {
    return dashboardData.transactions
        .filter(t => t.type === 'income' && t.category === 'sales')
        .length;
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: dashboardData.settings.currency
    }).format(amount);
}

// Update All Tables
function updateAllTables() {
    updateTransactionsTable();
    updateProductsTable();
    updateCustomersTable();
}

// Update Transactions Table
function updateTransactionsTable() {
    const tbody = document.querySelector('#transactionsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const recentTransactions = [...dashboardData.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    recentTransactions.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.description}</td>
            <td><span class="badge ${transaction.type}">${transaction.type}</span></td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${transaction.category}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Products Table
function updateProductsTable() {
    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    dashboardData.products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn-icon" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Customers Table
function updateCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    dashboardData.customers.forEach(customer => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><span class="badge ${customer.status}">${customer.status}</span></td>
            <td>${customer.totalOrders}</td>
            <td>
                <button class="btn-icon" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Add Transaction
function addTransaction(event) {
    event.preventDefault();

    const transaction = {
        id: Date.now(),
        description: document.getElementById('transactionDescription').value,
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: document.getElementById('transactionDate').value,
        category: document.getElementById('transactionCategory').value
    };

    dashboardData.transactions.unshift(transaction);
    saveDashboardData();
    updateStats();
    updateTransactionsTable();
    updateCharts();
    closeModal('addTransaction');
    document.getElementById('transactionForm').reset();

    showNotification('Transaction added successfully', 'success');
}

// Add Product
function addProduct(event) {
    event.preventDefault();

    const product = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value
    };

    dashboardData.products.push(product);
    saveDashboardData();
    updateStats();
    updateProductsTable();
    updateCharts();
    closeModal('addProduct');
    document.getElementById('productForm').reset();

    showNotification('Product added successfully', 'success');
}

// Add Customer
function addCustomer(event) {
    event.preventDefault();

    const customer = {
        id: Date.now(),
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        status: document.getElementById('customerStatus').value,
        totalOrders: 0
    };

    dashboardData.customers.push(customer);
    saveDashboardData();
    updateStats();
    updateCustomersTable();
    updateCharts();
    closeModal('addCustomer');
    document.getElementById('customerForm').reset();

    showNotification('Customer added successfully', 'success');
}

// Delete Functions
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        dashboardData.products = dashboardData.products.filter(p => p.id !== id);
        saveDashboardData();
        updateStats();
        updateProductsTable();
        updateCharts();
        showNotification('Product deleted successfully', 'success');
    }
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        dashboardData.customers = dashboardData.customers.filter(c => c.id !== id);
        saveDashboardData();
        updateStats();
        updateCustomersTable();
        updateCharts();
        showNotification('Customer deleted successfully', 'success');
    }
}

// Show/Close Modal
function showModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Set default date for transaction form
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('transactionDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.max = today;
    }
});
