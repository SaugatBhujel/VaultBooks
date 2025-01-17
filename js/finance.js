// Finance module
window.finance = {
    isEditing: false,
    isInitialized: false,

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger alert-dismissible fade show';
        errorElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to modal body
        const modalBody = document.querySelector('#addRevenueModal .modal-body');
        modalBody.insertBefore(errorElement, modalBody.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => errorElement.remove(), 5000);
    },

    showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'alert alert-success alert-dismissible fade show';
        successElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(successElement, mainContent.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => successElement.remove(), 5000);
    },

    async ensureInitialized() {
        if (!window.db) {
            throw new Error('Database not available');
        }
        
        if (!this.isInitialized) {
            console.log('Initializing database...');
            await window.db.init();
            this.isInitialized = true;
            console.log('Database initialized');
        }
    },

    async initFinance() {
        try {
            console.log('Initializing finance module...');
            await this.ensureInitialized();
            
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('financeDate').value = today;
            
            // Load existing finances
            await this.loadFinances();
            
            // Initialize stats
            await this.updateFinanceStats();
            
            console.log('Finance module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize finance:', error);
            this.showError('Failed to initialize finance section: ' + error.message);
        }
    },

    async addFinanceEntry(event) {
        event.preventDefault();
        console.log('Form submission started');
        
        try {
            // Get form values
            const form = event.target;
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            const formData = {
                type: form.querySelector('#financeType').value,
                category: form.querySelector('#financeCategory').value,
                date: form.querySelector('#financeDate').value,
                amount: parseFloat(form.querySelector('#financeAmount').value),
                description: form.querySelector('#financeDescription').value || '',
                id: this.isEditing ? form.querySelector('#financeId').value : 'FIN-' + Date.now()
            };

            console.log('Form data:', formData);

            // Basic validation
            if (!formData.type || !formData.category || !formData.date || isNaN(formData.amount)) {
                throw new Error('Please fill in all required fields correctly');
            }

            // Try to save to IndexedDB first, fallback to localStorage
            try {
                if (this.isEditing) {
                    await window.db.updateFinanceEntry(formData);
                } else {
                    await window.db.addFinanceEntry(formData);
                }
            } catch (dbError) {
                console.warn('IndexedDB save failed, falling back to localStorage:', dbError);
                // Fallback to localStorage
                const data = window.db.getData();
                if (this.isEditing) {
                    const index = data.finances.findIndex(f => f.id === formData.id);
                    if (index !== -1) {
                        data.finances[index] = formData;
                    }
                } else {
                    data.finances.push(formData);
                }
                window.db.saveData(data);
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addRevenueModal'));
            modal.hide();

            // Reset form
            form.reset();
            this.isEditing = false;

            // Set today's date
            const today = new Date().toISOString().split('T')[0];
            form.querySelector('#financeDate').value = today;

            // Reload finances
            await this.loadFinances();
            await this.updateFinanceStats();

            // Show success message
            this.showSuccess('Finance entry saved successfully!');
        } catch (error) {
            console.error('Failed to add finance entry:', error);
            this.showError(error.message || 'Failed to save finance entry. Please try again.');
        } finally {
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = false;
        }
    },

    async loadFinances() {
        try {
            let finances = [];
            
            // Try IndexedDB first
            try {
                finances = await window.db.getAllFinanceEntries();
            } catch (dbError) {
                console.warn('IndexedDB load failed, falling back to localStorage:', dbError);
                // Fallback to localStorage
                const data = window.db.getData();
                finances = data.finances || [];
            }
            
            // Sort by date descending
            finances.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const tableBody = document.getElementById('financeTableBody');
            tableBody.innerHTML = '';
            
            finances.forEach(finance => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${finance.date}</td>
                    <td>${finance.type}</td>
                    <td>${finance.category}</td>
                    <td>${formatCurrency(finance.amount)}</td>
                    <td>${finance.description}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.finance.editFinance('${finance.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.finance.deleteFinance('${finance.id}')">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load finances:', error);
            this.showError('Failed to load finances: ' + error.message);
        }
    },

    async updateFinanceStats() {
        try {
            const finances = await window.db.getAllFinanceEntries();
            
            // Calculate totals
            const totalRevenue = finances
                .filter(f => f.type === 'Revenue')
                .reduce((sum, f) => sum + f.amount, 0);
                
            const totalExpenses = finances
                .filter(f => f.type === 'Expense')
                .reduce((sum, f) => sum + f.amount, 0);
                
            const netIncome = totalRevenue - totalExpenses;
            
            // Update UI
            document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
            document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
            document.getElementById('netIncome').textContent = formatCurrency(netIncome);
            
            // Update chart if it exists
            if (window.charts && window.charts.updateFinanceChart) {
                window.charts.updateFinanceChart(finances);
            }
        } catch (error) {
            console.error('Failed to update finance stats:', error);
            notificationSystem.notify('Failed to update finance statistics', 'error');
        }
    },

    async editFinance(id) {
        try {
            const finances = await window.db.getAllFinanceEntries();
            const finance = finances.find(f => f.id === id);
            
            if (finance) {
                this.isEditing = true;
                
                // Populate form
                const form = document.getElementById('addFinanceForm');
                form.querySelector('#financeId').value = finance.id;
                form.querySelector('#financeType').value = finance.type;
                form.querySelector('#financeCategory').value = finance.category;
                form.querySelector('#financeDate').value = finance.date;
                form.querySelector('#financeAmount').value = finance.amount;
                form.querySelector('#financeDescription').value = finance.description;
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('addRevenueModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Failed to edit finance:', error);
            notificationSystem.notify('Failed to load finance entry for editing', 'error');
        }
    },

    async deleteFinance(id) {
        try {
            if (confirm('Are you sure you want to delete this finance entry?')) {
                await window.db.deleteFinanceEntry(id);
                await this.loadFinances();
                await this.updateFinanceStats();
                notificationSystem.notify('Finance entry deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to delete finance:', error);
            notificationSystem.notify('Failed to delete finance entry', 'error');
        }
    },

    resetFinanceForm() {
        try {
            const form = document.getElementById('addFinanceForm');
            form.reset();
            this.isEditing = false;
            
            // Set today's date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('financeDate').value = today;
        } catch (error) {
            console.error('Failed to reset finance form:', error);
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.finance.initFinance();
    } catch (error) {
        console.error('Error initializing finance module:', error);
    }
});