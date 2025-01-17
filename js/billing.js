// Billing module
window.billing = {
    initBilling: function() {
        console.log('Initializing billing module');
        this.loadBills();
        this.updateBillingStats();
        this.populateCustomerDropdown();
    },

    createNewInvoice: function() {
        const billData = {
            billNumber: this.generateBillNumber(),
            date: new Date().toISOString(),
            customerId: document.getElementById('billCustomer').value,
            items: [],
            total: 0,
            status: 'pending'
        };

        const data = this.getData();
        data.bills.push(billData);
        this.saveData(data);
        this.loadBills();
    },

    generateBillNumber: function() {
        return 'BILL-' + Date.now();
    },

    loadBills: function() {
        try {
            const data = this.getData();
            if (!Array.isArray(data.bills)) {
                data.bills = [];
            }

            const billsTable = document.getElementById('billingTable');
            if (!billsTable) {
                throw new Error('Bills table not found');
            }

            // Sort bills by date (newest first)
            const bills = [...data.bills].sort((a, b) => new Date(b.date) - new Date(a.date));

            if (bills.length === 0) {
                billsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No bills found</td>
                    </tr>
                `;
                return;
            }

            billsTable.innerHTML = bills.map(bill => `
                <tr>
                    <td>${bill.billNumber}</td>
                    <td>${new Date(bill.date).toLocaleDateString()}</td>
                    <td>${bill.customerName}</td>
                    <td>$${bill.total.toFixed(2)}</td>
                    <td><span class="badge bg-${this.getStatusColor(bill.status)}">${bill.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.billing.viewBill('${bill.billNumber}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="window.billing.editBill('${bill.billNumber}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.billing.markAsPaid('${bill.billNumber}')" 
                            ${bill.status === 'paid' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="window.billing.printBill('${bill.billNumber}')">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.billing.deleteBill('${bill.billNumber}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            this.updateBillingStats();
        } catch (error) {
            console.error('Error loading bills:', error);
        }
    },

    getStatusColor: function(status) {
        switch(status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'overdue': return 'danger';
            default: return 'secondary';
        }
    },

    markAsPaid: function(billId) {
        try {
            const data = this.getData();
            const billIndex = data.bills.findIndex(b => b.id === billId);
            
            if (billIndex === -1) {
                throw new Error('Bill not found');
            }

            data.bills[billIndex].status = 'paid';
            data.bills[billIndex].paidDate = new Date().toISOString();
            this.saveData(data);

            // Refresh bills list
            this.loadBills();

            // Close view modal if open
            const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewBillModal'));
            if (viewModal) {
                viewModal.hide();
            }

            alert('Bill marked as paid successfully!');
        } catch (error) {
            console.error('Error marking bill as paid:', error);
            alert('Failed to update bill status. Please try again.');
        }
    },

    addBillItem: function() {
        const itemsContainer = document.getElementById('billItems');
        const itemRow = document.createElement('div');
        itemRow.className = 'row mb-2 bill-item';
        
        const data = this.getData();
        const itemOptions = data.inventory.map(item => 
            `<option value="${item.id}" data-price="${item.price}">${item.name}</option>`
        ).join('');

        itemRow.innerHTML = `
            <div class="col-md-5">
                <select class="form-select item-select" onchange="window.billing.updateItemPrice(this)">
                    <option value="">Select Item</option>
                    ${itemOptions}
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" value="1" min="1" onchange="window.billing.updateItemTotal(this)">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control item-price" readonly>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm" onclick="window.billing.removeBillItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        itemsContainer.appendChild(itemRow);
    },

    updateItemPrice: function(select) {
        const row = select.closest('.bill-item');
        const price = select.options[select.selectedIndex].dataset.price;
        const priceInput = row.querySelector('.item-price');
        priceInput.value = price;
        this.updateBillTotal();
    },

    updateItemTotal: function(input) {
        this.updateBillTotal();
    },

    removeBillItem: function(button) {
        button.closest('.bill-item').remove();
        this.updateBillTotal();
    },

    updateBillTotal: function() {
        const items = document.querySelectorAll('.bill-item');
        let total = 0;
        
        items.forEach(item => {
            const quantity = item.querySelector('.item-quantity').value;
            const price = item.querySelector('.item-price').value;
            total += quantity * price;
        });
        
        document.getElementById('billTotal').value = total.toFixed(2);
    },

    saveBill: function() {
        try {
            const customerId = document.getElementById('billCustomer').value;
            const billDate = document.getElementById('billDate').value;
            
            // Validate inputs
            if (!customerId) {
                alert('Please select a customer');
                return;
            }
            if (!billDate) {
                alert('Please select a bill date');
                return;
            }

            // Get all bill items
            const billItemsContainer = document.getElementById('billItems');
            const itemRows = billItemsContainer.querySelectorAll('.bill-item');
            const items = [];
            let total = 0;

            // Validate and collect items
            itemRows.forEach(row => {
                const itemSelect = row.querySelector('.item-select');
                const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;

                if (!itemSelect.value) {
                    throw new Error('Please select an item');
                }
                if (quantity <= 0) {
                    throw new Error('Quantity must be greater than 0');
                }
                if (price <= 0) {
                    throw new Error('Price must be greater than 0');
                }

                const itemTotal = quantity * price;
                total += itemTotal;

                items.push({
                    itemId: itemSelect.value,
                    name: itemSelect.options[itemSelect.selectedIndex].text,
                    quantity: quantity,
                    price: price,
                    total: itemTotal
                });
            });

            if (items.length === 0) {
                alert('Please add at least one item to the bill');
                return;
            }

            const billData = {
                id: 'BILL-' + Date.now(),
                billNumber: this.generateBillNumber(),
                customerId: customerId,
                customerName: document.getElementById('billCustomer').options[
                    document.getElementById('billCustomer').selectedIndex
                ].text,
                date: billDate,
                items: items,
                total: total,
                status: 'pending',
                notes: document.getElementById('billNotes').value,
                createdAt: new Date().toISOString()
            };

            // Save bill
            const data = this.getData();
            if (!Array.isArray(data.bills)) {
                data.bills = [];
            }
            data.bills.push(billData);

            // Update customer's total orders and spent
            if (!Array.isArray(data.customers)) {
                data.customers = [];
            }
            const customerIndex = data.customers.findIndex(c => c.id === customerId);
            if (customerIndex !== -1) {
                data.customers[customerIndex].totalOrders = (data.customers[customerIndex].totalOrders || 0) + 1;
                data.customers[customerIndex].totalSpent = (data.customers[customerIndex].totalSpent || 0) + total;
            }

            this.saveData(data);

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createBillModal'));
            modal.hide();
            document.getElementById('createBillForm').reset();
            document.getElementById('billItems').innerHTML = ''; // Clear bill items

            // Show success message
            alert('Bill created successfully!');
            
            // Refresh bills list
            this.loadBills();
        } catch (error) {
            console.error('Error saving bill:', error);
            alert(error.message || 'Failed to save bill. Please try again.');
        }
    },

    populateCustomerDropdown: function() {
        try {
            const data = this.getData();
            const customerSelect = document.getElementById('billCustomer');
            
            if (!customerSelect) {
                throw new Error('Customer dropdown not found');
            }

            // Get only active customers
            const activeCustomers = data.customers.filter(c => c.status === 'active');

            // Create dropdown options
            const options = activeCustomers.map(customer => `
                <option value="${customer.id}">
                    ${customer.name} (${customer.phone})
                </option>
            `);

            // Add default option
            customerSelect.innerHTML = `
                <option value="">Select Customer</option>
                ${options.join('')}
            `;

            console.log(`Populated ${activeCustomers.length} customers in dropdown`);
        } catch (error) {
            console.error('Error populating customer dropdown:', error);
            alert('Failed to load customers. Please try again.');
        }
    },

    createBill: function() {
        try {
            const customerId = document.getElementById('billCustomer').value;
            if (!customerId) {
                alert('Please select a customer');
                return;
            }

            // Rest of your billing logic...
        } catch (error) {
            console.error('Error creating bill:', error);
            alert('Failed to create bill. Please try again.');
        }
    },

    updateBillingStats: function() {
        try {
            const data = this.getData();
            if (!Array.isArray(data.bills)) return;

            const totalBills = data.bills.length;
            const pendingBills = data.bills.filter(b => b.status === 'pending').length;
            const totalAmount = data.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
            const avgAmount = totalBills > 0 ? totalAmount / totalBills : 0;

            document.getElementById('totalBills').textContent = totalBills;
            document.getElementById('pendingBills').textContent = pendingBills;
            document.getElementById('totalBillAmount').textContent = `$${totalAmount.toFixed(2)}`;
            document.getElementById('avgBillAmount').textContent = `$${avgAmount.toFixed(2)}`;
        } catch (error) {
            console.error('Error updating billing stats:', error);
        }
    },

    viewBill: function(billId) {
        try {
            const data = this.getData();
            const bill = data.bills.find(b => b.id === billId);
            
            if (!bill) {
                throw new Error('Bill not found');
            }

            // Create modal content
            const modalContent = `
                <div class="modal" id="viewBillModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Bill Details - ${bill.billNumber}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="billPrintSection" class="bill-print-template">
                                    <div class="bill-header">
                                        ${businessConfig.logo ? `
                                            <img src="${businessConfig.logo}" alt="${businessConfig.name}" class="bill-logo">
                                        ` : ''}
                                        <h2>${businessConfig.name}</h2>
                                        <h4>Tax Invoice</h4>
                                        <div class="business-details">
                                            <p>${businessConfig.address}</p>
                                            <p>Phone: ${businessConfig.phone} | Email: ${businessConfig.email}</p>
                                            <p>Tax Number: ${businessConfig.taxNumber}</p>
                                        </div>
                                    </div>
                                    <div class="bill-info row">
                                        <div class="col-md-6">
                                            <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
                                            <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
                                            <p><strong>Status:</strong> 
                                                <span class="badge bg-${this.getStatusColor(bill.status)}">
                                                    ${bill.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Customer:</strong> ${bill.customerName}</p>
                                            <p><strong>Phone:</strong> ${bill.customerPhone || 'N/A'}</p>
                                            <p><strong>Address:</strong> ${bill.customerAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table bill-table">
                                            <thead>
                                                <tr>
                                                    <th style="width: 40%">Item</th>
                                                    <th style="width: 20%">Quantity</th>
                                                    <th style="width: 20%">Price</th>
                                                    <th style="width: 20%">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${bill.items.map(item => `
                                                    <tr>
                                                        <td>${item.name}</td>
                                                        <td>${item.quantity}</td>
                                                        <td>$${item.price.toFixed(2)}</td>
                                                        <td>$${item.total.toFixed(2)}</td>
                                                    </tr>
                                                `).join('')}
                                                <tr>
                                                    <td colspan="3" class="text-end"><strong>Total Amount:</strong></td>
                                                    <td><strong>$${bill.total.toFixed(2)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    ${bill.notes ? `
                                        <div class="bill-notes">
                                            <strong>Notes:</strong>
                                            <p>${bill.notes}</p>
                                        </div>
                                    ` : ''}
                                    <div class="bill-footer">
                                        <p>${businessConfig.footer.text}</p>
                                        <p>For any queries, please contact us at:</p>
                                        <p>Email: ${businessConfig.footer.supportEmail} | Phone: ${businessConfig.footer.supportPhone}</p>
                                        <p> ${new Date().getFullYear()} ${businessConfig.name}. All rights reserved.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer no-print">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                ${bill.status !== 'paid' ? `
                                    <button type="button" class="btn btn-success" onclick="window.billing.markAsPaid('${bill.id}')">
                                        <i class="fas fa-check"></i> Mark as Paid
                                    </button>
                                ` : ''}
                                <button type="button" class="btn btn-info" onclick="window.billing.printBill('${bill.id}')">
                                    <i class="fas fa-print"></i> Print
                                </button>
                                <button type="button" class="btn btn-primary" onclick="window.billing.editBill('${bill.id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('viewBillModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalContent);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('viewBillModal'));
            modal.show();

        } catch (error) {
            console.error('Error viewing bill:', error);
            alert('Failed to load bill details. Please try again.');
        }
    },

    editBill: function(billId) {
        try {
            const data = this.getData();
            const bill = data.bills.find(b => b.id === billId);
            
            if (!bill) {
                throw new Error('Bill not found');
            }

            // Set form values
            document.getElementById('billCustomer').value = bill.customerId;
            document.getElementById('billDate').value = bill.date;
            document.getElementById('billNotes').value = bill.notes || '';

            // Clear existing items
            const billItemsContainer = document.getElementById('billItems');
            billItemsContainer.innerHTML = '';

            // Add each item
            bill.items.forEach(item => {
                this.addBillItem();
                const lastRow = billItemsContainer.lastElementChild;
                const itemSelect = lastRow.querySelector('.item-select');
                const quantityInput = lastRow.querySelector('.item-quantity');
                const priceInput = lastRow.querySelector('.item-price');

                itemSelect.value = item.itemId;
                quantityInput.value = item.quantity;
                priceInput.value = item.price;
            });

            // Update total
            this.updateBillTotal();

            // Close view modal if open
            const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewBillModal'));
            if (viewModal) {
                viewModal.hide();
            }

            // Show edit modal
            const editModal = new bootstrap.Modal(document.getElementById('createBillModal'));
            editModal.show();

            // Store bill ID for updating
            document.getElementById('createBillModal').dataset.billId = billId;

        } catch (error) {
            console.error('Error editing bill:', error);
            alert('Failed to load bill for editing. Please try again.');
        }
    },

    deleteBill: function(billId) {
        if (confirm('Are you sure you want to delete this bill?')) {
            try {
                const data = this.getData();
                data.bills = data.bills.filter(b => b.id !== billId);
                this.saveData(data);
                this.loadBills();
                alert('Bill deleted successfully!');
            } catch (error) {
                console.error('Error deleting bill:', error);
                alert('Failed to delete bill. Please try again.');
            }
        }
    },

    printBill: function(billId) {
        try {
            const printContent = document.getElementById('billPrintSection');
            const originalContents = document.body.innerHTML;

            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.open();
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Bill</title>
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                        <link href="css/loyalty.css" rel="stylesheet">
                        <style>
                            body { padding: 20px; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none !important; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="bill-print-template">
                            ${printContent.innerHTML}
                        </div>
                        <div class="no-print text-center mt-3">
                            <button class="btn btn-primary" onclick="window.print()">Print</button>
                            <button class="btn btn-secondary" onclick="window.close()">Close</button>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();

        } catch (error) {
            console.error('Error printing bill:', error);
            alert('Failed to print bill. Please try again.');
        }
    },

    getData: function() {
        // Your data retrieval logic here
    },

    saveData: function(data) {
        // Your data saving logic here
    }
};

// Initialize billing section
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing billing module');
        
        // Populate customer dropdown when modal is shown
        const createBillModal = document.getElementById('createBillModal');
        if (createBillModal) {
            createBillModal.addEventListener('show.bs.modal', () => {
                window.billing.populateCustomerDropdown();
                document.getElementById('billItems').innerHTML = ''; // Clear previous items
                window.billing.addBillItem(); // Add first item row
            });
        }

        // Load initial data
        window.billing.loadBills();
        window.billing.updateBillingStats();
        
    } catch (error) {
        console.error('Error initializing billing:', error);
    }
});

// Add this to help with debugging
function debugBilling() {
    const data = window.billing.getData();
    console.log('Customers available for billing:', data.customers || []);
    const customerSelect = document.getElementById('billCustomer');
    console.log('Customer dropdown element:', customerSelect);
    console.log('Selected customer:', customerSelect?.value);
}