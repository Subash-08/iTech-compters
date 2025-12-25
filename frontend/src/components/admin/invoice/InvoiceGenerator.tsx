import React, { useState, useEffect } from 'react';
import CustomerDetailsForm from './CustomerDetailsForm';
import CategoryProductSelector from './CategoryProductSelector';
import InvoiceSummary from './InvoiceSummary';
import InvoicePreview from './InvoicePreview';
import CustomProductForm from './CustomProductForm'; // Add this import
import { 
  CustomerDetails, 
  InvoiceProduct, 
  InvoicePreBuiltPC, 
  InvoiceCustomProduct 
} from '../types/invoice';
import { invoiceService } from '../services/invoiceService';
import { toast } from 'react-hot-toast';

const InvoiceGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    companyName: '',
    gstin: ''
  });

  const [products, setProducts] = useState<InvoiceProduct[]>([]);
  const [customProducts, setCustomProducts] = useState<InvoiceCustomProduct[]>([]); // Add this
  const [preBuiltPCs, setPreBuiltPCs] = useState<InvoicePreBuiltPC[]>([]);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'cod' | 'bank_transfer' | 'online'>('cash');
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate totals - UPDATED to include custom products
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    // Calculate regular products
    products.forEach(product => {
      const productTotal = product.quantity * product.unitPrice;
      const productGst = productTotal * (product.gstPercentage / 100);
      subtotal += productTotal;
      totalGst += productGst;
    });

    // Calculate custom products - ADDED
    customProducts.forEach(product => {
      const productTotal = product.quantity * product.unitPrice;
      const productGst = productTotal * (product.gstPercentage / 100);
      subtotal += productTotal;
      totalGst += productGst;
    });

    // Calculate pre-built PCs
    preBuiltPCs.forEach(pc => {
      const pcTotal = pc.quantity * pc.unitPrice;
      const pcGst = pcTotal * (pc.gstPercentage / 100);
      subtotal += pcTotal;
      totalGst += pcGst;
    });

    // Apply discount and shipping
    const afterDiscount = subtotal - discount;
    const afterShipping = afterDiscount + shipping;
    const grandTotalBeforeRound = afterShipping + totalGst;
    const roundOff = Math.round(grandTotalBeforeRound) - grandTotalBeforeRound;
    const grandTotal = Math.round(grandTotalBeforeRound);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    };
  };

  const totals = calculateTotals();

  // Product handlers
  const handleAddProduct = (product: InvoiceProduct) => {
    setProducts(prev => [...prev, product]);
  };

  const handleAddCustomProduct = (product: InvoiceCustomProduct) => { // Add this
    setCustomProducts(prev => [...prev, product]);
  };

  const handleAddPreBuiltPC = (pc: InvoicePreBuiltPC) => {
    setPreBuiltPCs(prev => [...prev, pc]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCustomProduct = (index: number) => { // Add this
    setCustomProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemovePreBuiltPC = (index: number) => {
    setPreBuiltPCs(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = (index: number, updates: Partial<InvoiceProduct>) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, ...updates } : product
    ));
  };

  const handleUpdateCustomProduct = (index: number, updates: Partial<InvoiceCustomProduct>) => { // Add this
    const updated = [...customProducts];
    updated[index] = { ...updated[index], ...updates };
    
    // Recalculate totals for custom product
    if (updates.quantity !== undefined || updates.unitPrice !== undefined || updates.gstPercentage !== undefined) {
      const item = updated[index];
      const total = item.quantity * item.unitPrice;
      const gstAmount = total * (item.gstPercentage / 100);
      updated[index].total = total;
      updated[index].gstAmount = gstAmount;
    }
    
    setCustomProducts(updated);
  };

  const handleUpdatePreBuiltPC = (index: number, updates: Partial<InvoicePreBuiltPC>) => {
    setPreBuiltPCs(prev => prev.map((pc, i) => 
      i === index ? { ...pc, ...updates } : pc
    ));
  };

  const handleGenerateInvoice = async () => {
    try {
      // Validate required fields
      if (!customerDetails.name.trim() || !customerDetails.mobile.trim()) {
        toast.error('Customer name and mobile are required');
        return;
      }

      if (products.length === 0 && customProducts.length === 0 && preBuiltPCs.length === 0) { // Updated validation
        toast.error('Add at least one product');
        return;
      }

      setIsGenerating(true);

      // Calculate totals for each item type
      const productsWithTotals = products.map(product => ({
        ...product,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      }));

      const customProductsWithTotals = customProducts.map(product => ({ // Add this
        ...product,
        isCustom: true,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      }));

      const preBuiltPCsWithTotals = preBuiltPCs.map(pc => ({
        ...pc,
        total: pc.quantity * pc.unitPrice,
        gstAmount: (pc.quantity * pc.unitPrice) * (pc.gstPercentage / 100)
      }));

      // Calculate overall totals
      const subtotal = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.total, 0);
      
      const totalGst = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.gstAmount, 0);

      const grandTotal = subtotal + totalGst + shipping - discount;
      const roundOff = Math.round(grandTotal) - grandTotal;

      // Prepare complete invoice data
      const invoiceData = {
        customer: {
          name: customerDetails.name,
          mobile: customerDetails.mobile,
          email: customerDetails.email || '',
          address: customerDetails.address || '',
          companyName: customerDetails.companyName || '',
          gstin: customerDetails.gstin || ''
        },
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        products: productsWithTotals.map(product => ({
          productId: product.productId,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          gstPercentage: product.gstPercentage,
          gstAmount: product.gstAmount,
          total: product.total,
          category: product.category,
          variant: product.variant || {}
        })),
        customProducts: customProductsWithTotals.map(product => ({ // Add this
          name: product.name,
          description: product.description || '',
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          gstPercentage: product.gstPercentage,
          gstAmount: product.gstAmount,
          total: product.total,
          category: product.category || '',
          sku: product.sku || '',
          hsnCode: product.hsnCode || '',
          isCustom: true
        })),
        preBuiltPCs: preBuiltPCsWithTotals.map(pc => ({
          pcId: pc.pcId,
          name: pc.name,
          quantity: pc.quantity,
          unitPrice: pc.unitPrice,
          gstPercentage: pc.gstPercentage,
          gstAmount: pc.gstAmount,
          total: pc.total,
          components: pc.components || []
        })),
        totals: {
          subtotal: subtotal,
          totalGst: totalGst,
          grandTotal: Math.round(grandTotal),
          discount: discount,
          shipping: shipping,
          roundOff: roundOff
        },
        payment: {
          status: paymentStatus,
          method: paymentMethod,
          paidAmount: paymentStatus === 'paid' ? Math.round(grandTotal) : 0,
          paidDate: paymentStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        },
        notes: notes || '',
        status: paymentStatus === 'paid' ? 'paid' : 'draft',
      };
  const result = await invoiceService.createInvoice(invoiceData);
      
      if (result.success) {
        toast.success('Invoice created successfully!');
        
        // Generate and download PDF
        try {
          await invoiceService.generateInvoicePDF(result.invoice._id);
          const pdfResponse = await invoiceService.downloadInvoicePDF(result.invoice._id);
          
          // Download the PDF
          const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${result.invoice.invoiceNumber}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          toast.success('PDF downloaded successfully!');
          
          // Reset form after successful creation
          setStep(1);
          setCustomerDetails({
            name: '',
            mobile: '',
            email: '',
            address: '',
            companyName: '',
            gstin: ''
          });
          setProducts([]);
          setCustomProducts([]);
          setPreBuiltPCs([]);
          setDiscount(0);
          setShipping(0);
          setNotes('');
          
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          toast.error('Invoice created but PDF generation failed');
        }
        
      } else {
        toast.error(result.message || 'Failed to create invoice');
      }
      
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create invoice. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Validate required fields
      if (!customerDetails.name.trim() || !customerDetails.mobile.trim()) {
        toast.error('Customer name and mobile are required');
        return;
      }

      if (products.length === 0 && customProducts.length === 0 && preBuiltPCs.length === 0) {
        toast.error('Add at least one product');
        return;
      }

      setIsGenerating(true);

      // Prepare data (same as handleGenerateInvoice but with draft status)
      const productsWithTotals = products.map(product => ({
        ...product,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      }));

      const customProductsWithTotals = customProducts.map(product => ({
        ...product,
        isCustom: true,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      }));

      const preBuiltPCsWithTotals = preBuiltPCs.map(pc => ({
        ...pc,
        total: pc.quantity * pc.unitPrice,
        gstAmount: (pc.quantity * pc.unitPrice) * (pc.gstPercentage / 100)
      }));

      const subtotal = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.total, 0);
      
      const totalGst = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.gstAmount, 0);

      const grandTotal = subtotal + totalGst + shipping - discount;
      const roundOff = Math.round(grandTotal) - grandTotal;

      const draftInvoiceData = {
        customer: {
          name: customerDetails.name,
          mobile: customerDetails.mobile,
          email: customerDetails.email || '',
          address: customerDetails.address || '',
          companyName: customerDetails.companyName || '',
          gstin: customerDetails.gstin || ''
        },
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        products: productsWithTotals,
        customProducts: customProductsWithTotals,
        preBuiltPCs: preBuiltPCsWithTotals,
        totals: {
          subtotal: subtotal,
          totalGst: totalGst,
          grandTotal: Math.round(grandTotal),
          discount: discount,
          shipping: shipping,
          roundOff: roundOff
        },
        payment: {
          status: 'pending',
          method: paymentMethod,
          paidAmount: 0
        },
        notes: notes || '',
        status: 'draft'
      };

      const result = await invoiceService.createInvoice(draftInvoiceData);
      
      if (result.success) {
        toast.success('Draft invoice saved successfully!');
        // Optionally reset form or redirect
      } else {
        toast.error(result.message || 'Failed to save draft');
      }
      
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Failed to save draft. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="text-gray-600 mt-2">Create customer reference invoices</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-24 h-1 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">Customer Details</span>
            <span className="text-gray-600">Products</span>
            <span className="text-gray-600">Summary</span>
            <span className="text-gray-600">Preview</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {step === 1 && (
            <CustomerDetailsForm
              data={customerDetails}
              onChange={setCustomerDetails}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <>
              {/* Pass customProducts to CategoryProductSelector */}
              <CategoryProductSelector
                products={products}
                customProducts={customProducts} // Add this
                preBuiltPCs={preBuiltPCs}
                onAddProduct={handleAddProduct}
                onAddCustomProduct={handleAddCustomProduct} // Add this
                onAddPreBuiltPC={handleAddPreBuiltPC}
                onRemoveProduct={handleRemoveProduct}
                onRemoveCustomProduct={handleRemoveCustomProduct} // Add this
                onRemovePreBuiltPC={handleRemovePreBuiltPC}
                onUpdateProduct={handleUpdateProduct}
                onUpdateCustomProduct={handleUpdateCustomProduct} // Add this
                onUpdatePreBuiltPC={handleUpdatePreBuiltPC}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
              
              {/* Add CustomProductForm component */}
              <CustomProductForm
                onAddCustomProduct={handleAddCustomProduct}
              />
            </>
          )}

          {step === 3 && (
            <InvoiceSummary
              customer={customerDetails}
              products={products}
              customProducts={customProducts}
              totals={totals}
              discount={discount}
              shipping={shipping}
              notes={notes}
              onDiscountChange={setDiscount}
              onShippingChange={setShipping}
              onNotesChange={setNotes}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

{step === 4 && (
  <InvoicePreview
    customer={customerDetails}
    products={products}
    customProducts={customProducts}
    preBuiltPCs={preBuiltPCs}
    totals={totals}
    notes={notes}
    paymentStatus={paymentStatus}
    paymentMethod={paymentMethod}
    onBack={() => setStep(3)}
    onGenerate={handleGenerateInvoice}
    onSaveDraft={handleSaveDraft}
    isGenerating={isGenerating}
    // Add these update functions:
    onUpdateProduct={handleUpdateProduct}
    onUpdateCustomProduct={handleUpdateCustomProduct}
    onUpdatePreBuiltPC={handleUpdatePreBuiltPC}
  />
)}
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;