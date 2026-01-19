import React from 'react';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { ProductItem, InvoiceDetails } from './types';

interface PDFGeneratorProps {
  products: ProductItem[];
  invoiceDetails: InvoiceDetails;
  subtotal: number;
  grandTotal: number;
  disabled: boolean;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  products,
  invoiceDetails,
  subtotal,
  grandTotal,
  disabled
}) => {

  const formatCurrency = (amount: number) => {
    // Using "Rs." is safer than "₹" because standard PDF fonts often fail to render the symbol
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // --- 1. HEADER (Centered) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('iTech Computers', 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Professional Computer Solutions', 105, 26, { align: 'center' });

    // --- 2. DETAILS SECTION (Two Columns) ---
    const startY = 40;
    const col1X = 14;
    const col2X = 110;
    const lineHeight = 7;

    // LEFT COLUMN: Invoice Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice Details', col1X, startY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black text for values

    // Helper for bold labels
    const addField = (label: string, value: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      // Offset value by checking text width of label + padding
      const labelWidth = doc.getTextWidth(label);
      doc.text(value, x + labelWidth + 2, y);
    };

    addField('Invoice No:', invoiceDetails.invoiceNo, col1X, startY + 10);
    addField('Date:', invoiceDetails.date, col1X, startY + 10 + lineHeight);
    addField('Status:', invoiceDetails.status, col1X, startY + 10 + (lineHeight * 2));

    // RIGHT COLUMN: Customer Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Customer Details', col2X, startY);

    if (invoiceDetails.customerName) {
      addField('Name:', invoiceDetails.customerName, col2X, startY + 10);
    }
    if (invoiceDetails.customerMobile) {
      addField('Mobile:', invoiceDetails.customerMobile, col2X, startY + 10 + lineHeight);
    }

    // --- 3. TABLE ---
    const tableStartY = startY + 35;

    const tableBody: RowInput[] = products.map(product => [
      product.name,
      product.quantity.toString(),
      formatCurrency(product.price),
      formatCurrency(product.price * product.quantity)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Item Description', 'Qty', 'Price (Rs)', 'Total (Rs)']],
      body: tableBody,
      theme: 'grid', // This matches the bordered look in your image
      styles: {
        fontSize: 9,
        cellPadding: 3, // Tighter padding like image
        textColor: [0, 0, 0], // Black text
        lineColor: [200, 200, 200], // Light grey borders
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [245, 245, 245], // Very light grey header background
        textColor: [100, 100, 100], // Grey header text
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // --- 4. FOOTER (Totals) ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150); // Grey color for label
    const totalLabel = "GRAND TOTAL: ";
    const totalValue = "Rs." + formatCurrency(grandTotal);
    
    // Align to right
    const totalWidth = doc.getTextWidth(totalLabel + totalValue);
    const xPos = pageWidth - margin - totalWidth;
    
    doc.text(totalLabel, xPos, finalY);
    
    // Make the value slightly darker/blacker
    doc.setTextColor(0, 0, 0);
    doc.text(totalValue, xPos + doc.getTextWidth(totalLabel), finalY);

    doc.save(`Invoice_${invoiceDetails.invoiceNo}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={disabled}
      className="w-full px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Invoice PDF
    </button>
  );
};

export default PDFGenerator;