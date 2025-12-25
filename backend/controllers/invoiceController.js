const Invoice = require('../models/Invoice');
const Product = require('../models/productModel');
const PreBuiltPC = require('../models/preBuiltPCModel');
const User = require('../models/userModel');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

const generatePDF = async (invoice, templatePath) => {
    try {
        const template = fs.readFileSync(templatePath, 'utf8');

        // Calculate products totals
        let productsSubtotal = 0;
        let productsTotalGst = 0;

        // Regular products
        invoice.products.forEach(product => {
            const itemTotal = product.quantity * product.unitPrice;
            const itemGst = itemTotal * (product.gstPercentage / 100);
            productsSubtotal += itemTotal;
            productsTotalGst += itemGst;
        });

        // ADD THIS: Custom products calculation
        invoice.customProducts.forEach(product => {
            const itemTotal = product.quantity * product.unitPrice;
            const itemGst = itemTotal * (product.gstPercentage / 100);
            productsSubtotal += itemTotal;
            productsTotalGst += itemGst;
        });

        // Pre-built PCs
        invoice.preBuiltPCs.forEach(pc => {
            const pcTotal = pc.quantity * pc.unitPrice;
            const pcGst = pcTotal * (pc.gstPercentage / 100);
            productsSubtotal += pcTotal;
            productsTotalGst += pcGst;
        });

        const data = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
            dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
            customerName: invoice.customer.name,
            customerCompany: invoice.customer.companyName || '',
            customerMobile: invoice.customer.mobile,
            customerEmail: invoice.customer.email || '',
            customerAddress: invoice.customer.address || '',
            customerGSTIN: invoice.customer.gstin || 'N/A',
            paymentStatus: invoice.payment.status,
            paymentMethod: invoice.payment.method,
            paymentPaid: invoice.payment.status === 'paid',
            transactionId: invoice.payment.transactionId || '',
            productsSubtotal: productsSubtotal.toFixed(2),
            productsTotalGst: productsTotalGst.toFixed(2),
            subtotal: invoice.totals.subtotal.toFixed(2),
            discount: invoice.totals.discount.toFixed(2),
            shipping: invoice.totals.shipping.toFixed(2),
            totalGst: invoice.totals.totalGst.toFixed(2),
            roundOff: invoice.totals.roundOff.toFixed(2),
            grandTotal: invoice.totals.grandTotal.toFixed(2),
            notes: invoice.notes || 'No notes added'
        };

        // Generate product rows
        let productRows = '';
        let rowNumber = 1;

        // Regular products
        invoice.products.forEach(product => {
            const total = product.quantity * product.unitPrice;
            const gstAmount = total * (product.gstPercentage / 100);
            const totalWithGst = total + gstAmount;

            productRows += `
        <tr>
          <td>${rowNumber++}</td>
          <td>
            <div style="font-weight: 500;">${product.name}</div>
            ${product.sku ? `<div style="font-size: 11px; color: #666;">SKU: ${product.sku}</div>` : ''}
          </td>
          <td class="text-center">${product.quantity}</td>
          <td class="text-right">₹${product.unitPrice.toFixed(2)}</td>
          <td class="text-center">${product.gstPercentage}%</td>
          <td class="text-right">₹${totalWithGst.toFixed(2)}</td>
        </tr>
      `;
        });

        // ADD THIS: Custom products section
        invoice.customProducts.forEach(product => {
            const total = product.quantity * product.unitPrice;
            const gstAmount = total * (product.gstPercentage / 100);
            const totalWithGst = total + gstAmount;

            productRows += `
        <tr>
          <td>${rowNumber++}</td>
          <td>
            <div style="font-weight: 500;">${product.name}</div>
            <div style="font-size: 11px; color: #28a745;">Custom Product</div>
            ${product.sku ? `<div style="font-size: 11px; color: #666;">SKU: ${product.sku}</div>` : ''}
            ${product.description ? `<div style="font-size: 11px; color: #666; font-style: italic;">${product.description}</div>` : ''}
          </td>
          <td class="text-center">${product.quantity}</td>
          <td class="text-right">₹${product.unitPrice.toFixed(2)}</td>
          <td class="text-center">${product.gstPercentage}%</td>
          <td class="text-right">₹${totalWithGst.toFixed(2)}</td>
        </tr>
      `;
        });

        // Pre-built PCs
        invoice.preBuiltPCs.forEach(pc => {
            const total = pc.quantity * pc.unitPrice;
            const gstAmount = total * (pc.gstPercentage / 100);
            const totalWithGst = total + gstAmount;

            productRows += `
        <tr>
          <td>${rowNumber++}</td>
          <td>
            <div style="font-weight: 500;">${pc.name}</div>
            <div style="font-size: 11px; color: #28a745;">Pre-built PC</div>
            ${pc.components && pc.components.length > 0 ?
                    `<div style="font-size: 10px; color: #666;">Includes: ${pc.components.slice(0, 2).map(c => c.name).join(', ')}${pc.components.length > 2 ? '...' : ''}</div>` : ''}
          </td>
          <td class="text-center">${pc.quantity}</td>
          <td class="text-right">₹${pc.unitPrice.toFixed(2)}</td>
          <td class="text-center">${pc.gstPercentage}%</td>
          <td class="text-right">₹${totalWithGst.toFixed(2)}</td>
        </tr>
      `;
        });

        // Replace placeholders
        let html = template;
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            html = html.replace(new RegExp(placeholder, 'g'), data[key]);
        });

        // Handle conditionals
        const conditionals = [
            'customerCompany',
            'customerEmail',
            'customerAddress',
            'transactionId'
        ];

        conditionals.forEach(field => {
            if (!data[field]) {
                const regex = new RegExp(`\\{\\{#if ${field}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g');
                html = html.replace(regex, '');
            } else {
                const regex = new RegExp(`\\{\\{#if ${field}\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}`, 'g');
                html = html.replace(regex, '$1');
            }
        });

        // Replace product rows
        html = html.replace('{{productRows}}', productRows);

        // Clean up any remaining placeholders
        html = html.replace(/\{\{[^}]*\}\}/g, '');

        // Generate PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(__dirname, '../invoices', `${invoice.invoiceNumber}.pdf`);
        const pdfDir = path.dirname(pdfPath);

        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        await browser.close();
        return pdfPath;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw new ErrorHandler('Failed to generate PDF', 500);
    }
};

// Create Invoice - UPDATED VERSION
exports.createInvoice = catchAsyncErrors(async (req, res, next) => {
    try {
        let invoiceData = req.body;
        invoiceData.createdBy = req.user.id;

        // Generate invoice number if not provided
        if (!invoiceData.invoiceNumber) {
            // Get the last invoice number
            const lastInvoice = await Invoice.findOne()
                .sort({ createdAt: -1 })
                .select('invoiceNumber');

            let nextNumber = 1001; // Starting number

            if (lastInvoice && lastInvoice.invoiceNumber) {
                // Extract number from invoice number format like INV-1001
                const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            invoiceData.invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;
        }

        // Ensure required fields exist for products
        if (invoiceData.products && invoiceData.products.length > 0) {
            for (const item of invoiceData.products) {
                // Calculate missing fields
                if (!item.total) {
                    item.total = item.quantity * item.unitPrice;
                }
                if (!item.gstAmount) {
                    item.gstAmount = item.total * (item.gstPercentage / 100);
                }

                // Validate product exists
                const product = await Product.findById(item.productId);
                if (!product) {
                    return next(new ErrorHandler(`Product not found: ${item.productId}`, 404));
                }

                // Fill missing product details
                item.name = item.name || product.name;
                item.sku = item.sku || product.sku;
                item.category = product.category;
            }
        }

        // Ensure required fields exist for pre-built PCs
        if (invoiceData.preBuiltPCs && invoiceData.preBuiltPCs.length > 0) {
            for (const pc of invoiceData.preBuiltPCs) {
                // Calculate missing fields
                if (!pc.total) {
                    pc.total = pc.quantity * pc.unitPrice;
                }
                if (!pc.gstAmount) {
                    pc.gstAmount = pc.total * (pc.gstPercentage / 100);
                }

                // Validate pre-built PC exists
                const preBuiltPC = await PreBuiltPC.findById(pc.pcId);
                if (!preBuiltPC) {
                    return next(new ErrorHandler(`Pre-built PC not found: ${pc.pcId}`, 404));
                }
                pc.name = pc.name || preBuiltPC.name;
            }
        }
        if (invoiceData.customProducts && invoiceData.customProducts.length > 0) {
            for (const item of invoiceData.customProducts) {
                // Calculate missing fields
                if (!item.total) {
                    item.total = item.quantity * item.unitPrice;
                }
                if (!item.gstAmount) {
                    item.gstAmount = item.total * (item.gstPercentage / 100);
                }
                if (!item.isCustom) {
                    item.isCustom = true;
                }
            }
        }

        // Update totals calculation to include customProducts:
        if (!invoiceData.totals.subtotal) {
            const productsTotal = invoiceData.products?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const pcsTotal = invoiceData.preBuiltPCs?.reduce((sum, pc) => sum + (pc.total || 0), 0) || 0;
            const customProductsTotal = invoiceData.customProducts?.reduce((sum, cp) => sum + (cp.total || 0), 0) || 0;
            invoiceData.totals.subtotal = productsTotal + pcsTotal + customProductsTotal;
        }

        // Calculate totals if not provided
        if (!invoiceData.totals) {
            invoiceData.totals = {};
        }

        if (!invoiceData.totals.subtotal) {
            const productsTotal = invoiceData.products?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const pcsTotal = invoiceData.preBuiltPCs?.reduce((sum, pc) => sum + (pc.total || 0), 0) || 0;
            invoiceData.totals.subtotal = productsTotal + pcsTotal;
        }

        if (!invoiceData.totals.totalGst) {
            const productsGst = invoiceData.products?.reduce((sum, p) => sum + (p.gstAmount || 0), 0) || 0;
            const pcsGst = invoiceData.preBuiltPCs?.reduce((sum, pc) => sum + (pc.gstAmount || 0), 0) || 0;
            invoiceData.totals.totalGst = productsGst + pcsGst;
        }

        if (!invoiceData.totals.grandTotal) {
            invoiceData.totals.grandTotal =
                (invoiceData.totals.subtotal || 0) +
                (invoiceData.totals.totalGst || 0) +
                (invoiceData.totals.shipping || 0) -
                (invoiceData.totals.discount || 0);

            // Calculate round off
            invoiceData.totals.roundOff = Math.round(invoiceData.totals.grandTotal) - invoiceData.totals.grandTotal;
            invoiceData.totals.grandTotal = Math.round(invoiceData.totals.grandTotal);
        }

        // Set default status if not provided
        if (!invoiceData.status) {
            invoiceData.status = 'draft';
        }

        // Set default payment status if not provided
        if (!invoiceData.payment) {
            invoiceData.payment = {
                status: 'pending',
                method: 'cash',
                paidAmount: 0
            };
        }
        const invoice = await Invoice.create(invoiceData);

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice
        });

    } catch (error) {
        console.error('Invoice creation error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: `Validation failed: ${messages.join(', ')}`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create invoice',
            error: error.message
        });
    }
});

// Get all invoices with filters
exports.getInvoices = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
        query.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { 'customer.name': { $regex: search, $options: 'i' } },
            { 'customer.mobile': { $regex: search, $options: 'i' } },
            { 'customer.email': { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email');

    const total = await Invoice.countDocuments(query);

    res.status(200).json({
        success: true,
        invoices,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Get single invoice
exports.getInvoice = catchAsyncErrors(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('products.productId', 'name sku price images category')
        .populate('preBuiltPCs.pcId', 'name components price images');

    if (!invoice) {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    res.status(200).json({
        success: true,
        invoice
    });
});

// Update invoice
exports.updateInvoice = catchAsyncErrors(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    // Don't allow updating PDF path directly
    if (req.body.pdfPath) {
        delete req.body.pdfPath;
    }

    Object.keys(req.body).forEach(key => {
        invoice[key] = req.body[key];
    });

    await invoice.save();

    res.status(200).json({
        success: true,
        invoice
    });
});

// Delete invoice
exports.deleteInvoice = catchAsyncErrors(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    // Delete PDF file if exists
    if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
        fs.unlinkSync(invoice.pdfPath);
    }

    await invoice.remove();

    res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully'
    });
});

// Generate and save PDF
exports.generateInvoicePDF = catchAsyncErrors(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    const templatePath = path.join(__dirname, '../templates/invoice.html');
    const pdfPath = await generatePDF(invoice, templatePath);

    invoice.pdfPath = pdfPath;
    invoice.status = 'sent';
    await invoice.save();

    res.status(200).json({
        success: true,
        message: 'PDF generated successfully',
        pdfPath
    });
});

// Download PDF
exports.downloadInvoicePDF = catchAsyncErrors(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
        // Generate PDF if not exists
        const templatePath = path.join(__dirname, '../templates/invoice.html');
        const pdfPath = await generatePDF(invoice, templatePath);
        invoice.pdfPath = pdfPath;
        await invoice.save();
    }

    res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);
});

// Get invoice statistics
exports.getInvoiceStats = catchAsyncErrors(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
        match.invoiceDate = {};
        if (startDate) match.invoiceDate.$gte = new Date(startDate);
        if (endDate) match.invoiceDate.$lte = new Date(endDate);
    }

    const stats = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: '$totals.grandTotal' },
                averageInvoice: { $avg: '$totals.grandTotal' },
                pendingAmount: {
                    $sum: {
                        $cond: [
                            { $eq: ['$payment.status', 'pending'] },
                            '$totals.grandTotal',
                            0
                        ]
                    }
                },
                paidAmount: {
                    $sum: {
                        $cond: [
                            { $eq: ['$payment.status', 'paid'] },
                            '$totals.grandTotal',
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const statusCounts = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const paymentMethodCounts = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$payment.method',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        stats: stats[0] || {
            totalInvoices: 0,
            totalAmount: 0,
            averageInvoice: 0,
            pendingAmount: 0,
            paidAmount: 0
        },
        statusCounts,
        paymentMethodCounts
    });
});

// Search invoices
exports.searchInvoices = catchAsyncErrors(async (req, res, next) => {
    const { query } = req.query;

    if (!query) {
        return next(new ErrorHandler('Search query required', 400));
    }

    const invoices = await Invoice.find({
        $or: [
            { invoiceNumber: { $regex: query, $options: 'i' } },
            { 'customer.name': { $regex: query, $options: 'i' } },
            { 'customer.mobile': { $regex: query, $options: 'i' } },
            { 'customer.email': { $regex: query, $options: 'i' } }
        ]
    }).limit(10);

    res.status(200).json({
        success: true,
        invoices
    });
});

// Get recent invoices
exports.getRecentInvoices = catchAsyncErrors(async (req, res, next) => {
    const invoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name email');

    res.status(200).json({
        success: true,
        invoices
    });
});


// Get invoice template for preview
exports.getInvoiceTemplate = catchAsyncErrors(async (req, res, next) => {
    const templatePath = path.join(__dirname, '../templates/invoice.html');

    if (!fs.existsSync(templatePath)) {
        return next(new ErrorHandler('Template not found', 404));
    }

    const template = fs.readFileSync(templatePath, 'utf8');

    res.status(200).json({
        success: true,
        template
    });
});