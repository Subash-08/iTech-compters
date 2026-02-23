const PDFDocument = require('pdfkit');
const fsSync = require('fs');
const path = require('path');

class ShippingLabelGenerator {
    constructor() {
        this.fonts = {
            regular: 'Helvetica',
            bold: 'Helvetica-Bold',
        };
        this.colors = {
            dark: '#000000',
            light: '#333333'
        };
        this.logoPath = path.join(process.cwd(), 'public', 'logo.png');
    }

    async generateShippingLabel(order) {
        return new Promise((resolve, reject) => {
            try {
                // A6 portrait size is standard for shipping labels: [298, 420]
                const doc = new PDFDocument({ margin: 25, size: [298, 420] });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', err => reject(err));

                // 1. HEADER (Title)
                doc.font(this.fonts.bold).fontSize(14).fillColor(this.colors.dark)
                    .text('SHIPPING LABEL', { align: 'center' });

                doc.moveDown(0.5);
                this._drawDivider(doc);

                // 2. FROM BLOCK
                doc.moveDown(0.5);
                doc.font(this.fonts.regular).fontSize(9).fillColor(this.colors.dark);
                doc.text('FROM:', { underline: true });
                doc.font(this.fonts.bold).fontSize(12).text('iTech Computers');
                doc.font(this.fonts.regular).fontSize(9)
                    .text('RBT Mall, Meyyanur Bypass Rd,')
                    .text('Salem, Tamil Nadu - 636004')
                    .text('Phone: +91 98765 43210')
                    .text('Email: itechcomputersno7@gmail.com');

                doc.moveDown(0.5);
                this._drawDivider(doc);

                // 3. TO BLOCK (Large Font)
                const shipping = order.shippingAddress || {};
                const name = `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim();
                const phone = shipping.phone || shipping.mobile || 'N/A';

                doc.moveDown(0.5);
                doc.font(this.fonts.regular).fontSize(10).fillColor(this.colors.dark);
                doc.text('TO:', { underline: true });
                doc.font(this.fonts.bold).fontSize(16).text(name);

                doc.font(this.fonts.bold).fontSize(12);
                if (shipping.addressLine1) doc.text(shipping.addressLine1);
                if (shipping.addressLine2) doc.text(shipping.addressLine2);

                const cityState = `${shipping.city || ''}, ${shipping.state || ''} - `;
                doc.text(cityState, { continued: true });
                doc.font(this.fonts.bold).fontSize(14).text(shipping.pincode || '');

                doc.font(this.fonts.bold).fontSize(12).text(`Phone: ${phone}`);

                doc.moveDown(0.5);
                this._drawDivider(doc);

                // 4. ORDER DETAILS
                doc.moveDown(0.5);
                doc.font(this.fonts.regular).fontSize(10);
                doc.text(`Order ID: `, { continued: true }).font(this.fonts.bold).text(`INV-ORD-${order.orderNumber}`);

                const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN');
                doc.font(this.fonts.regular).text(`Order Date: `, { continued: true }).font(this.fonts.bold).text(orderDate);

                // Assuming "online" since user specified PREPAID ONLY
                doc.font(this.fonts.regular).text(`Payment: `, { continued: true }).font(this.fonts.bold).text('Prepaid');

                doc.moveDown(0.5);
                this._drawDivider(doc);

                // 5. PACKAGE INFO & DECLARED VALUE (Very Important for Courier)
                doc.moveDown(0.5);
                const totalItems = order.items ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : 1;
                const declaredValue = order.pricing ? order.pricing.total : 0;

                doc.font(this.fonts.bold).fontSize(13);
                doc.text(`Total Items: ${totalItems}`);

                doc.moveDown(0.5);
                doc.fontSize(16).text(`Declared Value: Rs. ${Math.round(declaredValue).toLocaleString('en-IN')}`);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    _drawDivider(doc) {
        const y = doc.y;
        doc.moveTo(25, y).lineTo(273, y).lineWidth(1).strokeColor('#aaaaaa').stroke();
        doc.y += 10;
    }
}

module.exports = new ShippingLabelGenerator();
