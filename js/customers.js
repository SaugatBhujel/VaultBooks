// Customers module
window.customers = {
    isEditing: false,

    initCustomers() {
        try {
            console.log('Initializing customers module');
            this.setupCustomerListeners();
            this.loadCustomers();
            this.updateCustomerStats();
        } catch (error) {
            console.error('Failed to initialize customers:', error);
        }
    },

    addNewCustomer() {
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
            this.loadCustomers();
            this.updateCustomerStats();

            // Clear form and close modal
            document.getElementById('addCustomerForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
            modal.hide();

            // Show success message
            alert('Customer added successfully!');
        } catch (error) {
            console.error('Failed to add customer:', error);
            alert('Failed to add customer. Please try again.');
        }
    },

    loadCustomers() {
        try {
            const data = getData();
            const customers = data.customers || [];
            
            // Sort by join date descending
            customers.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
            
            const tableBody = document.getElementById('customerTableBody');
            tableBody.innerHTML = '';
            
            customers.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.address}</td>
                    <td>${formatCurrency(customer.totalSpent)}</td>
                    <td>${customer.loyaltyPoints}</td>
                    <td>
                        <span class="badge bg-${customer.status === 'active' ? 'success' : 'danger'}">
                            ${customer.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.customers.editCustomer('${customer.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.customers.deleteCustomer('${customer.id}')">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load customers:', error);
        }
    },

    updateCustomerStats() {
        try {
            const data = getData();
            const customers = data.customers || [];
            
            const totalCustomers = customers.length;
            const activeCustomers = customers.filter(c => c.status === 'active').length;
            const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
            const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0;
            
            document.getElementById('totalCustomers').textContent = totalCustomers;
            document.getElementById('activeCustomers').textContent = activeCustomers;
            document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
            document.getElementById('avgOrderValue').textContent = formatCurrency(avgOrderValue);
        } catch (error) {
            console.error('Failed to update customer stats:', error);
        }
    },

    editCustomer(customerId) {
        try {
            const data = getData();
            const customer = data.customers.find(c => c.id === customerId);
            
            if (customer) {
                this.isEditing = true;
                
                // Populate form
                const form = document.getElementById('editCustomerForm');
                form.querySelector('#editCustomerId').value = customer.id;
                form.querySelector('#editCustomerName').value = customer.name;
                form.querySelector('#editCustomerEmail').value = customer.email;
                form.querySelector('#editCustomerPhone').value = customer.phone;
                form.querySelector('#editCustomerAddress').value = customer.address;
                form.querySelector('#editCustomerStatus').value = customer.status;
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Failed to edit customer:', error);
        }
    },

    updateCustomer() {
        try {
            const form = document.getElementById('editCustomerForm');
            const customerId = form.querySelector('#editCustomerId').value;
            const name = form.querySelector('#editCustomerName').value.trim();
            const email = form.querySelector('#editCustomerEmail').value.trim();
            const phone = form.querySelector('#editCustomerPhone').value.trim();
            const address = form.querySelector('#editCustomerAddress').value.trim();
            const status = form.querySelector('#editCustomerStatus').value;

            // Validate inputs
            if (!name || !email || !phone) {
                alert('Please fill in all required fields');
                return;
            }

            const data = getData();
            const index = data.customers.findIndex(c => c.id === customerId);
            
            if (index !== -1) {
                data.customers[index] = {
                    ...data.customers[index],
                    name,
                    email,
                    phone,
                    address,
                    status
                };
                
                saveData(data);
                this.loadCustomers();
                this.updateCustomerStats();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
                modal.hide();

                // Show success message
                alert('Customer updated successfully!');
            }
        } catch (error) {
            console.error('Failed to update customer:', error);
            alert('Failed to update customer. Please try again.');
        }
    },

    deleteCustomer(customerId) {
        try {
            if (confirm('Are you sure you want to delete this customer?')) {
                const data = getData();
                data.customers = data.customers.filter(c => c.id !== customerId);
                saveData(data);
                
                this.loadCustomers();
                this.updateCustomerStats();
            }
        } catch (error) {
            console.error('Failed to delete customer:', error);
        }
    },

    setupCustomerListeners() {
        try {
            // Add customer form submit
            document.getElementById('addCustomerForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewCustomer();
            });

            // Edit customer form submit
            document.getElementById('editCustomerForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateCustomer();
            });

            // Reset form on modal close
            const editCustomerModal = document.getElementById('editCustomerModal');
            if (editCustomerModal) {
                editCustomerModal.addEventListener('hidden.bs.modal', () => {
                    this.isEditing = false;
                    document.getElementById('editCustomerForm').reset();
                });
            }
        } catch (error) {
            console.error('Failed to setup customer listeners:', error);
        }
    },

    debugCustomers() {
        try {
            const data = getData();
            console.log('Current customer data:', data.customers);
            return data.customers;
        } catch (error) {
            console.error('Failed to debug customers:', error);
            return null;
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.customers.initCustomers();
    } catch (error) {
        console.error('Error initializing customers module:', error);
    }
});