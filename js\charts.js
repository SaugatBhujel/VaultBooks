// Chart Configuration
const chartConfig = {
    revenue: {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Revenue Over Time'
                }
            }
        }
    },
    orders: {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Orders by Period'
                }
            }
        }
    },
    customers: {
        type: 'doughnut',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Customer Distribution'
                }
            }
        }
    }
};

// Chart instances
let revenueChart = null;
let ordersChart = null;
let customersChart = null;

// Initialize charts
function initializeCharts() {
    try {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx && !revenueChart) {
            revenueChart = new Chart(revenueCtx, {
                type: chartConfig.revenue.type,
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Revenue',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: chartConfig.revenue.options
            });
        }

        // Orders Chart
        const ordersCtx = document.getElementById('ordersChart')?.getContext('2d');
        if (ordersCtx && !ordersChart) {
            ordersChart = new Chart(ordersCtx, {
                type: chartConfig.orders.type,
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders',
                        data: [],
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: chartConfig.orders.options
            });
        }

        // Customers Chart
        const customersCtx = document.getElementById('customersChart')?.getContext('2d');
        if (customersCtx && !customersChart) {
            customersChart = new Chart(customersCtx, {
                type: chartConfig.customers.type,
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Customers',
                        data: [],
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(255, 205, 86)'
                        ]
                    }]
                },
                options: chartConfig.customers.options
            });
        }
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Update all charts
function updateCharts() {
    try {
        updateRevenueChart();
        updateOrdersChart();
        updateCustomersChart();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update revenue chart
function updateRevenueChart() {
    if (!revenueChart) return;
    
    const { labels, data } = getRevenueData();
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = data;
    revenueChart.update();
}

// Update orders chart
function updateOrdersChart() {
    if (!ordersChart) return;
    
    const { labels, data } = getOrdersData();
    ordersChart.data.labels = labels;
    ordersChart.data.datasets[0].data = data;
    ordersChart.update();
}

// Update customers chart
function updateCustomersChart() {
    if (!customersChart) return;
    
    const { labels, data } = getCustomersData();
    customersChart.data.labels = labels;
    customersChart.data.datasets[0].data = data;
    customersChart.update();
}

// Get revenue data
function getRevenueData() {
    const monthlyRevenue = {};
    
    // Group bills by month
    bills.forEach(bill => {
        const date = new Date(bill.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (bill.total || 0);
    });
    
    // Sort by date
    const sortedMonths = Object.keys(monthlyRevenue).sort();
    
    return {
        labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        data: sortedMonths.map(month => monthlyRevenue[month])
    };
}

// Get orders data
function getOrdersData() {
    const dailyOrders = {};
    
    // Get last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyOrders[dateKey] = 0;
    }
    
    // Count orders per day
    bills.forEach(bill => {
        const dateKey = new Date(bill.date).toISOString().split('T')[0];
        if (dailyOrders[dateKey] !== undefined) {
            dailyOrders[dateKey]++;
        }
    });
    
    return {
        labels: Object.keys(dailyOrders).map(date => 
            new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        ),
        data: Object.values(dailyOrders)
    };
}

// Get customers data
function getCustomersData() {
    // Count customers by type (example: regular, premium, new)
    const customerTypes = {
        'Regular': customers.filter(c => bills.filter(b => b.customerName === c.name).length >= 5).length,
        'New': customers.filter(c => bills.filter(b => b.customerName === c.name).length < 5).length,
        'Premium': customers.filter(c => {
            const customerBills = bills.filter(b => b.customerName === c.name);
            const totalSpent = customerBills.reduce((sum, b) => sum + (b.total || 0), 0);
            return totalSpent > 1000;
        }).length
    };
    
    return {
        labels: Object.keys(customerTypes),
        data: Object.values(customerTypes)
    };
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharts);

// Export chart functions
window.chartSystem = {
    initializeCharts,
    updateCharts
};
