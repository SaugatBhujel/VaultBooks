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
        console.log('Opening database:', DB_NAME);
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(new Error('Failed to open database. Please make sure your browser supports IndexedDB and you have not disabled it.'));
        };

        request.onsuccess = (event) => {
            console.log('Database opened successfully');
            const db = event.target.result;
            
            db.onerror = (event) => {
                console.error('Database error:', event.target.error);
            };
            
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log('Upgrading database...');
            const db = event.target.result;

            // Create object stores if they don't exist
            Object.entries(STORES).forEach(([name, storeName]) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    console.log('Creating store:', storeName);
                    db.createObjectStore(storeName, { keyPath: name === 'users' ? 'username' : 'id' });
                }
            });
        };

        request.onblocked = () => {
            console.error('Database upgrade blocked. Please close other tabs with this site open.');
            reject(new Error('Database upgrade blocked. Please close other tabs with this site open.'));
        };
    });
}

// Generic database operations
async function dbOperation(storeName, mode, operation) {
    console.log(`Starting ${mode} operation on ${storeName}`);
    let db;
    try {
        db = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);

            transaction.onerror = (event) => {
                console.error(`Transaction error on ${storeName}:`, event.target.error);
                reject(new Error(`Failed to perform operation on ${storeName}`));
            };

            transaction.oncomplete = () => {
                console.log(`Transaction completed on ${storeName}`);
            };

            const request = operation(store);

            request.onsuccess = () => {
                console.log(`Operation successful on ${storeName}`);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error(`Operation error on ${storeName}:`, event.target.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error(`Database operation failed on ${storeName}:`, error);
        throw error;
    } finally {
        if (db) {
            db.close();
            console.log('Database connection closed');
        }
    }
}

// Database operations
const db = {
    // User operations
    async addUser(userData) {
        console.log('Adding user:', userData.username);
        if (!userData || !userData.username) {
            throw new Error('Invalid user data');
        }
        return dbOperation(STORES.users, 'readwrite', (store) => store.add(userData));
    },

    async getUser(username) {
        console.log('Getting user:', username);
        if (!username) {
            throw new Error('Username is required');
        }
        return dbOperation(STORES.users, 'readonly', (store) => store.get(username));
    },

    async updateUser(userData) {
        console.log('Updating user:', userData.username);
        if (!userData || !userData.username) {
            throw new Error('Invalid user data');
        }
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

// Test database connection
async function testDB() {
    try {
        console.log('Testing database connection...');
        await initDB();
        console.log('Database connection test successful');
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// Export the database interface and test function
window.db = db;
window.testDB = testDB;

// Initialize database when the script loads
testDB().catch(console.error); 