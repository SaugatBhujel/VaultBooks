// Load business settings from localStorage
function loadBusinessSettings() {
    const settings = localStorage.getItem('businessSettings');
    if (settings) {
        return JSON.parse(settings);
    }
    return businessConfig; // Use default config if no settings saved
}

// Save business settings to localStorage
function saveBusinessSettings() {
    try {
        const settings = {
            name: document.getElementById('businessName').value,
            tagline: document.getElementById('businessTagline').value,
            address: document.getElementById('businessAddress').value,
            phone: document.getElementById('businessPhone').value,
            email: document.getElementById('businessEmail').value,
            website: document.getElementById('businessWebsite').value,
            taxNumber: document.getElementById('businessTaxNumber').value,
            logo: document.getElementById('businessLogo').value,
            footer: {
                text: document.getElementById('footerText').value,
                supportEmail: document.getElementById('supportEmail').value,
                supportPhone: document.getElementById('supportPhone').value
            }
        };

        localStorage.setItem('businessSettings', JSON.stringify(settings));
        Object.assign(businessConfig, settings); // Update current config
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        modal.hide();
        
        alert('Settings saved successfully!');
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
        return false;
    }
}

// Show settings modal with current values
function showSettings() {
    try {
        const settings = loadBusinessSettings();
        
        // Populate form fields
        document.getElementById('businessName').value = settings.name || '';
        document.getElementById('businessTagline').value = settings.tagline || '';
        document.getElementById('businessAddress').value = settings.address || '';
        document.getElementById('businessPhone').value = settings.phone || '';
        document.getElementById('businessEmail').value = settings.email || '';
        document.getElementById('businessWebsite').value = settings.website || '';
        document.getElementById('businessTaxNumber').value = settings.taxNumber || '';
        document.getElementById('businessLogo').value = settings.logo || '';
        document.getElementById('footerText').value = settings.footer?.text || '';
        document.getElementById('supportEmail').value = settings.footer?.supportEmail || '';
        document.getElementById('supportPhone').value = settings.footer?.supportPhone || '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    } catch (error) {
        console.error('Error showing settings:', error);
        alert('Failed to load settings. Please try again.');
    }
}

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    const savedSettings = loadBusinessSettings();
    Object.assign(businessConfig, savedSettings);
}); 