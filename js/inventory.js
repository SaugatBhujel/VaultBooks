// Inventory functions
function addNewItem() {
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
            id: generateItemId(),
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
        loadInventory();
        updateInventoryStats();

        // Clear form and close modal
        document.getElementById('addItemForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        modal.hide();

        // Show success message
        alert('Item added successfully!');
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Failed to add item. Please try again.');
    }
}

function generateItemId() {
    return 'ITEM-' + Date.now();
}

function loadInventory() {
    try {
        console.log('Starting loadInventory function');
        
        const inventoryTable = document.getElementById('inventoryTable');
        if (!inventoryTable) {
            throw new Error('Inventory table element not found');
        }

        const data = getData();
        console.log('Loaded data:', data);

        // Ensure data and inventory array exist and are valid
        if (!data || !Array.isArray(data.inventory)) {
            data.inventory = [];
            saveData(data);
        }

        // Sanitize inventory data
        let inventory = data.inventory.map(item => ({
            id: item.id || `ITEM-${Date.now()}`,
            name: item.name || 'Unnamed Item',
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.price) || 0,
            category: item.category || 'Other',
            status: item.status || 'in-stock',
            dateAdded: item.dateAdded || new Date().toISOString()
        }));

        // Apply filters
        const searchInput = document.getElementById('inventorySearch');
        const categorySelect = document.getElementById('categoryFilter');
        
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            inventory = inventory.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }

        if (categorySelect && categorySelect.value) {
            inventory = inventory.filter(item => item.category === categorySelect.value);
        }

        // Create table content
        let tableContent;
        if (inventory.length === 0) {
            tableContent = `
                <tr>
                    <td colspan="6" class="text-center">
                        ${searchInput?.value ? 'No items found matching your search' : 'No items in inventory'}
                    </td>
                </tr>
            `;
        } else {
            tableContent = inventory.map(item => `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>$${(parseFloat(item.price) || 0).toFixed(2)}</td>
                    <td>
                        <span class="badge bg-${getStockStatusColor(item.quantity)}">
                            ${getStockStatus(item.quantity)}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="editItem('${item.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-success" onclick="adjustStock('${item.id}')">
                                <i class="fas fa-boxes"></i> Stock
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Update table
        inventoryTable.innerHTML = tableContent;

        // Update stats and filters
        updateInventoryStats();
        updateCategoryFilter(inventory);
        
        console.log(`Loaded ${inventory.length} items successfully`);
    } catch (error) {
        console.error('Detailed error in loadInventory:', error);
        const inventoryTable = document.getElementById('inventoryTable');
        if (inventoryTable) {
            inventoryTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error: ${error.message}. Please try refreshing the page.
                    </td>
                </tr>
            `;
        }
    }
}

function editItem(itemId) {
    const data = getData();
    const item = data.inventory.find(i => i.id === itemId);
    if (item) {
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name;
        document.getElementById('editItemQuantity').value = item.quantity;
        document.getElementById('editItemPrice').value = item.price;
        document.getElementById('editItemCategory').value = item.category;
        
        const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
        modal.show();
    }
}

function updateItem() {
    try {
        const itemId = document.getElementById('editItemId').value;
        const data = getData();
        const itemIndex = data.inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
            data.inventory[itemIndex] = {
                id: itemId,
                name: document.getElementById('editItemName').value,
                quantity: parseInt(document.getElementById('editItemQuantity').value),
                price: parseFloat(document.getElementById('editItemPrice').value),
                category: document.getElementById('editItemCategory').value,
                status: getStockStatus(parseInt(document.getElementById('editItemQuantity').value))
            };
            saveData(data);
            loadInventory();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            modal.hide();
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Failed to update item. Please try again.');
    }
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            const data = getData();
            data.inventory = data.inventory.filter(i => i.id !== itemId);
            saveData(data);
            loadInventory();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

function adjustStock(itemId) {
    const quantity = prompt('Enter quantity to add (use negative number to reduce stock):');
    if (quantity !== null) {
        try {
            const data = getData();
            const item = data.inventory.find(i => i.id === itemId);
            if (item) {
                const newQuantity = item.quantity + parseInt(quantity);
                if (newQuantity < 0) {
                    alert('Stock cannot be negative');
                    return;
                }
                item.quantity = newQuantity;
                saveData(data);
                loadInventory();
            }
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert('Failed to adjust stock. Please try again.');
        }
    }
}

function updateInventoryStats() {
    const data = getData();
    if (!data.inventory) return;

    const totalItems = data.inventory.length;
    const lowStockItems = data.inventory.filter(item => item.quantity <= 10).length;
    const totalValue = data.inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const categories = new Set(data.inventory.map(item => item.category)).size;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('totalStockValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('totalCategories').textContent = categories;
}

function getStockStatus(quantity) {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
}

function getStockStatusColor(quantity) {
    if (quantity <= 0) return 'danger';
    if (quantity <= 10) return 'warning';
    return 'success';
}

function updateCategoryFilter(inventory) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const categories = [...new Set(inventory.map(item => item.category))];
        const options = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + options;
    }
}

// Event Listeners
function setupInventoryListeners() {
    const searchInput = document.getElementById('inventorySearch');
    const categorySelect = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadInventory();
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            loadInventory();
        });
    }
}

// Initialize inventory when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupInventoryListeners();
    loadInventory();
    debugInventory();
});

// Add this function to help debug
function debugInventory() {
    const data = getData();
    console.log('Current Inventory:', data.inventory || []);
}

// Add this function to help with debugging
function testAddSampleItem() {
    try {
        const sampleItem = {
            id: 'ITEM-' + Date.now(),
            name: 'Test Item',
            quantity: 10,
            price: 99.99,
            category: 'electronics',
            status: 'in-stock',
            dateAdded: new Date().toISOString()
        };

        const data = getData();
        if (!data.inventory) data.inventory = [];
        data.inventory.push(sampleItem);
        saveData(data);
        loadInventory();
        console.log('Sample item added successfully');
        return true;
    } catch (error) {
        console.error('Error adding sample item:', error);
        return false;
    }
}

// Add this function to test with sample data
function addSampleInventory() {
    const sampleItems = [
        {
            id: 'ITEM-1',
            name: 'Laptop',
            quantity: 15,
            price: 999.99,
            category: 'electronics',
            status: 'in-stock',
            dateAdded: new Date().toISOString()
        },
        {
            id: 'ITEM-2',
            name: 'T-Shirt',
            quantity: 50,
            price: 19.99,
            category: 'clothing',
            status: 'in-stock',
            dateAdded: new Date().toISOString()
        },
        {
            id: 'ITEM-3',
            name: 'Coffee Maker',
            quantity: 8,
            price: 79.99,
            category: 'electronics',
            status: 'low-stock',
            dateAdded: new Date().toISOString()
        }
    ];

    try {
        const data = getData();
        data.inventory = sampleItems;
        saveData(data);
        loadInventory();
        console.log('Sample inventory added successfully');
        return true;
    } catch (error) {
        console.error('Error adding sample inventory:', error);
        return false;
    }
} 