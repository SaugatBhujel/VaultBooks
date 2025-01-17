// Loyalty system utility functions
class LoyaltySystem {
    constructor() {
        this.pointsPerDollar = 1;
    }

    calculatePoints(purchaseAmount) {
        return Math.floor(purchaseAmount * this.pointsPerDollar);
    }

    getRewardTiers() {
        return {
            bronze: 0,
            silver: 1000,
            gold: 5000,
            platinum: 10000
        };
    }
}

const loyaltySystem = new LoyaltySystem(); 