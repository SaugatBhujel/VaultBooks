// Sample data structure
const defaultData = {
    inventory: [],
    customers: [],
    bills: [],
    transactions: [],
    finances: []
};

// Initialize data in localStorage if not exists
function initializeData() {
    try {
        console.log('Initializing data...');
        const existingData = localStorage.getItem('vaultData');
        
        if (!existingData) {
            console.log('No existing data found, creating new data');
            localStorage.setItem('vaultData', JSON.stringify(defaultData));
            return defaultData;
        }

        const parsedData = JSON.parse(existingData);
        
        // Ensure finances array exists
        if (!Array.isArray(parsedData.finances)) {
            parsedData.finances = [];
            localStorage.setItem('vaultData', JSON.stringify(parsedData));
        }

        return parsedData;
    } catch (error) {
        console.error('Error initializing data:', error);
        return defaultData;
    }
}

// Get data from localStorage
function getData() {
    try {
        const data = localStorage.getItem('vaultData');
        if (!data) {
            return initializeData();
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting data:', error);
        return defaultData;
    }
}

// Save data to localStorage
function saveData(data) {
    try {
        console.log('Saving data:', data);
        localStorage.setItem('vaultData', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Clear all data (useful for testing)
function clearData() {
    try {
        localStorage.removeItem('vaultData');
        initializeData();
        console.log('Data cleared successfully');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

// Add this function to reset the data
function resetData() {
    try {
        console.log('Resetting data...');
        localStorage.clear();
        initializeData();
        console.log('Data reset complete');
        window.location.reload();
    } catch (error) {
        console.error('Error resetting data:', error);
    }
}

// Initialize data when the file loads
initializeData(); 