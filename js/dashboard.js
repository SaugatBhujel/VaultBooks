// Dashboard Analytics Functions
function updateDashboardStats(period = 'month') {
    const data = getData();
    const stats = calculateStats(data, period);
    
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
    updateTopProducts(data);
    
    // Update recent transactions
    updateRecentTransactions(data);
    
    // Update charts
    updateDashboardCharts(data, period);
}

function calculateStats(data, period) {
    const now = new Date();
    const periodStart = getPeriodStart(now, period);
    const lastPeriodStart = getPeriodStart(periodStart, period);

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

    // Calculate growth
    return {
        ...currentStats,
        customers: data.customers.length,
        newCustomers: data.customers.filter(c => new Date(c.joinDate) >= periodStart).length,
        revenueGrowth: calculateGrowth(currentStats.revenue, lastStats.revenue),
        ordersGrowth: calculateGrowth(currentStats.orders, lastStats.orders),
        profitGrowth: calculateGrowth(currentStats.profit, lastStats.profit)
    };
}

function updateTopProducts(data) {
    const productSales = {};
    
    // Calculate sales for each product
    data.bills.forEach(bill => {
        bill.items.forEach(item => {
            if (!productSales[item.itemId]) {
                productSales[item.itemId] = {
                    name: item.name,
                    units: 0,
                    revenue: 0
                };
            }
            productSales[item.itemId].units += item.quantity;
            productSales[item.itemId].revenue += item.price * item.quantity;
        });
    });

    // Sort and display top products
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    document.getElementById('topProductsTable').innerHTML = topProducts.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.units}</td>
            <td>$${product.revenue.toFixed(2)}</td>
        </tr>
    `).join('');
}

function updateRecentTransactions(data) {
    const recentBills = data.bills
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    document.getElementById('recentTransactionsTable').innerHTML = recentBills.map(bill => `
        <tr>
            <td>${new Date(bill.date).toLocaleDateString()}</td>
            <td>${getCustomerName(bill.customerId)}</td>
            <td>$${bill.total.toFixed(2)}</td>
            <td><span class="badge bg-${getStatusColor(bill.status)}">${bill.status}</span></td>
        </tr>
    `).join('');
}

// Helper functions
function getPeriodStart(date, period) {
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
}

function calculateGrowth(current, previous) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - previous) / previous) * 100);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats('month');
}); 