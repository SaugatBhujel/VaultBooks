function initializeApp() {
    try {
        // Initialize data
        initializeData();
        
        // Check if inventory table exists
        const inventoryTable = document.getElementById('inventoryTable');
        if (!inventoryTable) {
            console.error('Inventory table not found in DOM');
        }
        
        // Load initial data
        loadInventory();
        loadCustomers();
        loadBills();
        updateDashboardStats();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

function handleChartPeriodChange(period) {
    // Update charts based on selected period
    // Add your chart update logic here
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        checkAuth();
        updateUserUI();
        initializeApp();
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
    }
}); 