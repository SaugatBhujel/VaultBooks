// Customer functions
function addNewCustomer() {
    try {
        const name = document.getElementById('customerName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        // Validate inputs
        if (!name) {
            alert('Customer name is required');
            return;
        }
        if (!email) {
            alert('Email is required');
            return;
        }
        if (!phone) {
            alert('Phone number is required');
            return;
        }

        const customerData = {
            id: 'CUST-' + Date.now(),
            name: name,
            email: email,
            phone: phone,
            address: address,
            joinDate: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            status: 'active',
            loyaltyPoints: 0
        };

        const data = getData();
        if (!Array.isArray(data.customers)) {
            data.customers = [];
        }

        data.customers.push(customerData);
        saveData(data);
        
        console.log('Customer added successfully:', customerData);
        loadCustomers();
        updateCustomerStats();

        // Clear form and close modal
        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        // Show success message
        alert('Customer added successfully!');
    } catch (error) {
        console.error('Error adding customer:', error);
        alert('Failed to add customer. Please try again.');
    }
}

function loadCustomers() {
    try {
        console.log('Starting loadCustomers function');
        
        const customersTable = document.getElementById('customersTable');
        if (!customersTable) {
            throw new Error('Customers table element not found');
        }

        const data = getData();
        console.log('Loaded data:', data);

        // Ensure data and customers array exist and are valid
        if (!data || !Array.isArray(data.customers)) {
            data.customers = [];
            saveData(data);
        }

        // Apply filters
        const searchInput = document.getElementById('customerSearch');
        const statusFilter = document.getElementById('customerStatusFilter');
        
        let customers = [...data.customers];

        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            customers = customers.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm)
            );
        }

        if (statusFilter && statusFilter.value) {
            customers = customers.filter(customer => customer.status === statusFilter.value);
        }

        // Create table content
        let tableContent;
        if (customers.length === 0) {
            tableContent = `
                <tr>
                    <td colspan="7" class="text-center">
                        ${searchInput?.value ? 'No customers found matching your search' : 'No customers in database'}
                    </td>
                </tr>
            `;
        } else {
            tableContent = customers.map(customer => `
                <tr>
                    <td><strong>${customer.name || ''}</strong></td>
                    <td>${customer.email || ''}</td>
                    <td>${customer.phone || ''}</td>
                    <td>${customer.totalOrders || 0}</td>
                    <td>$${(customer.totalSpent || 0).toFixed(2)}</td>
                    <td>
                        <span class="badge bg-${customer.status === 'active' ? 'success' : 'secondary'}">
                            ${customer.status || 'inactive'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="editCustomer('${customer.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewCustomerDetails('${customer.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Update table
        customersTable.innerHTML = tableContent;
        
        // Update stats
        updateCustomerStats();
        
        console.log(`Loaded ${customers.length} customers successfully`);
        return true;
    } catch (error) {
        console.error('Detailed error in loadCustomers:', error);
        const customersTable = document.getElementById('customersTable');
        if (customersTable) {
            customersTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error: ${error.message}. Please try refreshing the page.
                    </td>
                </tr>
            `;
        }
        return false;
    }
}

function updateCustomerStats() {
    try {
        const data = getData();
        if (!data.customers) return;

        const totalCustomers = data.customers.length;
        const activeCustomers = data.customers.filter(c => c.status === 'active').length;
        const totalOrders = data.customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
        const totalSpent = data.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        document.getElementById('customerCount').textContent = totalCustomers;
        document.getElementById('activeCustomers').textContent = activeCustomers;
        document.getElementById('customerOrders').textContent = totalOrders;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
    } catch (error) {
        console.error('Error updating customer stats:', error);
    }
}

// Add these functions to handle editing
let isEditing = false;

function editCustomer(customerId) {
    try {
        console.log('Editing customer:', customerId);
        const data = getData();
        const customer = data.customers.find(c => c.id === customerId);
        
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Set form values
        document.getElementById('editCustomerId').value = customer.id;
        document.getElementById('editCustomerName').value = customer.name || '';
        document.getElementById('editCustomerEmail').value = customer.email || '';
        document.getElementById('editCustomerPhone').value = customer.phone || '';
        document.getElementById('editCustomerAddress').value = customer.address || '';
        document.getElementById('editCustomerStatus').value = customer.status || 'active';

        isEditing = true;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing customer:', error);
        alert('Failed to load customer data. Please try again.');
    }
}

function updateCustomer() {
    try {
        const customerId = document.getElementById('editCustomerId').value;
        const data = getData();
        const customerIndex = data.customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            throw new Error('Customer not found');
        }

        // Get current customer data
        const currentCustomer = data.customers[customerIndex];

        // Update customer data
        const updatedCustomer = {
            ...currentCustomer,
            name: document.getElementById('editCustomerName').value.trim(),
            email: document.getElementById('editCustomerEmail').value.trim(),
            phone: document.getElementById('editCustomerPhone').value.trim(),
            address: document.getElementById('editCustomerAddress').value.trim(),
            status: document.getElementById('editCustomerStatus').value
        };

        // Validate required fields
        if (!updatedCustomer.name || !updatedCustomer.email || !updatedCustomer.phone) {
            alert('Please fill in all required fields');
            return;
        }

        // Update customer in data
        data.customers[customerIndex] = updatedCustomer;
        saveData(data);

        // Refresh table and close modal
        loadCustomers();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
        modal.hide();

        // Reset editing state
        isEditing = false;

        // Show success message
        alert('Customer updated successfully!');
    } catch (error) {
        console.error('Error updating customer:', error);
        alert('Failed to update customer. Please try again.');
    }
}

// Add modal reset handler
document.addEventListener('DOMContentLoaded', () => {
    const editCustomerModal = document.getElementById('editCustomerModal');
    if (editCustomerModal) {
        editCustomerModal.addEventListener('hidden.bs.modal', () => {
            document.getElementById('editCustomerForm').reset();
            isEditing = false;
        });
    }
});

function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            const data = getData();
            data.customers = data.customers.filter(c => c.id !== customerId);
            saveData(data);
            loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer. Please try again.');
        }
    }
}

// Event Listeners
function setupCustomerListeners() {
    const searchInput = document.getElementById('customerSearch');
    const statusFilter = document.getElementById('customerStatusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadCustomers();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadCustomers();
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing customers module');
        
        // Setup event listeners
        setupCustomerListeners();
        
        // Load initial data
        loadCustomers();
        
        // Add test data if no customers exist
        const data = getData();
        if (!data.customers || data.customers.length === 0) {
            console.log('No customers found, adding sample data');
            addSampleCustomers();
        }
        
    } catch (error) {
        console.error('Error initializing customers:', error);
    }
});

// Debug function
function addSampleCustomers() {
    const sampleCustomers = [
        {
            id: 'CUST-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            address: '123 Main St',
            joinDate: new Date().toISOString(),
            totalOrders: 5,
            totalSpent: 500.00,
            status: 'active',
            loyaltyPoints: 100
        },
        {
            id: 'CUST-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '098-765-4321',
            address: '456 Oak Ave',
            joinDate: new Date().toISOString(),
            totalOrders: 3,
            totalSpent: 300.00,
            status: 'active',
            loyaltyPoints: 60
        }
    ];

    try {
        const data = getData();
        data.customers = sampleCustomers;
        saveData(data);
        loadCustomers();
        console.log('Sample customers added successfully');
        return true;
    } catch (error) {
        console.error('Error adding sample customers:', error);
        return false;
    }
}

// Add this function to help debug
function debugCustomers() {
    const data = getData();
    console.log('Current customer data:', data.customers || []);
} 