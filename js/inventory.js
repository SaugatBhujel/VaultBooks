// Inventory module
window.inventory = {
    initInventory() {
        try {
            this.setupInventoryListeners();
            this.loadInventory();
            this.updateInventoryStats();
        } catch (error) {
            console.error('Failed to initialize inventory:', error);
        }
    },

    generateItemId() {
        return 'INV-' + Date.now();
    },

    addNewItem() {
        try {
            const name = document.getElementById('itemName').value.trim();
            const quantity = parseInt(document.getElementById('itemQuantity').value) || 0;
            const price = parseFloat(document.getElementById('itemPrice').value) || 0;
            const category = document.getElementById('itemCategory').value;

            // Validate inputs
            if (!name) {
                alert('Item name is required');
                return;
            }

            if (quantity < 0) {
                alert('Quantity cannot be negative');
                return;
            }

            if (price < 0) {
                alert('Price cannot be negative');
                return;
            }

            const itemData = {
                id: this.generateItemId(),
                name: name,
                quantity: quantity,
                price: price,
                category: category,
                status: 'in-stock',
                dateAdded: new Date().toISOString()
            };

            const data = getData();
            if (!Array.isArray(data.inventory)) {
                data.inventory = [];
            }

            data.inventory.push(itemData);
            saveData(data);
            
            console.log('Item added successfully:', itemData);
            this.loadInventory();
            this.updateInventoryStats();

            // Clear form and close modal
            document.getElementById('addItemForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
            modal.hide();
        } catch (error) {
            console.error('Failed to add new item:', error);
            alert('Failed to add item. Please try again.');
        }
    },

    loadInventory() {
        try {
            const data = getData();
            const inventory = data.inventory || [];
            
            // Sort by date added descending
            inventory.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            
            const tableBody = document.getElementById('inventoryTableBody');
            tableBody.innerHTML = '';
            
            inventory.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.quantity * item.price)}</td>
                    <td>
                        <span class="badge bg-${this.getStockStatusColor(item.quantity)}">
                            ${this.getStockStatus(item.quantity)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.inventory.editItem('${item.id}')">Edit</button>
                        <button class="btn btn-sm btn-warning" onclick="window.inventory.adjustStock('${item.id}')">Stock</button>
                        <button class="btn btn-sm btn-danger" onclick="window.inventory.deleteItem('${item.id}')">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Update category filter
            this.updateCategoryFilter(inventory);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    },

    editItem(itemId) {
        try {
            const data = getData();
            const item = data.inventory.find(i => i.id === itemId);
            
            if (item) {
                // Populate form
                document.getElementById('editItemId').value = item.id;
                document.getElementById('editItemName').value = item.name;
                document.getElementById('editItemQuantity').value = item.quantity;
                document.getElementById('editItemPrice').value = item.price;
                document.getElementById('editItemCategory').value = item.category;
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Failed to edit item:', error);
        }
    },

    updateItem() {
        try {
            const itemId = document.getElementById('editItemId').value;
            const name = document.getElementById('editItemName').value.trim();
            const quantity = parseInt(document.getElementById('editItemQuantity').value) || 0;
            const price = parseFloat(document.getElementById('editItemPrice').value) || 0;
            const category = document.getElementById('editItemCategory').value;

            if (!name || quantity < 0 || price < 0) {
                alert('Please enter valid values');
                return;
            }

            const data = getData();
            const index = data.inventory.findIndex(i => i.id === itemId);
            
            if (index !== -1) {
                data.inventory[index] = {
                    ...data.inventory[index],
                    name,
                    quantity,
                    price,
                    category
                };
                
                saveData(data);
                this.loadInventory();
                this.updateInventoryStats();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
                modal.hide();
            }
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    },

    deleteItem(itemId) {
        try {
            if (confirm('Are you sure you want to delete this item?')) {
                const data = getData();
                data.inventory = data.inventory.filter(i => i.id !== itemId);
                saveData(data);
                
                this.loadInventory();
                this.updateInventoryStats();
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    },

    adjustStock(itemId) {
        try {
            const data = getData();
            const item = data.inventory.find(i => i.id === itemId);
            
            if (item) {
                const adjustment = parseInt(prompt(`Current stock: ${item.quantity}\nEnter adjustment amount (+/-):`, '0'));
                
                if (!isNaN(adjustment)) {
                    const newQuantity = item.quantity + adjustment;
                    
                    if (newQuantity >= 0) {
                        item.quantity = newQuantity;
                        saveData(data);
                        this.loadInventory();
                        this.updateInventoryStats();
                    } else {
                        alert('Stock cannot be negative');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to adjust stock:', error);
        }
    },

    updateInventoryStats() {
        try {
            const data = getData();
            const inventory = data.inventory || [];
            
            const totalItems = inventory.length;
            const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const lowStock = inventory.filter(item => item.quantity <= 10).length;
            
            document.getElementById('totalItems').textContent = totalItems;
            document.getElementById('totalValue').textContent = formatCurrency(totalValue);
            document.getElementById('lowStock').textContent = lowStock;
        } catch (error) {
            console.error('Failed to update inventory stats:', error);
        }
    },

    getStockStatus(quantity) {
        if (quantity <= 0) return 'Out of Stock';
        if (quantity <= 10) return 'Low Stock';
        return 'In Stock';
    },

    getStockStatusColor(quantity) {
        if (quantity <= 0) return 'danger';
        if (quantity <= 10) return 'warning';
        return 'success';
    },

    updateCategoryFilter(inventory) {
        try {
            const categories = new Set(inventory.map(item => item.category));
            const select = document.getElementById('categoryFilter');
            
            select.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to update category filter:', error);
        }
    },

    setupInventoryListeners() {
        try {
            // Add item form submit
            document.getElementById('addItemForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewItem();
            });

            // Edit item form submit
            document.getElementById('editItemForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateItem();
            });

            // Category filter change
            document.getElementById('categoryFilter').addEventListener('change', () => {
                this.loadInventory();
            });
        } catch (error) {
            console.error('Failed to setup inventory listeners:', error);
        }
    },

    debugInventory() {
        try {
            const data = getData();
            console.log('Current inventory data:', data.inventory);
            return data.inventory;
        } catch (error) {
            console.error('Failed to debug inventory:', error);
            return null;
        }
    }
};

// Initialize inventory when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.inventory.initInventory();
    } catch (error) {
        console.error('Error initializing inventory module:', error);
    }
});