// AI Assistant for VaultBooks
class VaultBooksAI {
    constructor() {
        this.context = {
            recentActions: [],
            userPreferences: {},
            businessMetrics: {}
        };
        this.maxContextLength = 50;
    }

    // Initialize AI with user data
    async initialize() {
        this.loadUserPreferences();
        this.loadBusinessMetrics();
        this.setupEventListeners();
    }

    // Load user preferences
    loadUserPreferences() {
        this.context.userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
            currency: currencyManager.currentCurrency,
            theme: localStorage.getItem('theme') || 'light',
            language: 'en',
            notifications: true
        };
    }

    // Load business metrics
    loadBusinessMetrics() {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const bills = JSON.parse(localStorage.getItem('bills')) || [];

        this.context.businessMetrics = {
            totalRevenue: this.calculateTotalRevenue(transactions),
            averageOrderValue: this.calculateAverageOrderValue(bills),
            topProducts: this.findTopProducts(transactions),
            customerSegments: this.analyzeCustomerSegments(customers),
            inventoryHealth: this.analyzeInventoryHealth(inventory)
        };
    }

    // Setup event listeners for user actions
    setupEventListeners() {
        document.addEventListener('userAction', (e) => {
            this.recordAction(e.detail);
            this.generateInsights();
        });
    }

    // Record user action
    recordAction(action) {
        this.context.recentActions.push({
            ...action,
            timestamp: new Date().toISOString()
        });

        if (this.context.recentActions.length > this.maxContextLength) {
            this.context.recentActions.shift();
        }
    }

    // Generate business insights
    generateInsights() {
        const insights = {
            trends: this.analyzeTrends(),
            recommendations: this.generateRecommendations(),
            alerts: this.generateAlerts()
        };

        this.displayInsights(insights);
    }

    // Analyze business trends
    analyzeTrends() {
        const trends = [];
        const metrics = this.context.businessMetrics;

        // Revenue trend
        if (metrics.totalRevenue > 0) {
            const revenueGrowth = this.calculateGrowthRate(metrics.totalRevenue);
            trends.push({
                type: 'revenue',
                label: 'Revenue Growth',
                value: revenueGrowth,
                insight: revenueGrowth > 0 ? 'Growing' : 'Declining',
                recommendations: this.getRevenueRecommendations(revenueGrowth)
            });
        }

        // Inventory trends
        if (metrics.inventoryHealth) {
            trends.push({
                type: 'inventory',
                label: 'Inventory Health',
                value: metrics.inventoryHealth.score,
                insight: this.getInventoryInsight(metrics.inventoryHealth),
                recommendations: this.getInventoryRecommendations(metrics.inventoryHealth)
            });
        }

        // Customer trends
        if (metrics.customerSegments) {
            trends.push({
                type: 'customers',
                label: 'Customer Segments',
                value: metrics.customerSegments.totalCustomers,
                insight: this.getCustomerInsight(metrics.customerSegments),
                recommendations: this.getCustomerRecommendations(metrics.customerSegments)
            });
        }

        return trends;
    }

    // Generate smart recommendations
    generateRecommendations() {
        const recommendations = [];
        const metrics = this.context.businessMetrics;

        // Inventory recommendations
        if (metrics.inventoryHealth) {
            const lowStock = metrics.inventoryHealth.lowStock || [];
            if (lowStock.length > 0) {
                recommendations.push({
                    type: 'inventory',
                    priority: 'high',
                    message: `Restock ${lowStock.length} items that are running low`,
                    items: lowStock
                });
            }
        }

        // Customer recommendations
        if (metrics.customerSegments) {
            const inactiveCustomers = metrics.customerSegments.inactive || [];
            if (inactiveCustomers.length > 0) {
                recommendations.push({
                    type: 'customers',
                    priority: 'medium',
                    message: 'Consider reaching out to inactive customers',
                    count: inactiveCustomers.length
                });
            }
        }

        // Price optimization recommendations
        if (metrics.topProducts) {
            const optimizationOpportunities = this.findPriceOptimizationOpportunities();
            if (optimizationOpportunities.length > 0) {
                recommendations.push({
                    type: 'pricing',
                    priority: 'medium',
                    message: 'Price optimization opportunities identified',
                    items: optimizationOpportunities
                });
            }
        }

        return recommendations;
    }

    // Generate smart alerts
    generateAlerts() {
        const alerts = [];
        const metrics = this.context.businessMetrics;

        // Critical inventory alerts
        if (metrics.inventoryHealth) {
            const criticalStock = metrics.inventoryHealth.criticalStock || [];
            criticalStock.forEach(item => {
                alerts.push({
                    type: 'inventory',
                    priority: 'high',
                    message: `Critical stock level: ${item.name}`,
                    details: `Only ${item.quantity} units remaining`
                });
            });
        }

        // Unusual transaction alerts
        const unusualTransactions = this.detectUnusualTransactions();
        unusualTransactions.forEach(transaction => {
            alerts.push({
                type: 'transaction',
                priority: 'medium',
                message: 'Unusual transaction detected',
                details: transaction.details
            });
        });

        // Cash flow alerts
        const cashFlowStatus = this.analyzeCashFlow();
        if (cashFlowStatus.alert) {
            alerts.push({
                type: 'cashflow',
                priority: cashFlowStatus.priority,
                message: cashFlowStatus.message,
                details: cashFlowStatus.details
            });
        }

        return alerts;
    }

    // Helper methods for calculations and analysis
    calculateTotalRevenue(transactions) {
        return transactions.reduce((total, t) => total + (t.amount || 0), 0);
    }

    calculateAverageOrderValue(bills) {
        if (bills.length === 0) return 0;
        const total = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
        return total / bills.length;
    }

    findTopProducts(transactions) {
        const productCounts = {};
        transactions.forEach(t => {
            if (t.products) {
                t.products.forEach(p => {
                    productCounts[p.id] = (productCounts[p.id] || 0) + 1;
                });
            }
        });
        return Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    }

    analyzeCustomerSegments(customers) {
        const segments = {
            new: [],
            active: [],
            inactive: [],
            vip: []
        };

        const now = new Date();
        customers.forEach(customer => {
            const lastPurchase = new Date(customer.lastPurchaseDate);
            const daysSinceLastPurchase = (now - lastPurchase) / (1000 * 60 * 60 * 24);

            if (daysSinceLastPurchase <= 30) {
                segments.active.push(customer);
            } else if (daysSinceLastPurchase > 90) {
                segments.inactive.push(customer);
            }

            if (customer.totalPurchases > 10000) {
                segments.vip.push(customer);
            }

            if (daysSinceLastPurchase <= 7) {
                segments.new.push(customer);
            }
        });

        return segments;
    }

    analyzeInventoryHealth(inventory) {
        const health = {
            score: 0,
            lowStock: [],
            criticalStock: [],
            excess: []
        };

        inventory.forEach(item => {
            if (item.quantity <= item.reorderPoint) {
                health.lowStock.push(item);
            }
            if (item.quantity <= item.reorderPoint * 0.5) {
                health.criticalStock.push(item);
            }
            if (item.quantity >= item.reorderPoint * 3) {
                health.excess.push(item);
            }
        });

        health.score = this.calculateInventoryHealthScore(health);
        return health;
    }

    calculateInventoryHealthScore(health) {
        const totalItems = health.lowStock.length + health.criticalStock.length + health.excess.length;
        if (totalItems === 0) return 100;
        return Math.max(0, 100 - (
            (health.lowStock.length * 10) +
            (health.criticalStock.length * 20) +
            (health.excess.length * 5)
        ));
    }

    findPriceOptimizationOpportunities() {
        const opportunities = [];
        const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

        inventory.forEach(item => {
            const itemTransactions = transactions.filter(t => 
                t.products && t.products.some(p => p.id === item.id)
            );

            if (itemTransactions.length > 0) {
                const avgSalesPerDay = this.calculateAverageSalesPerDay(itemTransactions, item.id);
                const turnoverRate = this.calculateTurnoverRate(item, avgSalesPerDay);

                if (turnoverRate < 0.5 && item.price > 0) {
                    opportunities.push({
                        id: item.id,
                        name: item.name,
                        currentPrice: item.price,
                        suggestedPrice: item.price * 0.9,
                        reason: 'Low turnover rate'
                    });
                }
            }
        });

        return opportunities;
    }

    calculateAverageSalesPerDay(transactions, itemId) {
        const dates = transactions
            .filter(t => t.products.some(p => p.id === itemId))
            .map(t => new Date(t.date));
        
        if (dates.length < 2) return 0;

        const daysDiff = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
        return transactions.length / (daysDiff || 1);
    }

    calculateTurnoverRate(item, avgSalesPerDay) {
        return (avgSalesPerDay * 30) / (item.quantity || 1);
    }

    detectUnusualTransactions() {
        const unusual = [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const avgValue = this.calculateAverageTransactionValue(transactions);
        const stdDev = this.calculateStandardDeviation(transactions, avgValue);

        transactions.forEach(transaction => {
            if (Math.abs(transaction.amount - avgValue) > stdDev * 2) {
                unusual.push({
                    ...transaction,
                    details: `Amount significantly ${transaction.amount > avgValue ? 'higher' : 'lower'} than average`
                });
            }
        });

        return unusual;
    }

    calculateAverageTransactionValue(transactions) {
        if (transactions.length === 0) return 0;
        return transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length;
    }

    calculateStandardDeviation(transactions, mean) {
        if (transactions.length === 0) return 0;
        const squareDiffs = transactions.map(t => Math.pow((t.amount || 0) - mean, 2));
        return Math.sqrt(squareDiffs.reduce((sum, diff) => sum + diff, 0) / transactions.length);
    }

    analyzeCashFlow() {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const bills = JSON.parse(localStorage.getItem('bills')) || [];
        
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const recentTransactions = transactions.filter(t => new Date(t.date) >= last30Days);
        const recentBills = bills.filter(b => new Date(b.date) >= last30Days);

        const income = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenses = recentBills.reduce((sum, b) => sum + (b.total || 0), 0);
        const cashFlow = income - expenses;

        return {
            alert: cashFlow < 0,
            priority: cashFlow < -5000 ? 'high' : 'medium',
            message: cashFlow < 0 ? 'Negative cash flow detected' : 'Positive cash flow',
            details: `Net cash flow: ${currencyManager.formatAmount(cashFlow)}`
        };
    }

    // Display insights in the UI
    displayInsights(insights) {
        const container = document.getElementById('aiInsights');
        if (!container) return;

        const html = `
            <div class="insights-container">
                ${this.renderTrends(insights.trends)}
                ${this.renderRecommendations(insights.recommendations)}
                ${this.renderAlerts(insights.alerts)}
            </div>
        `;

        container.innerHTML = html;
    }

    renderTrends(trends) {
        if (!trends.length) return '';
        
        return `
            <div class="insights-section">
                <h4><i class="fas fa-chart-line"></i> Business Trends</h4>
                <div class="trends-grid">
                    ${trends.map(trend => `
                        <div class="trend-card ${trend.type}">
                            <div class="trend-header">
                                <span class="trend-label">${trend.label}</span>
                                <span class="trend-value">${trend.value}</span>
                            </div>
                            <p class="trend-insight">${trend.insight}</p>
                            <ul class="trend-recommendations">
                                ${trend.recommendations.map(rec => `
                                    <li>${rec}</li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRecommendations(recommendations) {
        if (!recommendations.length) return '';

        return `
            <div class="insights-section">
                <h4><i class="fas fa-lightbulb"></i> Smart Recommendations</h4>
                <div class="recommendations-list">
                    ${recommendations.map(rec => `
                        <div class="recommendation-item priority-${rec.priority}">
                            <div class="recommendation-header">
                                <i class="fas fa-${this.getRecommendationIcon(rec.type)}"></i>
                                <span>${rec.message}</span>
                            </div>
                            ${rec.items ? `
                                <ul class="recommendation-details">
                                    ${rec.items.map(item => `
                                        <li>${item.name || item}</li>
                                    `).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAlerts(alerts) {
        if (!alerts.length) return '';

        return `
            <div class="insights-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Important Alerts</h4>
                <div class="alerts-list">
                    ${alerts.map(alert => `
                        <div class="alert-item priority-${alert.priority}">
                            <div class="alert-header">
                                <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                                <span>${alert.message}</span>
                            </div>
                            <p class="alert-details">${alert.details}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getRecommendationIcon(type) {
        const icons = {
            inventory: 'box',
            customers: 'users',
            pricing: 'tags',
            default: 'lightbulb'
        };
        return icons[type] || icons.default;
    }

    getAlertIcon(type) {
        const icons = {
            inventory: 'box',
            transaction: 'exchange-alt',
            cashflow: 'money-bill-wave',
            default: 'exclamation-circle'
        };
        return icons[type] || icons.default;
    }

    // Get specific insights
    getInventoryInsight(health) {
        if (health.score >= 90) return 'Excellent inventory management';
        if (health.score >= 70) return 'Good inventory health with some attention needed';
        if (health.score >= 50) return 'Moderate inventory issues to address';
        return 'Critical inventory attention required';
    }

    getInventoryRecommendations(health) {
        const recommendations = [];
        
        if (health.criticalStock.length > 0) {
            recommendations.push(`Urgently restock ${health.criticalStock.length} critical items`);
        }
        if (health.lowStock.length > 0) {
            recommendations.push(`Plan to restock ${health.lowStock.length} items soon`);
        }
        if (health.excess.length > 0) {
            recommendations.push(`Consider promotions for ${health.excess.length} overstocked items`);
        }

        return recommendations;
    }

    getCustomerInsight(segments) {
        const activeRatio = segments.active.length / (segments.active.length + segments.inactive.length);
        if (activeRatio >= 0.8) return 'Strong customer retention';
        if (activeRatio >= 0.6) return 'Good customer activity with room for improvement';
        return 'Customer retention needs attention';
    }

    getCustomerRecommendations(segments) {
        const recommendations = [];
        
        if (segments.inactive.length > 0) {
            recommendations.push(`Re-engage ${segments.inactive.length} inactive customers`);
        }
        if (segments.vip.length > 0) {
            recommendations.push(`Create special offers for ${segments.vip.length} VIP customers`);
        }
        if (segments.new.length > 0) {
            recommendations.push(`Welcome and nurture ${segments.new.length} new customers`);
        }

        return recommendations;
    }

    getRevenueRecommendations(growth) {
        const recommendations = [];
        
        if (growth < 0) {
            recommendations.push('Analyze price points and consider adjustments');
            recommendations.push('Launch promotional campaigns');
            recommendations.push('Focus on customer retention');
        } else if (growth < 10) {
            recommendations.push('Identify growth opportunities');
            recommendations.push('Expand product offerings');
        } else {
            recommendations.push('Maintain current growth strategies');
            recommendations.push('Consider expansion opportunities');
        }

        return recommendations;
    }
}

// Initialize AI assistant
const vaultBooksAI = new VaultBooksAI();
window.vaultBooksAI = vaultBooksAI;
