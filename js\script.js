// Global Variables
let inventory = [];
let customers = [];
let bills = [];
let transactions = [];
let bankBalance = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    showSection('dashboard'); // Show dashboard by default
});

// Load data from localStorage
function loadData() {
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    customers = JSON.parse(localStorage.getItem('customers')) || [];
    bills = JSON.parse(localStorage.getItem('bills')) || [];
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    bankBalance = parseFloat(localStorage.getItem('bankBalance')) || 0;
    
    updateAllTables();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('bankBalance', bankBalance.toString());
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });
}

// Show/Hide Sections
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Update section content
        switch(sectionId) {
            case 'dashboard':
                updateDashboard();
                break;
            case 'inventory':
                updateInventoryTable();
                break;
            case 'customers':
                updateCustomersTable();
                break;
            case 'billing':
                updateBillingTable();
                break;
        }
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkSectionId = link.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (linkSectionId === sectionId) {
            link.classList.add('active');
        }
    });
}

// Update all tables
function updateAllTables() {
    updateDashboard();
    updateInventoryTable();
    updateCustomersTable();
    updateBillingTable();
}

// Update Dashboard
function updateDashboard() {
    // Update stats
    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const totalOrders = bills.length;
    const totalCustomers = customers.length;
    
    const revenueElement = document.getElementById('totalRevenue');
    if (revenueElement) revenueElement.textContent = formatCurrency(totalRevenue);
    
    const ordersElement = document.getElementById('totalOrders');
    if (ordersElement) ordersElement.textContent = totalOrders;
    
    const customersElement = document.getElementById('totalCustomers');
    if (customersElement) customersElement.textContent = totalCustomers;
    
    // Update charts if available
    if (window.chartSystem && typeof window.chartSystem.updateCharts === 'function') {
        window.chartSystem.updateCharts();
    }
}

// Update Inventory Table
function updateInventoryTable() {
    const tbody = document.querySelector('#inventoryTable tbody');
    if (!tbody) {
        console.error('Inventory table not found');
        return;
    }
    
    tbody.innerHTML = '';
    inventory.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>
                <button onclick="editInventoryItem(${index})" class="btn btn-sm btn-primary">Edit</button>
                <button onclick="deleteInventoryItem(${index})" class="btn btn-sm btn-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update Customers Table
function updateCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');
    if (!tbody) {
        console.error('Customers table not found');
        return;
    }
    
    tbody.innerHTML = '';
    customers.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || ''}</td>
            <td>
                <button onclick="editCustomer(${index})" class="btn btn-sm btn-primary">Edit</button>
                <button onclick="deleteCustomer(${index})" class="btn btn-sm btn-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update Billing Table
function updateBillingTable() {
    const tbody = document.querySelector('#billsTable tbody');
    if (!tbody) {
        console.error('Billing table not found');
        return;
    }
    
    tbody.innerHTML = '';
    bills.forEach((bill, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.number}</td>
            <td>${bill.customerName}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${formatCurrency(bill.total)}</td>
            <td>${bill.status}</td>
            <td>
                <button onclick="viewBill(${index})" class="btn btn-sm btn-info">View</button>
                <button onclick="deleteBill(${index})" class="btn btn-sm btn-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Inventory Functions
function addNewItem() {
    const name = prompt('Enter item name:');
    if (!name) return;
    
    const quantity = parseInt(prompt('Enter quantity:'));
    if (isNaN(quantity)) return;
    
    const price = parseFloat(prompt('Enter price:'));
    if (isNaN(price)) return;
    
    inventory.push({
        name,
        quantity,
        price,
        date: new Date().toISOString()
    });
    
    saveData();
    updateInventoryTable();
}

function editInventoryItem(index) {
    const item = inventory[index];
    if (!item) return;
    
    const name = prompt('Enter new name:', item.name);
    if (!name) return;
    
    const quantity = parseInt(prompt('Enter new quantity:', item.quantity));
    if (isNaN(quantity)) return;
    
    const price = parseFloat(prompt('Enter new price:', item.price));
    if (isNaN(price)) return;
    
    inventory[index] = { ...item, name, quantity, price };
    saveData();
    updateInventoryTable();
}

function deleteInventoryItem(index) {
    if (!inventory[index]) return;
    
    if (confirm('Are you sure you want to delete this item?')) {
        inventory.splice(index, 1);
        saveData();
        updateInventoryTable();
    }
}

// Customer Functions
function addNewCustomer() {
    const name = prompt('Enter customer name:');
    if (!name) return;
    
    const email = prompt('Enter email:');
    if (!email) return;
    
    const phone = prompt('Enter phone:');
    if (!phone) return;
    
    customers.push({
        name,
        email,
        phone,
        date: new Date().toISOString()
    });
    
    saveData();
    updateCustomersTable();
}

function editCustomer(index) {
    const customer = customers[index];
    if (!customer) return;
    
    const name = prompt('Enter new name:', customer.name);
    if (!name) return;
    
    const email = prompt('Enter new email:', customer.email);
    if (!email) return;
    
    const phone = prompt('Enter new phone:', customer.phone);
    if (!phone) return;
    
    customers[index] = { ...customer, name, email, phone };
    saveData();
    updateCustomersTable();
}

function deleteCustomer(index) {
    if (!customers[index]) return;
    
    if (confirm('Are you sure you want to delete this customer?')) {
        customers.splice(index, 1);
        saveData();
        updateCustomersTable();
    }
}

// Billing Functions
function createNewInvoice() {
    if (customers.length === 0) {
        alert('Please add customers first');
        return;
    }
    
    if (inventory.length === 0) {
        alert('Please add inventory items first');
        return;
    }
    
    const customerList = customers.map((c, i) => `${i}: ${c.name}`).join('\n');
    const customerIndex = prompt(`Enter customer index:\n${customerList}`);
    if (customerIndex === null) return;
    
    const customer = customers[parseInt(customerIndex)];
    if (!customer) {
        alert('Invalid customer index');
        return;
    }
    
    const items = [];
    let addMore = true;
    
    while (addMore) {
        const itemList = inventory.map((item, i) => `${i}: ${item.name} (${item.quantity} available)`).join('\n');
        const itemIndex = prompt(`Enter item index:\n${itemList}`);
        if (itemIndex === null) break;
        
        const item = inventory[parseInt(itemIndex)];
        if (!item) {
            alert('Invalid item index');
            continue;
        }
        
        const quantity = parseInt(prompt(`Enter quantity (max ${item.quantity}):`));
        if (isNaN(quantity) || quantity <= 0 || quantity > item.quantity) {
            alert('Invalid quantity');
            continue;
        }
        
        items.push({
            name: item.name,
            quantity,
            price: item.price,
            total: quantity * item.price
        });
        
        // Update inventory
        item.quantity -= quantity;
        
        addMore = confirm('Add another item?');
    }
    
    if (items.length === 0) return;
    
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const bill = {
        number: `BILL-${bills.length + 1}`,
        customerName: customer.name,
        date: new Date().toISOString(),
        items,
        total,
        status: 'pending'
    };
    
    bills.push(bill);
    saveData();
    updateBillingTable();
}

function viewBill(index) {
    const bill = bills[index];
    if (!bill) return;
    
    alert(`
Bill Number: ${bill.number}
Customer: ${bill.customerName}
Date: ${formatDate(bill.date)}
Items:
${bill.items.map(item => `${item.name} x${item.quantity} = ${formatCurrency(item.total)}`).join('\n')}
Total: ${formatCurrency(bill.total)}
Status: ${bill.status}
    `);
}

function deleteBill(index) {
    if (!bills[index]) return;
    
    if (confirm('Are you sure you want to delete this bill?')) {
        bills.splice(index, 1);
        saveData();
        updateBillingTable();
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// Make functions globally available
window.showSection = showSection;
window.addNewItem = addNewItem;
window.editInventoryItem = editInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.addNewCustomer = addNewCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.createNewInvoice = createNewInvoice;
window.viewBill = viewBill;
window.deleteBill = deleteBill;
