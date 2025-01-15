// Billing Data Structure
let billingData = {
    bills: [],
    nextBillNumber: 1000
};

// Initialize Billing
function initializeBilling() {
    loadBillingData();
    updateBillsTable();
    setupBillForm();
}

// Load Billing Data
function loadBillingData() {
    const savedData = localStorage.getItem('billingData');
    if (savedData) {
        billingData = JSON.parse(savedData);
    }
}

// Save Billing Data
function saveBillingData() {
    localStorage.setItem('billingData', JSON.stringify(billingData));
}

// Setup Bill Form
function setupBillForm() {
    // Load customers into select
    const customerSelect = document.getElementById('billCustomer');
    if (customerSelect) {
        customerSelect.innerHTML = '';
        dashboardData.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });
    }

    // Set default date
    const dateInput = document.getElementById('billDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Setup initial bill item
    updateBillItemsSelect();
}

// Update Bill Items Select
function updateBillItemsSelect() {
    const itemSelects = document.querySelectorAll('.item-select');
    itemSelects.forEach(select => {
        if (select.options.length === 0) {
            select.innerHTML = '<option value="">Select Product</option>';
            dashboardData.products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                option.dataset.price = product.price;
                select.appendChild(option);
            });
        }
    });
}

// Add Bill Item
function addBillItem() {
    const billItems = document.getElementById('billItems');
    const newItem = document.createElement('div');
    newItem.className = 'bill-item';
    newItem.innerHTML = `
        <select class="item-select" required>
            <option value="">Select Product</option>
        </select>
        <input type="number" class="item-quantity" placeholder="Quantity" min="1" required>
        <span class="item-price">$0.00</span>
        <span class="item-total">$0.00</span>
        <button type="button" class="btn-icon remove-item"><i class="fas fa-trash"></i></button>
    `;
    billItems.appendChild(newItem);
    
    // Setup new item
    updateBillItemsSelect();
    setupBillItemListeners(newItem);
}

// Setup Bill Item Listeners
function setupBillItemListeners(item) {
    const select = item.querySelector('.item-select');
    const quantity = item.querySelector('.item-quantity');
    const removeBtn = item.querySelector('.remove-item');

    select.addEventListener('change', updateBillTotals);
    quantity.addEventListener('input', updateBillTotals);
    removeBtn.addEventListener('click', () => {
        item.remove();
        updateBillTotals();
    });
}

// Update Bill Totals
function updateBillTotals() {
    let subtotal = 0;
    const items = document.querySelectorAll('.bill-item');
    
    items.forEach(item => {
        const select = item.querySelector('.item-select');
        const quantity = item.querySelector('.item-quantity');
        const priceSpan = item.querySelector('.item-price');
        const totalSpan = item.querySelector('.item-total');
        
        if (select.value && quantity.value) {
            const selectedOption = select.options[select.selectedIndex];
            const price = parseFloat(selectedOption.dataset.price);
            const qty = parseInt(quantity.value);
            const total = price * qty;
            
            priceSpan.textContent = currencyManager.formatAmount(price);
            totalSpan.textContent = currencyManager.formatAmount(total);
            subtotal += total;
        }
    });

    const tax = subtotal * 0.13; // 13% tax
    const total = subtotal + tax;

    document.getElementById('billSubtotal').textContent = currencyManager.formatAmount(subtotal);
    document.getElementById('billTax').textContent = currencyManager.formatAmount(tax);
    document.getElementById('billTotal').textContent = currencyManager.formatAmount(total);
}

// Create Bill
function createBill(event) {
    event.preventDefault();

    const bill = {
        id: billingData.nextBillNumber++,
        customerId: document.getElementById('billCustomer').value,
        customerName: document.getElementById('billCustomer').options[document.getElementById('billCustomer').selectedIndex].text,
        date: document.getElementById('billDate').value,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'pending'
    };

    // Get items
    const itemElements = document.querySelectorAll('.bill-item');
    itemElements.forEach(item => {
        const select = item.querySelector('.item-select');
        const quantity = item.querySelector('.item-quantity');
        
        if (select.value && quantity.value) {
            const selectedOption = select.options[select.selectedIndex];
            bill.items.push({
                productId: select.value,
                productName: selectedOption.text,
                price: parseFloat(selectedOption.dataset.price),
                quantity: parseInt(quantity.value),
                total: parseFloat(selectedOption.dataset.price) * parseInt(quantity.value)
            });
        }
    });

    // Calculate totals
    bill.subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);
    bill.tax = bill.subtotal * 0.13;
    bill.total = bill.subtotal + bill.tax;

    // Process payment with loyalty points
    bill.total = processPaymentWithLoyalty(bill.total, bill.customerId);

    // Add to billing data
    billingData.bills.unshift(bill);
    saveBillingData();
    updateBillsTable();
    closeModal('createBill');
    showNotification('Bill created successfully', 'success');

    // Add loyalty points for purchase
    addLoyaltyPoints(bill.total, bill.customerId);

    // Reset form
    document.getElementById('billForm').reset();
    const billItems = document.getElementById('billItems');
    billItems.innerHTML = '';
    addBillItem();
}

// Update Bills Table
function updateBillsTable() {
    const tbody = document.querySelector('#billsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    billingData.bills.forEach(bill => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${bill.id}</td>
            <td>${bill.customerName}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${currencyManager.formatAmount(bill.total)}</td>
            <td><span class="badge ${bill.status}">${bill.status}</span></td>
            <td>
                <button class="btn-icon" onclick="viewBill(${bill.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="printBill(${bill.id})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// View Bill
function viewBill(billId) {
    const bill = billingData.bills.find(b => b.id === billId);
    if (!bill) return;

    // Create modal content for viewing bill
    const modalContent = `
        <div class="bill-view">
            <div class="bill-header">
                <h2>Bill #${bill.id}</h2>
                <div class="bill-info">
                    <p><strong>Customer:</strong> ${bill.customerName}</p>
                    <p><strong>Date:</strong> ${formatDate(bill.date)}</p>
                    <p><strong>Status:</strong> <span class="badge ${bill.status}">${bill.status}</span></p>
                </div>
            </div>
            <div class="bill-items">
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map(item => `
                            <tr>
                                <td>${item.productName}</td>
                                <td>${currencyManager.formatAmount(item.price)}</td>
                                <td>${item.quantity}</td>
                                <td>${currencyManager.formatAmount(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="bill-summary">
                <p><strong>Subtotal:</strong> ${currencyManager.formatAmount(bill.subtotal)}</p>
                <p><strong>Tax (13%):</strong> ${currencyManager.formatAmount(bill.tax)}</p>
                <p class="total"><strong>Total:</strong> ${currencyManager.formatAmount(bill.total)}</p>
                <p class="amount-in-words"><strong>Amount in words:</strong> ${currencyManager.formatAmountInWords(bill.total)}</p>
            </div>
        </div>
    `;

    // Show modal with bill details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>View Bill</h2>
                <span class="close">&times;</span>
            </div>
            ${modalContent}
            <div class="modal-footer">
                <button class="btn-primary" onclick="printBill(${bill.id})">Print</button>
                <button class="btn-secondary modal-close">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Close modal handlers
    const closeBtn = modal.querySelector('.close');
    const closeModalBtn = modal.querySelector('.modal-close');
    const closeModal = () => {
        modal.remove();
    };

    closeBtn.onclick = closeModal;
    closeModalBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

// Print Bill
function printBill(billId) {
    const bill = billingData.bills.find(b => b.id === billId);
    if (!bill) return;

    // Create printable content
    const printContent = `
        <div class="bill-print">
            <div class="bill-header">
                <h1>VaultBooks</h1>
                <h2>Bill #${bill.id}</h2>
                <div class="bill-info">
                    <p><strong>Customer:</strong> ${bill.customerName}</p>
                    <p><strong>Date:</strong> ${formatDate(bill.date)}</p>
                </div>
            </div>
            <div class="bill-items">
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map(item => `
                            <tr>
                                <td>${item.productName}</td>
                                <td>${currencyManager.formatAmount(item.price)}</td>
                                <td>${item.quantity}</td>
                                <td>${currencyManager.formatAmount(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="bill-summary">
                <p><strong>Subtotal:</strong> ${currencyManager.formatAmount(bill.subtotal)}</p>
                <p><strong>Tax (13%):</strong> ${currencyManager.formatAmount(bill.tax)}</p>
                <p class="total"><strong>Total:</strong> ${currencyManager.formatAmount(bill.total)}</p>
                <p class="amount-in-words"><strong>Amount in words:</strong> ${currencyManager.formatAmountInWords(bill.total)}</p>
            </div>
            <div class="bill-footer">
                <p>Thank you for your business!</p>
            </div>
        </div>
    `;

    // Create printable window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Bill #${bill.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .bill-print { max-width: 800px; margin: 0 auto; }
                    .bill-header { text-align: center; margin-bottom: 30px; }
                    .bill-info { margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    .bill-summary { margin-top: 30px; text-align: right; }
                    .total { font-size: 1.2em; font-weight: bold; }
                    .bill-footer { margin-top: 50px; text-align: center; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Format Date
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// Process payment with loyalty points
function processPaymentWithLoyalty(amount, customerId) {
    const loyaltyData = loyaltySystem.getCustomerSummary(customerId);
    if (!loyaltyData) return amount;

    // Check for available rewards
    const availableRewards = loyaltySystem.getAvailableRewards(customerId);
    const applicableRewards = availableRewards.filter(reward => {
        if (reward.type === 'discount') {
            return true;
        } else if (reward.type === 'gift_card') {
            return reward.value <= amount;
        }
        return false;
    });

    if (applicableRewards.length > 0) {
        // Sort rewards by value to get the best deal
        const bestReward = applicableRewards.sort((a, b) => {
            const valueA = a.type === 'discount' ? amount * a.value : a.value;
            const valueB = b.type === 'discount' ? amount * b.value : b.value;
            return valueB - valueA;
        })[0];

        // Apply the reward
        const result = loyaltySystem.applyReward(customerId, amount, bestReward.id);
        if (result.success) {
            notificationSystem.addNotification({
                type: 'success',
                title: 'Reward Applied',
                message: `${bestReward.name} has been applied to your purchase!`,
                priority: 'normal'
            });
            return result.finalAmount;
        }
    }

    return amount;
}

// Add loyalty points for purchase
function addLoyaltyPoints(amount, customerId) {
    if (!customerId) return;

    const result = loyaltySystem.addPoints(customerId, amount);
    if (result) {
        notificationSystem.addNotification({
            type: 'success',
            title: 'Points Earned',
            message: `You earned ${result.earnedPoints} points! Total: ${result.totalPoints}`,
            priority: 'normal'
        });

        // Check for tier upgrade
        const customer = loyaltySystem.getCustomerSummary(customerId);
        if (customer.tier !== result.tier) {
            notificationSystem.addNotification({
                type: 'success',
                title: 'Tier Upgrade!',
                message: `Congratulations! You've been upgraded to ${result.tier} tier!`,
                priority: 'high'
            });
        }
    }
}

// Generate bill with loyalty information
function generateBill(billData, customerId) {
    const loyaltyData = customerId ? loyaltySystem.getCustomerSummary(customerId) : null;
    
    let billHtml = `
        <div class="bill">
            <div class="bill-header">
                <h2>VaultBooks</h2>
                <p>Invoice #${billData.invoiceNumber}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            ${loyaltyData ? `
                <div class="loyalty-info">
                    <p>Member Tier: ${loyaltyData.tierDetails.name}</p>
                    <p>Points Balance: ${loyaltyData.points}</p>
                    <p>Points Earned: ${Math.floor(billData.total * loyaltyData.tierDetails.pointMultiplier)}</p>
                </div>
            ` : ''}
            <div class="bill-items">
                ${billData.items.map(item => `
                    <div class="bill-item">
                        <span>${item.name}</span>
                        <span>${item.quantity} x ${currencyManager.formatAmount(item.price)}</span>
                        <span>${currencyManager.formatAmount(item.quantity * item.price)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="bill-summary">
                <div class="summary-item">
                    <span>Subtotal</span>
                    <span>${currencyManager.formatAmount(billData.subtotal)}</span>
                </div>
                ${billData.discount ? `
                    <div class="summary-item discount">
                        <span>Discount</span>
                        <span>-${currencyManager.formatAmount(billData.discount)}</span>
                    </div>
                ` : ''}
                <div class="summary-item">
                    <span>Tax (${billData.taxRate}%)</span>
                    <span>${currencyManager.formatAmount(billData.tax)}</span>
                </div>
                <div class="summary-item total">
                    <span>Total</span>
                    <span>${currencyManager.formatAmount(billData.total)}</span>
                </div>
            </div>
            <div class="bill-footer">
                <p>Thank you for your business!</p>
                ${loyaltyData ? `
                    <div class="qr-code" id="loyaltyQR"></div>
                    <p>Scan to view loyalty card</p>
                ` : `
                    <p>Join our loyalty program to earn points and rewards!</p>
                `}
            </div>
        </div>
    `;

    // Generate QR code for loyalty card
    if (loyaltyData) {
        qrSystem.generateQR({
            type: 'loyalty',
            id: customerId,
            tier: loyaltyData.tier,
            points: loyaltyData.points
        }).then(qrCode => {
            document.getElementById('loyaltyQR').innerHTML = `
                <img src="${qrCode}" alt="Loyalty QR Code">
            `;
        });
    }

    return billHtml;
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeBilling();
});

// Billing Module

let billItems = [];
const TAX_RATE = 0.13; // 13% tax rate

// Initialize billing form
function initializeBillingForm() {
    const billForm = document.getElementById('billForm');
    const addItemButton = document.getElementById('addBillItem');
    const customerSelect = document.getElementById('billCustomer');
    const itemsContainer = document.getElementById('billItems');
    
    // Load customers into select
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
    
    // Add first item row
    addBillItemRow();
    
    // Add item button click handler
    if (addItemButton) {
        addItemButton.addEventListener('click', addBillItemRow);
    }
    
    // Update totals when form changes
    if (billForm) {
        billForm.addEventListener('change', updateBillTotals);
    }
}

// Add new item row to bill
function addBillItemRow() {
    const container = document.getElementById('billItems');
    if (!container) return;
    
    const itemRow = document.createElement('div');
    itemRow.className = 'bill-item';
    
    itemRow.innerHTML = `
        <select class="item-select" required>
            <option value="">Select Item</option>
            ${inventory.map(item => `
                <option value="${item.id}" 
                        data-price="${item.price}"
                        data-stock="${item.quantity}">
                    ${item.name} (Stock: ${item.quantity})
                </option>
            `).join('')}
        </select>
        <input type="number" class="item-quantity" min="1" required>
        <span class="item-price">$0.00</span>
        <span class="item-total">$0.00</span>
        <button type="button" class="remove-item">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Add event listeners
    const select = itemRow.querySelector('.item-select');
    const quantity = itemRow.querySelector('.item-quantity');
    const removeButton = itemRow.querySelector('.remove-item');
    
    select.addEventListener('change', () => updateItemPrice(itemRow));
    quantity.addEventListener('input', () => updateItemTotal(itemRow));
    removeButton.addEventListener('click', () => {
        itemRow.remove();
        updateBillTotals();
    });

    container.appendChild(itemRow);
}

// Update item price when selection changes
function updateItemPrice(itemRow) {
    const select = itemRow.querySelector('.item-select');
    const priceSpan = itemRow.querySelector('.item-price');
    const quantityInput = itemRow.querySelector('.item-quantity');
    
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption.dataset.price;
    const stock = parseInt(selectedOption.dataset.stock);
    
    priceSpan.textContent = currencyManager.formatAmount(price);
    quantityInput.max = stock;
    
    updateItemTotal(itemRow);
}

// Update item total when quantity changes
function updateItemTotal(itemRow) {
    const priceSpan = itemRow.querySelector('.item-price');
    const quantityInput = itemRow.querySelector('.item-quantity');
    const totalSpan = itemRow.querySelector('.item-total');
    
    const price = parseFloat(priceSpan.textContent.replace(/[^0-9.-]+/g, ''));
    const quantity = parseInt(quantityInput.value) || 0;
    
    totalSpan.textContent = currencyManager.formatAmount(price * quantity);
    updateBillTotals();
}

// Update bill totals
function updateBillTotals() {
    const items = document.querySelectorAll('.bill-item');
    let subtotal = 0;
    
    items.forEach(item => {
        const totalSpan = item.querySelector('.item-total');
        subtotal += parseFloat(totalSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    });
    
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    // Update summary
    document.getElementById('billSubtotal').textContent = currencyManager.formatAmount(subtotal);
    document.getElementById('billTax').textContent = currencyManager.formatAmount(tax);
    document.getElementById('billTotal').textContent = currencyManager.formatAmount(total);
}

// View bill details
function viewBillDetails(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    const modal = document.getElementById('billDetailsModal');
    const content = modal.querySelector('.modal-content');
    
    content.innerHTML = `
        <h2>Bill Details - ${bill.number}</h2>
        <div class="bill-info">
            <p><strong>Customer:</strong> ${bill.customerName}</p>
            <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${bill.status}</p>
        </div>
        <table class="bill-items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${bill.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${currencyManager.formatAmount(item.price)}</td>
                        <td>${currencyManager.formatAmount(item.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="bill-summary">
            <p><strong>Subtotal:</strong> ${currencyManager.formatAmount(bill.subtotal)}</p>
            <p><strong>Tax (${(TAX_RATE * 100)}%):</strong> ${currencyManager.formatAmount(bill.tax)}</p>
            <p><strong>Total:</strong> ${currencyManager.formatAmount(bill.total)}</p>
            <p><strong>Amount in words:</strong> ${currencyManager.formatAmountInWords(bill.total)}</p>
        </div>
        <div class="bill-actions">
            <button onclick="printBill(${bill.id})" class="btn-print">
                <i class="fas fa-print"></i> Print
            </button>
            <button onclick="updateBillStatus(${bill.id})" class="btn-status">
                <i class="fas fa-sync-alt"></i> Update Status
            </button>
        </div>
    `;
    
    showModal('billDetailsModal');
}

// Print bill
function printBill(billId) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Bill - ${bill.number}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .bill-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                .summary { margin-top: 30px; text-align: right; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>VaultBooks</h1>
                <h2>Bill - ${bill.number}</h2>
            </div>
            <div class="bill-info">
                <p><strong>Customer:</strong> ${bill.customerName}</p>
                <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${bill.status}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${currencyManager.formatAmount(item.price)}</td>
                            <td>${currencyManager.formatAmount(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">
                <p><strong>Subtotal:</strong> ${currencyManager.formatAmount(bill.subtotal)}</p>
                <p><strong>Tax (${(TAX_RATE * 100)}%):</strong> ${currencyManager.formatAmount(bill.tax)}</p>
                <p><strong>Total:</strong> ${currencyManager.formatAmount(bill.total)}</p>
                <p><strong>Amount in words:</strong> ${currencyManager.formatAmountInWords(bill.total)}</p>
            </div>
            <div class="footer">
                <p>Thank you for your business!</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeBillingForm();
});

// Billing System
class BillingSystem {
    constructor() {
        this.currentBill = null;
        this.billItems = [];
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Add item to bill
        const addItemBtn = document.getElementById('addBillItem');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addBillItem());
        }

        // Bill form submission
        const billForm = document.getElementById('billForm');
        if (billForm) {
            billForm.addEventListener('submit', (e) => this.handleBillSubmit(e));
        }

        // Quick item search
        const itemSearch = document.getElementById('itemSearch');
        if (itemSearch) {
            itemSearch.addEventListener('input', (e) => this.handleItemSearch(e));
        }
    }

    // Add new item to bill
    addBillItem() {
        const itemsContainer = document.getElementById('billItems');
        const itemIndex = this.billItems.length;

        const itemRow = document.createElement('div');
        itemRow.className = 'bill-item row g-3 mb-3 align-items-center';
        itemRow.innerHTML = `
            <div class="col-md-4">
                <div class="item-search-container">
                    <input type="text" class="form-control item-search" placeholder="Search item...">
                    <div class="search-results d-none"></div>
                </div>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" value="1" min="1">
            </div>
            <div class="col-md-2">
                <span class="form-control-plaintext item-price">$0.00</span>
            </div>
            <div class="col-md-2">
                <span class="form-control-plaintext item-total">$0.00</span>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners for the new item
        const searchInput = itemRow.querySelector('.item-search');
        const searchResults = itemRow.querySelector('.search-results');
        const quantityInput = itemRow.querySelector('.item-quantity');
        const removeBtn = itemRow.querySelector('.remove-item');

        searchInput.addEventListener('input', (e) => this.handleItemSearch(e, searchResults));
        searchInput.addEventListener('focus', () => searchResults.classList.remove('d-none'));
        searchInput.addEventListener('blur', () => setTimeout(() => searchResults.classList.add('d-none'), 200));

        quantityInput.addEventListener('input', () => this.updateBillTotals());
        removeBtn.addEventListener('click', () => {
            itemRow.remove();
            this.billItems.splice(itemIndex, 1);
            this.updateBillTotals();
        });

        itemsContainer.appendChild(itemRow);
        this.billItems.push({ quantity: 1, price: 0, total: 0 });
    }

    // Handle item search
    handleItemSearch(e, resultsContainer) {
        const searchTerm = e.target.value.toLowerCase();
        const searchResults = resultsContainer || e.target.nextElementSibling;
        
        if (searchTerm.length < 2) {
            searchResults.classList.add('d-none');
            return;
        }

        const matchingItems = inventory.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );

        searchResults.innerHTML = '';
        matchingItems.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    <span class="item-category">${item.category}</span>
                    <span class="item-price">${currencyManager.formatAmount(item.price)}</span>
                </div>
            `;

            resultItem.addEventListener('click', () => {
                const itemRow = e.target.closest('.bill-item');
                const priceElement = itemRow.querySelector('.item-price');
                const quantityInput = itemRow.querySelector('.item-quantity');
                
                e.target.value = item.name;
                priceElement.textContent = currencyManager.formatAmount(item.price);
                
                const index = Array.from(itemRow.parentElement.children).indexOf(itemRow);
                this.billItems[index] = {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: parseInt(quantityInput.value),
                    total: item.price * parseInt(quantityInput.value)
                };

                this.updateBillTotals();
                searchResults.classList.add('d-none');
            });

            searchResults.appendChild(resultItem);
        });

        searchResults.classList.remove('d-none');
    }

    // Update bill totals
    updateBillTotals() {
        let subtotal = 0;
        
        this.billItems.forEach((item, index) => {
            const itemRow = document.querySelectorAll('.bill-item')[index];
            const quantity = parseInt(itemRow.querySelector('.item-quantity').value);
            const price = parseFloat(itemRow.querySelector('.item-price').textContent.replace(/[^0-9.-]+/g, ''));
            const total = quantity * price;

            itemRow.querySelector('.item-total').textContent = currencyManager.formatAmount(total);
            item.quantity = quantity;
            item.total = total;
            subtotal += total;
        });

        const tax = subtotal * 0.13; // 13% tax
        const total = subtotal + tax;

        document.getElementById('billSubtotal').textContent = currencyManager.formatAmount(subtotal);
        document.getElementById('billTax').textContent = currencyManager.formatAmount(tax);
        document.getElementById('billTotal').textContent = currencyManager.formatAmount(total);
    }

    // Handle bill submission
    async handleBillSubmit(e) {
        e.preventDefault();

        const billData = {
            id: Date.now(),
            number: `BILL-${bills.length + 1}`.padStart(8, '0'),
            date: document.getElementById('billDate').value,
            customerId: document.getElementById('billCustomer').value,
            items: this.billItems,
            subtotal: parseFloat(document.getElementById('billSubtotal').textContent.replace(/[^0-9.-]+/g, '')),
            tax: parseFloat(document.getElementById('billTax').textContent.replace(/[^0-9.-]+/g, '')),
            total: parseFloat(document.getElementById('billTotal').textContent.replace(/[^0-9.-]+/g, '')),
            status: 'pending',
            notes: document.getElementById('billNotes').value,
            createdBy: auth.currentUser.username,
            createdAt: new Date().toISOString()
        };

        try {
            // Update inventory
            this.billItems.forEach(item => {
                const inventoryItem = inventory.find(i => i.id === item.id);
                if (inventoryItem) {
                    inventoryItem.quantity -= item.quantity;
                }
            });

            // Update customer
            const customer = customers.find(c => c.id === parseInt(billData.customerId));
            if (customer) {
                customer.totalPurchases += billData.total;
                customer.lastPurchase = new Date().toISOString();
            }

            // Save bill
            bills.push(billData);
            localStorage.setItem('bills', JSON.stringify(bills));
            localStorage.setItem('inventory', JSON.stringify(inventory));
            localStorage.setItem('customers', JSON.stringify(customers));

            // Show success message
            auth.showNotification('Bill created successfully!', 'success');
            
            // Generate and show invoice
            this.showInvoice(billData);
            
            // Reset form
            e.target.reset();
            document.getElementById('billItems').innerHTML = '';
            this.billItems = [];
            this.updateBillTotals();

        } catch (error) {
            auth.showNotification('Error creating bill: ' + error.message, 'error');
        }
    }

    // Show invoice
    showInvoice(bill) {
        const customer = customers.find(c => c.id === parseInt(bill.customerId));
        const invoiceHtml = `
            <div class="invoice-header">
                <div class="company-info">
                    <h2>VaultBooks</h2>
                    <p>123 Business Street</p>
                    <p>City, Country</p>
                    <p>Phone: (123) 456-7890</p>
                </div>
                <div class="invoice-info">
                    <h3>INVOICE</h3>
                    <p><strong>Invoice #:</strong> ${bill.number}</p>
                    <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${new Date(new Date(bill.date).getTime() + 30*24*60*60*1000).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="customer-info">
                <h4>Bill To:</h4>
                <p><strong>${customer.name}</strong></p>
                <p>${customer.address}</p>
                <p>Phone: ${customer.phone}</p>
                <p>Email: ${customer.email}</p>
            </div>
            <table class="invoice-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${currencyManager.formatAmount(item.price)}</td>
                            <td>${currencyManager.formatAmount(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Subtotal</td>
                        <td>${currencyManager.formatAmount(bill.subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3">Tax (13%)</td>
                        <td>${currencyManager.formatAmount(bill.tax)}</td>
                    </tr>
                    <tr class="total">
                        <td colspan="3">Total</td>
                        <td>${currencyManager.formatAmount(bill.total)}</td>
                    </tr>
                    <tr class="amount-in-words">
                        <td colspan="4">
                            Amount in words: ${currencyManager.formatAmountInWords(bill.total)}
                        </td>
                    </tr>
                </tfoot>
            </table>
            <div class="invoice-footer">
                <p><strong>Notes:</strong> ${bill.notes || 'No notes'}</p>
                <p>Thank you for your business!</p>
            </div>
        `;

        const invoiceWindow = window.open('', '_blank');
        invoiceWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${bill.number}</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 40px;
                    }
                    .company-info h2 {
                        color: #4361ee;
                        margin: 0 0 10px 0;
                    }
                    .invoice-info {
                        text-align: right;
                    }
                    .customer-info {
                        margin-bottom: 30px;
                    }
                    .invoice-items {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .invoice-items th,
                    .invoice-items td {
                        padding: 10px;
                        border: 1px solid #ddd;
                    }
                    .invoice-items th {
                        background-color: #f5f5f5;
                    }
                    .invoice-items tfoot tr:last-child {
                        font-weight: bold;
                        background-color: #f5f5f5;
                    }
                    .invoice-footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #666;
                    }
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                ${invoiceHtml}
                <script>
                    window.onload = () => window.print();
                </script>
            </body>
            </html>
        `);
    }
}

// Initialize billing system
const billing = new BillingSystem();

// Billing System

// Initialize billing system when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeBilling();
});

// Initialize billing system
function initializeBilling() {
    setupBillingEventListeners();
    loadInitialBillingData();
}

// Setup billing event listeners
function setupBillingEventListeners() {
    // New Transaction Button
    const newTransactionBtn = document.querySelector('[onclick="showTransactionModal()"]');
    if (newTransactionBtn) {
        newTransactionBtn.addEventListener('click', showTransactionModal);
    }

    // Transaction Form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
}

// Load initial billing data
async function loadInitialBillingData() {
    try {
        const transactions = await fetchTransactions();
        updateTransactionsTable(transactions);
    } catch (error) {
        console.error('Failed to load billing data:', error);
        notificationSystem.addNotification({
            type: 'error',
            title: 'Loading Error',
            message: 'Failed to load billing data. Please refresh the page.',
            priority: 'high'
        });
    }
}

// Show transaction modal
function showTransactionModal() {
    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    populateCustomerSelect();
    modal.show();
}

// Populate customer select dropdown
async function populateCustomerSelect() {
    try {
        const customers = await fetchCustomers();
        const select = document.getElementById('transactionCustomer');
        
        select.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load customers:', error);
        notificationSystem.addNotification({
            type: 'error',
            title: 'Loading Error',
            message: 'Failed to load customer list. Please try again.',
            priority: 'high'
        });
    }
}

// Handle transaction form submission
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const transactionData = {
        customerId: form.querySelector('#transactionCustomer').value,
        amount: parseFloat(form.querySelector('#transactionAmount').value),
        description: form.querySelector('#transactionDescription').value,
        date: new Date().toISOString()
    };

    try {
        await saveTransaction(transactionData);
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
        
        // Refresh data
        await loadInitialBillingData();
        
        // Show success notification
        notificationSystem.addNotification({
            type: 'success',
            title: 'Success',
            message: 'Transaction saved successfully.',
            priority: 'normal'
        });

        // Update loyalty points if applicable
        if (transactionData.customerId) {
            await updateLoyaltyPoints(transactionData);
        }

    } catch (error) {
        console.error('Failed to save transaction:', error);
        notificationSystem.addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to save transaction. Please try again.',
            priority: 'high'
        });
    }
}

// Save transaction to database
async function saveTransaction(transactionData) {
    // For demo purposes, storing in localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const newTransaction = {
        id: Date.now().toString(),
        ...transactionData,
        status: 'completed'
    };
    
    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    return newTransaction;
}

// Update loyalty points
async function updateLoyaltyPoints(transaction) {
    try {
        const points = Math.floor(transaction.amount / 10); // 1 point per $10 spent
        await loyaltySystem.addPoints(transaction.customerId, points);
        
        notificationSystem.addNotification({
            type: 'success',
            title: 'Loyalty Points',
            message: `Added ${points} loyalty points to customer account.`,
            priority: 'low'
        });
    } catch (error) {
        console.error('Failed to update loyalty points:', error);
    }
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.customerName || 'N/A'}</td>
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${currencyManager.formatAmount(transaction.amount)}</td>
            <td>
                <span class="badge bg-${getStatusBadgeClass(transaction.status)}">
                    ${transaction.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${transaction.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="printTransaction('${transaction.id}')">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Get status badge class
function getStatusBadgeClass(status) {
    const statusClasses = {
        'completed': 'success',
        'pending': 'warning',
        'failed': 'danger',
        'refunded': 'info'
    };
    return statusClasses[status] || 'secondary';
}

// View transaction details
function viewTransaction(id) {
    // Implement view transaction logic
}

// Print transaction
function printTransaction(id) {
    // Implement print transaction logic
}

// Fetch transactions
async function fetchTransactions() {
    // For demo purposes, getting from localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Add customer names
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    return transactions.map(transaction => {
        const customer = customers.find(c => c.id === transaction.customerId);
        return {
            ...transaction,
            customerName: customer ? customer.name : 'N/A'
        };
    });
}

// Fetch customers
async function fetchCustomers() {
    // For demo purposes, getting from localStorage
    return JSON.parse(localStorage.getItem('customers') || '[]');
}

// Export billing functions
window.billingSystem = {
    showTransactionModal,
    viewTransaction,
    printTransaction
};

// Initialize billing system
let currentBill = null;
let bills = JSON.parse(localStorage.getItem('bills')) || [];

// Create new invoice
function createNewInvoice() {
    const invoiceNumber = generateInvoiceNumber();
    const customerName = prompt('Enter customer name:');
    if (!customerName) return;

    currentBill = {
        number: invoiceNumber,
        customer: customerName,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        date: new Date().toISOString(),
        status: 'Pending'
    };

    updateBillingForm();
}

// Add item to current bill
function addItemToBill() {
    if (!currentBill) {
        alert('Please create a new invoice first');
        return;
    }

    const itemName = prompt('Enter item name:');
    const quantity = parseInt(prompt('Enter quantity:'), 10);
    const price = parseFloat(prompt('Enter price per unit:'));

    if (itemName && !isNaN(quantity) && !isNaN(price)) {
        const item = {
            name: itemName,
            quantity: quantity,
            price: price,
            total: quantity * price
        };

        currentBill.items.push(item);
        updateBillTotals();
        updateBillingForm();
    }
}

// Update bill totals
function updateBillTotals() {
    if (!currentBill) return;

    currentBill.subtotal = currentBill.items.reduce((sum, item) => sum + item.total, 0);
    currentBill.tax = currentBill.subtotal * 0.13; // 13% tax
    currentBill.total = currentBill.subtotal + currentBill.tax;
}

// Save current bill
function saveBill() {
    if (!currentBill || currentBill.items.length === 0) {
        alert('Please add items to the bill first');
        return;
    }

    bills.push(currentBill);
    localStorage.setItem('bills', JSON.stringify(bills));
    
    updateBillingTable();
    resetBillingForm();
    
    alert('Invoice saved successfully!');
}

// Update billing form
function updateBillingForm() {
    const billingForm = document.getElementById('billingForm');
    if (!billingForm) return;

    if (!currentBill) {
        billingForm.innerHTML = '<p>No active invoice. Create a new invoice to start billing.</p>';
        return;
    }

    let html = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Invoice #${currentBill.number}</h5>
                <p class="card-text">Customer: ${currentBill.customer}</p>
                <p class="card-text">Date: ${new Date(currentBill.date).toLocaleDateString()}</p>
            </div>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentBill.items.forEach(item => {
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-end">Subtotal:</td>
                    <td>${formatCurrency(currentBill.subtotal)}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-end">Tax (13%):</td>
                    <td>${formatCurrency(currentBill.tax)}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                    <td><strong>${formatCurrency(currentBill.total)}</strong></td>
                </tr>
            </tfoot>
        </table>
        
        <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-primary" onclick="addItemToBill()">Add Item</button>
            <button class="btn btn-success" onclick="saveBill()">Save Invoice</button>
        </div>
    `;

    billingForm.innerHTML = html;
}

// Reset billing form
function resetBillingForm() {
    currentBill = null;
    updateBillingForm();
}

// Generate invoice number
function generateInvoiceNumber() {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions
window.createNewInvoice = createNewInvoice;
window.addItemToBill = addItemToBill;
window.saveBill = saveBill;
