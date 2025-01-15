// Currency Configuration
const CURRENCIES = {
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        locale: 'en-US',
        exchangeRate: 1, // Base currency
        decimalPlaces: 2,
        symbolPosition: 'before'
    },
    NPR: {
        code: 'NPR',
        symbol: 'रू',
        name: 'Nepali Rupee',
        locale: 'ne-NP',
        exchangeRate: 132.95, // Example rate, should be updated from API
        decimalPlaces: 2,
        symbolPosition: 'before'
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        locale: 'en-EU',
        exchangeRate: 0.91,
        decimalPlaces: 2,
        symbolPosition: 'before'
    },
    GBP: {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        locale: 'en-GB',
        exchangeRate: 0.79,
        decimalPlaces: 2,
        symbolPosition: 'before'
    },
    INR: {
        code: 'INR',
        symbol: '₹',
        name: 'Indian Rupee',
        locale: 'en-IN',
        exchangeRate: 83.20,
        decimalPlaces: 2,
        symbolPosition: 'before'
    }
};

class CurrencyManager {
    constructor() {
        this.currentCurrency = localStorage.getItem('preferredCurrency') || 'USD';
        this.exchangeRates = {};
        this.lastUpdate = null;
        this.updateInterval = 1 * 60 * 60 * 1000; // 1 hour
        this.initializeExchangeRates();
    }

    // Initialize exchange rates
    async initializeExchangeRates() {
        const lastUpdate = localStorage.getItem('exchangeRatesLastUpdate');
        const savedRates = localStorage.getItem('exchangeRates');

        if (lastUpdate && savedRates && Date.now() - parseInt(lastUpdate) < this.updateInterval) {
            this.exchangeRates = JSON.parse(savedRates);
            this.lastUpdate = parseInt(lastUpdate);
        } else {
            await this.updateExchangeRates();
        }
    }

    // Update exchange rates from API
    async updateExchangeRates() {
        try {
            // In production, use a real exchange rate API
            // Example: const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            // const data = await response.json();
            
            // For now, use static rates
            this.exchangeRates = Object.fromEntries(
                Object.entries(CURRENCIES).map(([code, currency]) => [
                    code,
                    currency.exchangeRate
                ])
            );

            this.lastUpdate = Date.now();
            localStorage.setItem('exchangeRates', JSON.stringify(this.exchangeRates));
            localStorage.setItem('exchangeRatesLastUpdate', this.lastUpdate.toString());
        } catch (error) {
            console.error('Failed to update exchange rates:', error);
            // Use fallback rates from CURRENCIES object
            this.exchangeRates = Object.fromEntries(
                Object.entries(CURRENCIES).map(([code, currency]) => [
                    code,
                    currency.exchangeRate
                ])
            );
        }
    }

    // Set current currency
    setCurrentCurrency(currencyCode) {
        if (CURRENCIES[currencyCode]) {
            this.currentCurrency = currencyCode;
            localStorage.setItem('preferredCurrency', currencyCode);
            // Trigger event for UI update
            window.dispatchEvent(new CustomEvent('currencyChange', {
                detail: { currency: currencyCode }
            }));
        }
    }

    // Get current currency info
    getCurrentCurrency() {
        return CURRENCIES[this.currentCurrency];
    }

    // Format amount in current currency
    formatAmount(amount, currencyCode = this.currentCurrency) {
        const currency = CURRENCIES[currencyCode];
        if (!currency) return amount.toString();

        const formatter = new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: currency.decimalPlaces,
            maximumFractionDigits: currency.decimalPlaces
        });

        return formatter.format(amount);
    }

    // Convert amount between currencies
    convert(amount, fromCurrency, toCurrency) {
        const from = CURRENCIES[fromCurrency];
        const to = CURRENCIES[toCurrency];
        if (!from || !to) return amount;

        // Convert to USD first (base currency)
        const usdAmount = amount / from.exchangeRate;
        // Convert from USD to target currency
        return usdAmount * to.exchangeRate;
    }

    // Format amount in words (useful for invoices)
    formatAmountInWords(amount, currencyCode = this.currentCurrency) {
        const currency = CURRENCIES[currencyCode];
        if (!currency) return '';

        const converter = new AmountToWords(currency);
        return converter.convert(amount);
    }

    // Get all available currencies
    getAllCurrencies() {
        return Object.entries(CURRENCIES).map(([code, currency]) => ({
            code,
            name: currency.name,
            symbol: currency.symbol
        }));
    }
}

// Helper class to convert amount to words
class AmountToWords {
    constructor(currency) {
        this.currency = currency;
        this.units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        this.teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        this.tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        this.nepaliUnits = ['', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ'];
        this.nepaliTeens = ['दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस'];
        this.nepaliTens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठी', 'सत्तरी', 'असी', 'नब्बे'];
    }

    convert(amount) {
        if (this.currency.code === 'NPR') {
            return this.convertNepali(amount);
        }
        return this.convertEnglish(amount);
    }

    convertEnglish(amount) {
        const wholePart = Math.floor(amount);
        const decimalPart = Math.round((amount - wholePart) * 100);

        let result = this.numberToWords(wholePart);
        if (decimalPart > 0) {
            result += ` and ${decimalPart}/100`;
        }
        result += ` ${this.currency.name}${wholePart !== 1 ? 's' : ''} Only`;

        return result;
    }

    convertNepali(amount) {
        const wholePart = Math.floor(amount);
        const decimalPart = Math.round((amount - wholePart) * 100);

        let result = this.numberToNepaliWords(wholePart);
        if (decimalPart > 0) {
            result += ` र ${this.numberToNepaliWords(decimalPart)} पैसा`;
        }
        result += ' मात्र';

        return result;
    }

    numberToWords(num) {
        if (num === 0) return 'Zero';
        if (num < 0) return 'Negative ' + this.numberToWords(Math.abs(num));

        let words = '';

        if (num >= 1000000000) {
            words += this.numberToWords(Math.floor(num / 1000000000)) + ' Billion ';
            num %= 1000000000;
        }

        if (num >= 1000000) {
            words += this.numberToWords(Math.floor(num / 1000000)) + ' Million ';
            num %= 1000000;
        }

        if (num >= 1000) {
            words += this.numberToWords(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }

        if (num >= 100) {
            words += this.units[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }

        if (num >= 20) {
            words += this.tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num >= 10) {
            words += this.teens[num - 10] + ' ';
            return words.trim();
        }

        if (num > 0) {
            words += this.units[num] + ' ';
        }

        return words.trim();
    }

    numberToNepaliWords(num) {
        if (num === 0) return 'शून्य';
        if (num < 0) return 'ऋणात्मक ' + this.numberToNepaliWords(Math.abs(num));

        let words = '';

        if (num >= 10000000) {
            words += this.numberToNepaliWords(Math.floor(num / 10000000)) + ' करोड ';
            num %= 10000000;
        }

        if (num >= 100000) {
            words += this.numberToNepaliWords(Math.floor(num / 100000)) + ' लाख ';
            num %= 100000;
        }

        if (num >= 1000) {
            words += this.numberToNepaliWords(Math.floor(num / 1000)) + ' हजार ';
            num %= 1000;
        }

        if (num >= 100) {
            words += this.nepaliUnits[Math.floor(num / 100)] + ' सय ';
            num %= 100;
        }

        if (num >= 20) {
            words += this.nepaliTens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num >= 10) {
            words += this.nepaliTeens[num - 10] + ' ';
            return words.trim();
        }

        if (num > 0) {
            words += this.nepaliUnits[num] + ' ';
        }

        return words.trim();
    }
}

// Initialize currency manager
const currencyManager = new CurrencyManager();

// Export for use in other files
window.currencyManager = currencyManager;
