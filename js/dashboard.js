// Dashboard module
window.dashboard = {
    initDashboard: function() {
        this.updateDashboardStats('month');
    },

    updateDashboardStats: function(period = 'month') {
        const data = this.getData();
        const stats = this.calculateStats(data, period);
        
        // Update main stats
        document.getElementById('totalRevenue').textContent = `$${stats.revenue.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = stats.orders;
        document.getElementById('totalCustomers').textContent = stats.customers;
        document.getElementById('totalProfit').textContent = `$${stats.profit.toFixed(2)}`;

        // Update growth indicators
        document.getElementById('revenueGrowth').textContent = `${stats.revenueGrowth}% from last ${period}`;
        document.getElementById('ordersGrowth').textContent = `${stats.ordersGrowth}% from last ${period}`;
        document.getElementById('customersGrowth').textContent = `+${stats.newCustomers} this ${period}`;
        document.getElementById('profitGrowth').textContent = `${stats.profitGrowth}% from last ${period}`;

        // Update top products
        this.updateTopProducts(data);
        
        // Update recent transactions
        this.updateRecentTransactions(data);
        
        // Update charts
        this.updateDashboardCharts(data, period);
    },

    calculateStats: function(data, period) {
        const now = new Date();
        const periodStart = this.getPeriodStart(now, period);
        const lastPeriodStart = this.getPeriodStart(periodStart, period);

        // Filter data for current and last period
        const currentPeriodBills = data.bills.filter(bill => new Date(bill.date) >= periodStart);
        const lastPeriodBills = data.bills.filter(bill => 
            new Date(bill.date) >= lastPeriodStart && new Date(bill.date) < periodStart
        );

        // Calculate current period stats
        const currentStats = {
            revenue: currentPeriodBills.reduce((sum, bill) => sum + bill.total, 0),
            orders: currentPeriodBills.length,
            profit: currentPeriodBills.reduce((sum, bill) => sum + (bill.total * 0.2), 0) // Assuming 20% profit margin
        };

        // Calculate last period stats
        const lastStats = {
            revenue: lastPeriodBills.reduce((sum, bill) => sum + bill.total, 0),
            orders: lastPeriodBills.length,
            profit: lastPeriodBills.reduce((sum, bill) => sum + (bill.total * 0.2), 0)
        };

        return {
            revenue: currentStats.revenue,
            orders: currentStats.orders,
            customers: data.customers.length,
            profit: currentStats.profit,
            revenueGrowth: this.calculateGrowth(currentStats.revenue, lastStats.revenue),
            ordersGrowth: this.calculateGrowth(currentStats.orders, lastStats.orders),
            profitGrowth: this.calculateGrowth(currentStats.profit, lastStats.profit),
            newCustomers: data.customers.filter(c => new Date(c.joinDate) >= periodStart).length
        };
    },

    updateTopProducts: function(data) {
        const productSales = {};
        
        // Calculate total sales for each product
        data.bills.forEach(bill => {
            bill.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.price * item.quantity;
            });
        });

        // Sort products by revenue
        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Update table
        const tableBody = document.getElementById('topProductsTable');
        tableBody.innerHTML = sortedProducts.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>$${product.revenue.toFixed(2)}</td>
            </tr>
        `).join('');
    },

    updateRecentTransactions: function(data) {
        const recentBills = data.bills
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const tableBody = document.getElementById('recentTransactionsTable');
        tableBody.innerHTML = recentBills.map(bill => `
            <tr>
                <td>${new Date(bill.date).toLocaleDateString()}</td>
                <td>${bill.customerName}</td>
                <td>$${bill.total.toFixed(2)}</td>
                <td><span class="badge bg-${bill.status === 'paid' ? 'success' : 'warning'}">${bill.status}</span></td>
            </tr>
        `).join('');
    },

    getPeriodStart: function(date, period) {
        const result = new Date(date);
        switch(period) {
            case 'week':
                result.setDate(result.getDate() - 7);
                break;
            case 'month':
                result.setMonth(result.getMonth() - 1);
                break;
            case 'year':
                result.setFullYear(result.getFullYear() - 1);
                break;
        }
        return result;
    },

    calculateGrowth: function(current, previous) {
        if (previous === 0) return current === 0 ? 0 : 100;
        return ((current - previous) / previous * 100).toFixed(1);
    },

    getData: function() {
        // For now, return mock data
        return {
            bills: [
                {
                    id: 1,
                    date: '2025-01-16',
                    customerName: 'John Doe',
                    total: 299.99,
                    status: 'paid',
                    items: [
                        { productId: 1, name: 'Product A', quantity: 2, price: 149.99 }
                    ]
                },
                {
                    id: 2,
                    date: '2025-01-15',
                    customerName: 'Jane Smith',
                    total: 199.99,
                    status: 'pending',
                    items: [
                        { productId: 2, name: 'Product B', quantity: 1, price: 199.99 }
                    ]
                }
            ],
            customers: [
                { id: 1, name: 'John Doe', joinDate: '2024-12-01' },
                { id: 2, name: 'Jane Smith', joinDate: '2025-01-15' }
            ]
        };
    },

    updateDashboardCharts: function(data, period) {
        // Update charts logic here
    }
};

// Remove the DOMContentLoaded listener since we now initialize through index.html