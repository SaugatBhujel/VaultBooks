// Database configuration
const DB_NAME = 'VaultBooksDB';
const DB_VERSION = 1;

// Database schema
const STORES = {
    users: 'users',
    inventory: 'inventory',
    customers: 'customers',
    bills: 'bills',
    finances: 'finances',
    settings: 'settings'
};

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.users)) {
                db.createObjectStore(STORES.users, { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains(STORES.inventory)) {
                db.createObjectStore(STORES.inventory, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.customers)) {
                db.createObjectStore(STORES.customers, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.bills)) {
                db.createObjectStore(STORES.bills, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.finances)) {
                db.createObjectStore(STORES.finances, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.settings)) {
                db.createObjectStore(STORES.settings, { keyPath: 'id' });
            }
        };
    });
}

// Generic database operations
async function dbOperation(storeName, mode, operation) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Database operations
const db = {
    // User operations
    async addUser(userData) {
        return dbOperation(STORES.users, 'readwrite', (store) => store.add(userData));
    },

    async getUser(username) {
        return dbOperation(STORES.users, 'readonly', (store) => store.get(username));
    },

    async updateUser(userData) {
        return dbOperation(STORES.users, 'readwrite', (store) => store.put(userData));
    },

    // Inventory operations
    async addInventoryItem(item) {
        return dbOperation(STORES.inventory, 'readwrite', (store) => store.add(item));
    },

    async getInventoryItem(id) {
        return dbOperation(STORES.inventory, 'readonly', (store) => store.get(id));
    },

    async getAllInventory() {
        return dbOperation(STORES.inventory, 'readonly', (store) => store.getAll());
    },

    async updateInventoryItem(item) {
        return dbOperation(STORES.inventory, 'readwrite', (store) => store.put(item));
    },

    async deleteInventoryItem(id) {
        return dbOperation(STORES.inventory, 'readwrite', (store) => store.delete(id));
    },

    // Customer operations
    async addCustomer(customer) {
        return dbOperation(STORES.customers, 'readwrite', (store) => store.add(customer));
    },

    async getCustomer(id) {
        return dbOperation(STORES.customers, 'readonly', (store) => store.get(id));
    },

    async getAllCustomers() {
        return dbOperation(STORES.customers, 'readonly', (store) => store.getAll());
    },

    async updateCustomer(customer) {
        return dbOperation(STORES.customers, 'readwrite', (store) => store.put(customer));
    },

    async deleteCustomer(id) {
        return dbOperation(STORES.customers, 'readwrite', (store) => store.delete(id));
    },

    // Bill operations
    async addBill(bill) {
        return dbOperation(STORES.bills, 'readwrite', (store) => store.add(bill));
    },

    async getBill(id) {
        return dbOperation(STORES.bills, 'readonly', (store) => store.get(id));
    },

    async getAllBills() {
        return dbOperation(STORES.bills, 'readonly', (store) => store.getAll());
    },

    async updateBill(bill) {
        return dbOperation(STORES.bills, 'readwrite', (store) => store.put(bill));
    },

    async deleteBill(id) {
        return dbOperation(STORES.bills, 'readwrite', (store) => store.delete(id));
    },

    // Finance operations
    async addFinanceEntry(entry) {
        return dbOperation(STORES.finances, 'readwrite', (store) => store.add(entry));
    },

    async getFinanceEntry(id) {
        return dbOperation(STORES.finances, 'readonly', (store) => store.get(id));
    },

    async getAllFinances() {
        return dbOperation(STORES.finances, 'readonly', (store) => store.getAll());
    },

    async updateFinanceEntry(entry) {
        return dbOperation(STORES.finances, 'readwrite', (store) => store.put(entry));
    },

    async deleteFinanceEntry(id) {
        return dbOperation(STORES.finances, 'readwrite', (store) => store.delete(id));
    },

    // Settings operations
    async saveSettings(settings) {
        return dbOperation(STORES.settings, 'readwrite', (store) => store.put({
            id: 'business-settings',
            ...settings
        }));
    },

    async getSettings() {
        return dbOperation(STORES.settings, 'readonly', (store) => store.get('business-settings'));
    }
};

// Export the database interface
window.db = db; 