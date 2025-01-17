// Currency utility functions
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function parseCurrency(currencyString) {
    return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
} 