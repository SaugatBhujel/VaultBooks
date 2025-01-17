// Database configuration
const DB_NAME = 'vaultbooks';
const DB_VERSION = 2;

// Global database instance
let db = null;
let isInitializing = false;
let initPromise = null;

// Store active sessions
const activeSessions = new Map();

// Data storage functions
function getData() {
    try {
        const data = localStorage.getItem('vaultbooks_data');
        return data ? JSON.parse(data) : { users: [], finances: [] };
    } catch (error) {
        console.error('Error reading data:', error);
        return { users: [], finances: [] };
    }
}

function saveData(data) {
    try {
        localStorage.setItem('vaultbooks_data', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Initialize database
async function initDB() {
    // If already initialized, return the instance
    if (db) {
        console.log('Database already initialized');
        return Promise.resolve(db);
    }

    // If initialization is in progress, return the existing promise
    if (initPromise) {
        console.log('Database initialization already in progress');
        return initPromise;
    }

    console.log('Starting database initialization...');
    isInitializing = true;

    initPromise = new Promise((resolve, reject) => {
        try {
            // First try to migrate data from localStorage if it exists
            const oldData = getData();
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                isInitializing = false;
                initPromise = null;
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log('Database opened successfully');
                db = event.target.result;
                isInitializing = false;

                // Migrate old data if needed
                if (oldData && oldData.finances && oldData.finances.length > 0) {
                    const transaction = db.transaction(['finances'], 'readwrite');
                    const store = transaction.objectStore('finances');
                    oldData.finances.forEach(entry => {
                        store.add(entry);
                    });
                }

                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Creating/upgrading database...');
                const database = event.target.result;
                
                // Create users store if it doesn't exist
                if (!database.objectStoreNames.contains('users')) {
                    console.log('Creating users store');
                    database.createObjectStore('users', { keyPath: 'username' });
                }

                // Create finances store if it doesn't exist
                if (!database.objectStoreNames.contains('finances')) {
                    console.log('Creating finances store');
                    const financeStore = database.createObjectStore('finances', { keyPath: 'id' });
                    financeStore.createIndex('date', 'date');
                    financeStore.createIndex('type', 'type');
                }
            };
        } catch (error) {
            console.error('Failed to initialize database:', error);
            isInitializing = false;
            initPromise = null;
            reject(error);
        }
    });

    return initPromise;
}

// Add user to database
async function addUser(user) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.add(user);
        
        request.onsuccess = () => {
            console.log('User added successfully:', user.username);
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// Get user from database
async function getUser(username) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(username);
        
        request.onsuccess = () => {
            console.log('User retrieved:', request.result);
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password, hash) {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
}

// Generate session token
async function generateSessionToken(username) {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2);
    const data = username + timestamp + randomString;
    return await hashPassword(data);
}

// Verify session token
async function verifySessionToken(token) {
    return activeSessions.has(token);
}

// Invalidate session
async function invalidateSession(token) {
    return activeSessions.delete(token);
}

// Finance-related functions
async function addFinanceEntry(entry) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['finances'], 'readwrite');
            const store = transaction.objectStore('finances');
            const request = store.add(entry);
            
            request.onsuccess = () => {
                console.log('Finance entry added successfully:', entry.id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to add finance entry:', request.error);
                reject(request.error);
            };
            
            transaction.oncomplete = () => {
                console.log('Transaction completed');
            };
            
            transaction.onerror = () => {
                console.error('Transaction failed:', transaction.error);
                reject(transaction.error);
            };
        } catch (error) {
            console.error('Error in addFinanceEntry:', error);
            reject(error);
        }
    });
}

async function updateFinanceEntry(entry) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['finances'], 'readwrite');
            const store = transaction.objectStore('finances');
            const request = store.put(entry);
            
            request.onsuccess = () => {
                console.log('Finance entry updated successfully:', entry.id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to update finance entry:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in updateFinanceEntry:', error);
            reject(error);
        }
    });
}

async function deleteFinanceEntry(id) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['finances'], 'readwrite');
            const store = transaction.objectStore('finances');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Finance entry deleted successfully:', id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to delete finance entry:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in deleteFinanceEntry:', error);
            reject(error);
        }
    });
}

async function getAllFinanceEntries() {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['finances'], 'readonly');
            const store = transaction.objectStore('finances');
            const request = store.getAll();
            
            request.onsuccess = () => {
                console.log('Retrieved all finance entries:', request.result?.length || 0, 'entries');
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Failed to get finance entries:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in getAllFinanceEntries:', error);
            reject(error);
        }
    });
}

// Create the database interface object
const dbInterface = {
    init: initDB,
    addUser,
    getUser,
    hashPassword,
    verifyPassword,
    generateSessionToken,
    verifySessionToken,
    invalidateSession,
    // Add finance functions
    addFinanceEntry,
    updateFinanceEntry,
    deleteFinanceEntry,
    getAllFinanceEntries,
    // Add data functions
    getData,
    saveData
};

// Export the interface
window.db = dbInterface;

// Initialize database when the script loads
initDB().catch(error => {
    console.error('Failed to initialize database:', error);
    // Fallback to localStorage if IndexedDB fails
    console.log('Falling back to localStorage...');
});