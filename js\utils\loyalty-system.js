// Loyalty Program System for VaultBooks
class LoyaltySystem {
    constructor() {
        this.tiers = {
            BRONZE: {
                name: 'Bronze',
                minPoints: 0,
                pointMultiplier: 1,
                benefits: [
                    'Earn 1 point per dollar spent',
                    'Birthday reward'
                ]
            },
            SILVER: {
                name: 'Silver',
                minPoints: 1000,
                pointMultiplier: 1.5,
                benefits: [
                    'Earn 1.5 points per dollar spent',
                    'Birthday reward',
                    '5% discount on selected items',
                    'Free delivery on orders over $50'
                ]
            },
            GOLD: {
                name: 'Gold',
                minPoints: 5000,
                pointMultiplier: 2,
                benefits: [
                    'Earn 2 points per dollar spent',
                    'Birthday reward',
                    '10% discount on selected items',
                    'Free delivery on all orders',
                    'Priority customer service'
                ]
            },
            PLATINUM: {
                name: 'Platinum',
                minPoints: 10000,
                pointMultiplier: 3,
                benefits: [
                    'Earn 3 points per dollar spent',
                    'Birthday reward',
                    '15% discount on all items',
                    'Free delivery on all orders',
                    'VIP customer service',
                    'Exclusive early access to sales',
                    'Special event invitations'
                ]
            }
        };

        this.rewards = [
            {
                id: 'DISCOUNT_10',
                name: '10% Off Next Purchase',
                points: 500,
                type: 'discount',
                value: 0.1,
                description: 'Get 10% off your next purchase'
            },
            {
                id: 'DISCOUNT_20',
                name: '20% Off Next Purchase',
                points: 1000,
                type: 'discount',
                value: 0.2,
                description: 'Get 20% off your next purchase'
            },
            {
                id: 'FREE_DELIVERY',
                name: 'Free Delivery',
                points: 300,
                type: 'shipping',
                value: 'free',
                description: 'Free delivery on your next order'
            },
            {
                id: 'GIFT_CARD_10',
                name: '$10 Gift Card',
                points: 800,
                type: 'gift_card',
                value: 10,
                description: 'Get a $10 gift card'
            },
            {
                id: 'GIFT_CARD_25',
                name: '$25 Gift Card',
                points: 2000,
                type: 'gift_card',
                value: 25,
                description: 'Get a $25 gift card'
            }
        ];

        this.loadCustomerLoyalty();
    }

    // Load customer loyalty data
    loadCustomerLoyalty() {
        this.customers = JSON.parse(localStorage.getItem('customerLoyalty')) || {};
    }

    // Save customer loyalty data
    saveCustomerLoyalty() {
        localStorage.setItem('customerLoyalty', JSON.stringify(this.customers));
    }

    // Initialize customer loyalty
    initializeCustomer(customerId, customerName) {
        if (!this.customers[customerId]) {
            this.customers[customerId] = {
                id: customerId,
                name: customerName,
                points: 0,
                tier: 'BRONZE',
                joinDate: new Date().toISOString(),
                history: [],
                rewards: [],
                referrals: [],
                birthdate: null,
                preferences: {}
            };
            this.saveCustomerLoyalty();
        }
        return this.customers[customerId];
    }

    // Add points for a purchase
    addPoints(customerId, amount) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        const tier = this.tiers[customer.tier];
        const points = Math.floor(amount * tier.pointMultiplier);

        customer.points += points;
        customer.history.push({
            type: 'EARN',
            points: points,
            amount: amount,
            date: new Date().toISOString(),
            description: 'Purchase points'
        });

        this.updateCustomerTier(customerId);
        this.saveCustomerLoyalty();

        return {
            earnedPoints: points,
            totalPoints: customer.points,
            tier: customer.tier
        };
    }

    // Update customer tier based on points
    updateCustomerTier(customerId) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        const points = customer.points;
        let newTier = 'BRONZE';

        if (points >= this.tiers.PLATINUM.minPoints) {
            newTier = 'PLATINUM';
        } else if (points >= this.tiers.GOLD.minPoints) {
            newTier = 'GOLD';
        } else if (points >= this.tiers.SILVER.minPoints) {
            newTier = 'SILVER';
        }

        if (newTier !== customer.tier) {
            const oldTier = customer.tier;
            customer.tier = newTier;
            customer.history.push({
                type: 'TIER_CHANGE',
                from: oldTier,
                to: newTier,
                date: new Date().toISOString(),
                description: `Upgraded to ${newTier} tier`
            });

            // Send tier change notification
            this.notifyTierChange(customer, oldTier, newTier);
        }
    }

    // Redeem points for a reward
    redeemReward(customerId, rewardId) {
        const customer = this.customers[customerId];
        const reward = this.rewards.find(r => r.id === rewardId);

        if (!customer || !reward) return null;
        if (customer.points < reward.points) return { error: 'Insufficient points' };

        customer.points -= reward.points;
        customer.rewards.push({
            ...reward,
            redeemDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days expiry
        });

        customer.history.push({
            type: 'REDEEM',
            points: -reward.points,
            reward: reward.name,
            date: new Date().toISOString(),
            description: `Redeemed ${reward.name}`
        });

        this.updateCustomerTier(customerId);
        this.saveCustomerLoyalty();

        return {
            success: true,
            reward: reward,
            remainingPoints: customer.points
        };
    }

    // Get available rewards for a customer
    getAvailableRewards(customerId) {
        const customer = this.customers[customerId];
        if (!customer) return [];

        return this.rewards.map(reward => ({
            ...reward,
            available: customer.points >= reward.points
        }));
    }

    // Get customer tier benefits
    getTierBenefits(customerId) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        return this.tiers[customer.tier].benefits;
    }

    // Add referral
    addReferral(customerId, referredCustomerId) {
        const customer = this.customers[customerId];
        const referredCustomer = this.customers[referredCustomerId];

        if (!customer || !referredCustomer) return null;

        // Add referral bonus points
        const referralPoints = 500;
        customer.points += referralPoints;
        customer.referrals.push({
            referredCustomerId,
            date: new Date().toISOString(),
            points: referralPoints
        });

        customer.history.push({
            type: 'REFERRAL',
            points: referralPoints,
            date: new Date().toISOString(),
            description: 'Referral bonus'
        });

        this.updateCustomerTier(customerId);
        this.saveCustomerLoyalty();

        return {
            success: true,
            points: referralPoints,
            totalPoints: customer.points
        };
    }

    // Get customer loyalty summary
    getCustomerSummary(customerId) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        const tier = this.tiers[customer.tier];
        const nextTier = this.getNextTier(customer.tier);

        return {
            ...customer,
            tierDetails: tier,
            nextTier: nextTier ? {
                name: nextTier.name,
                pointsNeeded: nextTier.minPoints - customer.points
            } : null,
            availableRewards: this.getAvailableRewards(customerId),
            benefits: this.getTierBenefits(customerId)
        };
    }

    // Get next tier details
    getNextTier(currentTier) {
        const tiers = Object.keys(this.tiers);
        const currentIndex = tiers.indexOf(currentTier);
        if (currentIndex < tiers.length - 1) {
            return this.tiers[tiers[currentIndex + 1]];
        }
        return null;
    }

    // Apply reward to purchase
    applyReward(customerId, purchaseAmount, rewardId) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        const reward = customer.rewards.find(r => 
            r.id === rewardId && 
            new Date(r.expiryDate) > new Date() &&
            !r.used
        );

        if (!reward) return { error: 'Invalid or expired reward' };

        let discount = 0;
        switch (reward.type) {
            case 'discount':
                discount = purchaseAmount * reward.value;
                break;
            case 'gift_card':
                discount = Math.min(purchaseAmount, reward.value);
                break;
            case 'shipping':
                // Handle free shipping in the billing system
                discount = 0;
                break;
        }

        reward.used = true;
        reward.usedDate = new Date().toISOString();
        this.saveCustomerLoyalty();

        return {
            success: true,
            discount: discount,
            finalAmount: purchaseAmount - discount,
            reward: reward
        };
    }

    // Send tier change notification
    notifyTierChange(customer, oldTier, newTier) {
        // Create notification
        const notification = {
            type: 'TIER_CHANGE',
            title: 'Congratulations! 🎉',
            message: `You've been upgraded to ${newTier} tier! Enjoy new exclusive benefits.`,
            date: new Date().toISOString(),
            customer: customer.id
        };

        // Add to notifications system
        if (window.notificationSystem) {
            window.notificationSystem.addNotification(notification);
        }

        // You could also send email/SMS notifications here
    }

    // Generate loyalty card
    generateLoyaltyCard(customerId) {
        const customer = this.customers[customerId];
        if (!customer) return null;

        const tier = this.tiers[customer.tier];
        
        // Generate QR code if QR system is available
        let qrCode = null;
        if (window.qrSystem) {
            qrCode = window.qrSystem.generateLoyaltyCardQR(customer);
        }

        return {
            customer: customer,
            tier: tier,
            qrCode: qrCode,
            cardNumber: `VB-${customer.id.padStart(8, '0')}`,
            issueDate: customer.joinDate,
            points: customer.points
        };
    }
}

// Initialize loyalty system
const loyaltySystem = new LoyaltySystem();
window.loyaltySystem = loyaltySystem;
