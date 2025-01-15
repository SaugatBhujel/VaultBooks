// Notification System for VaultBooks
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 100;
        this.soundEnabled = true;
        this.desktopEnabled = true;
        this.loadNotifications();
        this.setupEventListeners();
        this.requestNotificationPermission();
    }

    // Load saved notifications
    loadNotifications() {
        this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    }

    // Save notifications
    saveNotifications() {
        // Keep only the latest notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(-this.maxNotifications);
        }
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for custom events
        document.addEventListener('inventoryAlert', (e) => this.handleInventoryAlert(e.detail));
        document.addEventListener('customerAlert', (e) => this.handleCustomerAlert(e.detail));
        document.addEventListener('systemAlert', (e) => this.handleSystemAlert(e.detail));
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.desktopEnabled = permission === 'granted';
        }
    }

    // Add a new notification
    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.showNotification(newNotification);
        this.updateNotificationBadge();

        return newNotification;
    }

    // Show notification
    showNotification(notification) {
        // Show in-app notification
        this.showInAppNotification(notification);

        // Show desktop notification if enabled
        if (this.desktopEnabled) {
            this.showDesktopNotification(notification);
        }

        // Play sound if enabled
        if (this.soundEnabled) {
            this.playNotificationSound(notification.priority);
        }
    }

    // Show in-app notification
    showInAppNotification(notification) {
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        const toast = document.createElement('div');
        toast.className = `notification-toast priority-${notification.priority || 'normal'}`;
        toast.innerHTML = `
            <div class="notification-header">
                <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                <span class="notification-title">${notification.title}</span>
                <button class="btn-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-body">
                ${notification.message}
            </div>
            <div class="notification-footer">
                <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Show desktop notification
    showDesktopNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VaultBooks', {
                body: notification.message,
                icon: '/img/logo.png',
                tag: notification.id
            });
        }
    }

    // Play notification sound
    playNotificationSound(priority) {
        const audio = new Audio();
        switch (priority) {
            case 'high':
                audio.src = '/sounds/high-priority.mp3';
                break;
            case 'medium':
                audio.src = '/sounds/medium-priority.mp3';
                break;
            default:
                audio.src = '/sounds/notification.mp3';
        }
        audio.play().catch(() => {}); // Ignore autoplay restrictions
    }

    // Mark notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    // Delete notification
    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    // Clear all notifications
    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    // Get unread notifications count
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Update notification badge
    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = this.getUnreadCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    // Handle inventory alerts
    handleInventoryAlert(detail) {
        this.addNotification({
            type: 'inventory',
            title: 'Inventory Alert',
            message: detail.message,
            priority: detail.priority || 'normal',
            data: detail
        });
    }

    // Handle customer alerts
    handleCustomerAlert(detail) {
        this.addNotification({
            type: 'customer',
            title: 'Customer Alert',
            message: detail.message,
            priority: detail.priority || 'normal',
            data: detail
        });
    }

    // Handle system alerts
    handleSystemAlert(detail) {
        this.addNotification({
            type: 'system',
            title: 'System Alert',
            message: detail.message,
            priority: detail.priority || 'normal',
            data: detail
        });
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            inventory: 'box',
            customer: 'user',
            system: 'cog',
            payment: 'money-bill',
            order: 'shopping-cart',
            alert: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            default: 'bell'
        };
        return icons[type] || icons.default;
    }

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else if (diff < 604800000) { // Less than 1 week
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Create notification container
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    // Get all notifications
    getAllNotifications() {
        return this.notifications;
    }

    // Get notifications by type
    getNotificationsByType(type) {
        return this.notifications.filter(n => n.type === type);
    }

    // Get notifications by priority
    getNotificationsByPriority(priority) {
        return this.notifications.filter(n => n.priority === priority);
    }

    // Toggle notification sound
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('notificationSound', this.soundEnabled);
        return this.soundEnabled;
    }

    // Toggle desktop notifications
    async toggleDesktopNotifications() {
        if (!this.desktopEnabled) {
            const permission = await Notification.requestPermission();
            this.desktopEnabled = permission === 'granted';
        } else {
            this.desktopEnabled = false;
        }
        localStorage.setItem('desktopNotifications', this.desktopEnabled);
        return this.desktopEnabled;
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();
window.notificationSystem = notificationSystem;
