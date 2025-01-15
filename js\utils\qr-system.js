// QR Code System for VaultBooks
class QRSystem {
    constructor() {
        this.qrInstance = null;
        this.loadQRLibrary();
    }

    // Load QR Code library
    async loadQRLibrary() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
        document.head.appendChild(script);
        
        await new Promise(resolve => script.onload = resolve);
        this.initializeQR();
    }

    // Initialize QR generator
    initializeQR() {
        this.qrInstance = QRious;
    }

    // Generate QR code for a bill
    generateBillQR(bill) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                billId: bill.id,
                amount: bill.total,
                currency: currencyManager.currentCurrency,
                date: bill.date,
                items: bill.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Generate QR code for a product
    generateProductQR(product) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category,
                sku: product.sku
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Generate QR code for business card
    generateBusinessCardQR(business) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                name: business.name,
                address: business.address,
                phone: business.phone,
                email: business.email,
                website: business.website,
                social: business.social
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Generate QR code for payment
    generatePaymentQR(payment) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                amount: payment.amount,
                currency: payment.currency,
                recipient: payment.recipient,
                description: payment.description,
                reference: payment.reference
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Generate QR code for inventory item
    generateInventoryQR(item) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                id: item.id,
                name: item.name,
                sku: item.sku,
                location: item.location,
                quantity: item.quantity,
                reorderPoint: item.reorderPoint
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Generate batch QR codes for inventory
    generateInventoryBatchQR(items) {
        return items.map(item => ({
            item: item,
            qr: this.generateInventoryQR(item)
        }));
    }

    // Generate QR code for customer loyalty card
    generateLoyaltyCardQR(customer) {
        const qr = new this.qrInstance({
            element: document.createElement('canvas'),
            value: JSON.stringify({
                id: customer.id,
                name: customer.name,
                points: customer.loyaltyPoints,
                tier: customer.loyaltyTier,
                joined: customer.joinDate
            }),
            size: 200
        });

        return qr.element.toDataURL('image/png');
    }

    // Print QR code labels
    printQRLabels(qrCodes) {
        const printWindow = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code Labels</title>
                <style>
                    .qr-label {
                        display: inline-block;
                        margin: 10px;
                        padding: 15px;
                        border: 1px solid #ccc;
                        text-align: center;
                    }
                    .qr-label img {
                        display: block;
                        margin-bottom: 10px;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button onclick="window.print()">Print Labels</button>
                </div>
                ${qrCodes.map(qr => `
                    <div class="qr-label">
                        <img src="${qr.qr}" alt="QR Code">
                        <div>${qr.item.name}</div>
                        <div>${qr.item.sku || ''}</div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    // Scan QR code using device camera
    async scanQR() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            video.srcObject = stream;
            await video.play();

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Create scanning UI
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="qr-scanner-modal">
                    <div class="scanner-container">
                        <video id="qr-video"></video>
                        <div class="scanning-overlay"></div>
                    </div>
                    <button class="btn-cancel">Cancel</button>
                </div>
            `;

            document.body.appendChild(modal);

            // Add scanning animation and logic here
            // This is a placeholder for actual QR code scanning implementation
            // You would typically use a library like jsQR here

            return new Promise((resolve, reject) => {
                // Simulate scanning (replace with actual scanning logic)
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    modal.remove();
                    resolve({
                        success: true,
                        data: "Sample QR Code Data"
                    });
                }, 3000);
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process scanned QR code data
    processScannedData(data) {
        try {
            const parsed = JSON.parse(data);
            
            // Determine type of QR code and handle accordingly
            if (parsed.billId) {
                return {
                    type: 'bill',
                    data: parsed
                };
            } else if (parsed.sku) {
                return {
                    type: 'product',
                    data: parsed
                };
            } else if (parsed.loyaltyPoints) {
                return {
                    type: 'loyalty',
                    data: parsed
                };
            } else if (parsed.amount && parsed.recipient) {
                return {
                    type: 'payment',
                    data: parsed
                };
            }

            return {
                type: 'unknown',
                data: parsed
            };
        } catch (error) {
            console.error('Error processing QR data:', error);
            return {
                type: 'error',
                error: error.message
            };
        }
    }
}

// Initialize QR system
const qrSystem = new QRSystem();
window.qrSystem = qrSystem;
