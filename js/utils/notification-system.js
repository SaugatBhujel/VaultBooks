// Notification system utility functions
class NotificationSystem {
    constructor() {
        this.notifications = [];
    }

    notify(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        this.notifications.push(notification);
        this.showNotification(notification);
    }

    showNotification(notification) {
        // Create notification element
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.innerHTML = `
            <div class="notification-content">
                <p>${notification.message}</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to DOM
        const container = document.getElementById('notification-container') || document.body;
        container.appendChild(element);

        // Auto-remove after 5 seconds
        setTimeout(() => element.remove(), 5000);
    }
}

const notificationSystem = new NotificationSystem(); 