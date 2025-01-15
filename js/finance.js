// Finance functions
let isEditing = false;

function addFinanceEntry(event) {
    // Prevent form submission
    event.preventDefault();
    
    try {
        // Get form values
        const form = document.getElementById('addFinanceForm');
        const formData = {
            type: form.querySelector('#financeType').value,
            category: form.querySelector('#financeCategory').value,
            date: form.querySelector('#financeDate').value,
            amount: parseFloat(form.querySelector('#financeAmount').value),
            description: form.querySelector('#financeDescription').value || '',
            id: isEditing ? form.querySelector('#financeId').value : 'FIN-' + Date.now()
        };

        // Basic validation
        if (!formData.type || !formData.category || !formData.date || !formData.amount) {
            alert('Please fill in all required fields');
            return false;
        }

        // Get existing data
        const data = getData();
        if (!Array.isArray(data.finances)) {
            data.finances = [];
        }

        // Add or update entry
        if (isEditing) {
            const index = data.finances.findIndex(f => f.id === formData.id);
            if (index !== -1) {
                data.finances[index] = formData;
            }
        } else {
            data.finances.push(formData);
        }

        // Save to localStorage
        saveData(data);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addRevenueModal'));
        modal.hide();

        // Reset form
        form.reset();
        isEditing = false;

        // Refresh display
        loadFinances();
        updateFinanceStats();

        return false;
    } catch (error) {
        console.error('Error saving finance entry:', error);
        alert('Error saving entry. Please try again.');
        return false;
    }
}

function loadFinances() {
    try {
        const data = getData();
        const finances = data.finances || [];
        const table = document.getElementById('financeTable');
        
        if (!table) return;

        if (finances.length === 0) {
            table.innerHTML = '<tr><td colspan="6" class="text-center">No entries found</td></tr>';
            return;
        }

        table.innerHTML = finances.map(finance => `
            <tr>
                <td>${new Date(finance.date).toLocaleDateString()}</td>
                <td>
                    <span class="badge bg-${finance.type === 'revenue' ? 'success' : 'danger'}">
                        ${finance.type}
                    </span>
                </td>
                <td>${finance.category}</td>
                <td>${finance.description || '-'}</td>
                <td>$${finance.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editFinance('${finance.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFinance('${finance.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        updateFinanceStats();
    } catch (error) {
        console.error('Error loading finances:', error);
    }
}

function updateFinanceStats() {
    try {
        const data = getData();
        const finances = data.finances || [];
        
        const revenue = finances
            .filter(f => f.type === 'revenue')
            .reduce((sum, f) => sum + f.amount, 0);
            
        const expenses = finances
            .filter(f => f.type === 'expense')
            .reduce((sum, f) => sum + f.amount, 0);
            
        const profit = revenue - expenses;
        const margin = revenue ? (profit / revenue) * 100 : 0;

        document.getElementById('financeRevenue').textContent = `$${revenue.toFixed(2)}`;
        document.getElementById('financeExpenses').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('financeProfit').textContent = `$${profit.toFixed(2)}`;
        document.getElementById('profitMargin').textContent = `${margin.toFixed(1)}%`;
    } catch (error) {
        console.error('Error updating finance stats:', error);
    }
}

function editFinance(id) {
    try {
        const data = getData();
        const finance = data.finances.find(f => f.id === id);
        
        if (!finance) {
            throw new Error('Finance entry not found');
        }

        // Set form values
        const form = document.getElementById('addFinanceForm');
        form.querySelector('#financeId').value = finance.id;
        form.querySelector('#financeType').value = finance.type;
        form.querySelector('#financeCategory').value = finance.category;
        form.querySelector('#financeDate').value = finance.date;
        form.querySelector('#financeAmount').value = finance.amount;
        form.querySelector('#financeDescription').value = finance.description || '';

        // Set edit mode
        isEditing = true;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addRevenueModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing finance:', error);
        alert('Failed to load finance entry for editing');
    }
}

function deleteFinance(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            const data = getData();
            data.finances = data.finances.filter(f => f.id !== id);
            saveData(data);
            loadFinances();
            updateFinanceStats();
        } catch (error) {
            console.error('Error deleting finance:', error);
            alert('Failed to delete finance entry');
        }
    }
}

function resetFinanceForm() {
    isEditing = false;
    const form = document.getElementById('addFinanceForm');
    if (form) {
        form.reset();
        form.querySelector('#financeId').value = '';
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        form.querySelector('#financeDate').value = today;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('financeDate');
        if (dateInput) {
            dateInput.value = today;
        }

        // Add modal event handlers
        const modal = document.getElementById('addRevenueModal');
        if (modal) {
            modal.addEventListener('hidden.bs.modal', resetFinanceForm);
            modal.addEventListener('show.bs.modal', () => {
                if (!isEditing) {
                    resetFinanceForm();
                }
            });
        }

        // Add filter handlers
        const monthSelect = document.getElementById('financeMonth');
        if (monthSelect) {
            monthSelect.addEventListener('change', loadFinances);
        }

        const typeSelect = document.getElementById('transactionType');
        if (typeSelect) {
            typeSelect.addEventListener('change', loadFinances);
        }

        // Load initial data
        loadFinances();
        updateFinanceStats();
    } catch (error) {
        console.error('Error initializing finance module:', error);
    }
});

// Add this debug function to help troubleshoot
function debugFinance() {
    try {
        console.log('Current finance data:', getData().finances);
        console.log('Form elements:');
        const form = document.getElementById('addFinanceForm');
        if (form) {
            console.log('Form found');
            console.log('Type:', form.querySelector('#financeType')?.value);
            console.log('Category:', form.querySelector('#financeCategory')?.value);
            console.log('Date:', form.querySelector('#financeDate')?.value);
            console.log('Amount:', form.querySelector('#financeAmount')?.value);
            console.log('Description:', form.querySelector('#financeDescription')?.value);
        } else {
            console.log('Form not found');
        }
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Add this new function
function saveFinanceEntry() {
    try {
        console.log('Starting saveFinanceEntry...');
        
        // Get form values
        const type = document.getElementById('financeType').value;
        const category = document.getElementById('financeCategory').value;
        const date = document.getElementById('financeDate').value;
        const amount = parseFloat(document.getElementById('financeAmount').value);
        const description = document.getElementById('financeDescription').value;
        const id = document.getElementById('financeId').value || 'FIN-' + Date.now();

        console.log('Form values:', { type, category, date, amount, description, id });

        // Validate inputs
        if (!type || !category || !date || !amount || amount <= 0) {
            alert('Please fill in all required fields with valid values');
            return;
        }

        // Create finance data
        const financeData = {
            id,
            type,
            category,
            date,
            amount,
            description,
            createdAt: new Date().toISOString()
        };

        // Get current data
        let data = getData();
        console.log('Current data:', data);

        // Initialize finances array if it doesn't exist
        if (!Array.isArray(data.finances)) {
            data.finances = [];
        }

        // Add or update entry
        if (isEditing) {
            const index = data.finances.findIndex(f => f.id === id);
            if (index !== -1) {
                data.finances[index] = financeData;
            }
        } else {
            data.finances.push(financeData);
        }

        // Save to localStorage
        const saved = saveData(data);
        if (!saved) {
            throw new Error('Failed to save data');
        }

        console.log('Finance entry saved:', financeData);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addRevenueModal'));
        if (modal) {
            modal.hide();
        }

        // Reset form
        resetFinanceForm();

        // Refresh display
        loadFinances();
        updateFinanceStats();

        // Show success message
        alert('Finance entry saved successfully!');

    } catch (error) {
        console.error('Error in saveFinanceEntry:', error);
        alert('Failed to save finance entry. Please try again.');
    }
} 