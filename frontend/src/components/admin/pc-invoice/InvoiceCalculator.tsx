import React, { useState, useMemo } from 'react';
import PDFGenerator from './PDFGenerator';
import { ProductItem, InvoiceDetails } from './types';

// Product categories (Icons removed from data, handled via component)
const PRODUCT_CATEGORIES = [
  { id: 'processor', label: 'Processor' },
  { id: 'motherboard', label: 'Motherboard' },
  { id: 'ram', label: 'RAM' },
  { id: 'gpu', label: 'GPU' },
  { id: 'ssd', label: 'SSD' },
  { id: 'hdd', label: 'HDD' },
  { id: 'cooler', label: 'Cooler' },
  { id: 'smps', label: 'SMPS' },
  { id: 'cabinet', label: 'Cabinet' },
  { id: 'printer', label: 'Printer' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'keyboard_mouse', label: 'Keyboard & Mouse' },
  { id: 'ups', label: 'UPS' },
  { id: 'speaker', label: 'Speaker' },
  { id: 'gaming_pad', label: 'Gaming Pad' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'wifi_dongle', label: 'Wi-Fi Dongle' },
  { id: 'cpu_fan', label: 'CPU Fan' },
  { id: 'external_hdd', label: 'External HDD' },
  { id: 'antivirus', label: 'Antivirus' },
  { id: 'os', label: 'Operating System' },
];

// Helper component for Professional SVG Icons
const CategoryIcon = ({ id }: { id: string }) => {
  const iconClass = "w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors";
  
  switch (id) {
    case 'processor': return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
    case 'motherboard': return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
    case 'ram': return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
    case 'monitor': return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'gpu': return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    default: return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  }
};

// Utility functions
const generateInvoiceNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `INV-${timestamp.toString().slice(-6)}${random}`;
};

const formatCurrency = (amount: number): string => {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const calculateTotals = (products: ProductItem[]) => {
  const subtotal = products.reduce((sum, product) => 
    sum + (product.price * product.quantity), 0
  );
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    grandTotal: parseFloat(subtotal.toFixed(2))
  };
};

const InvoiceCalculator: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customProduct, setCustomProduct] = useState({
    label: '',
    name: '',
    price: '',
    quantity: '1'
  });
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    invoiceNo: generateInvoiceNumber(),
    date: new Date().toLocaleDateString('en-US'),
    status: 'Generated',
    customerName: '',
    customerMobile: ''
  });

  // State for each component's input fields
  const [componentInputs, setComponentInputs] = useState(
    PRODUCT_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = {
        name: category.label,
        price: '',
        quantity: '1'
      };
      return acc;
    }, {} as Record<string, { name: string; price: string; quantity: string }>)
  );

  const { subtotal, grandTotal } = useMemo(() => calculateTotals(products), [products]);

  const updateComponentInput = (categoryId: string, field: string, value: string) => {
    setComponentInputs(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value }
    }));
  };

  const addProductFromComponent = (categoryId: string) => {
    const inputs = componentInputs[categoryId];
    const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
    
    if (!category) return;
    if (!inputs.name.trim()) return alert(`Please enter product name for ${category.label}`);
    
    const priceNum = parseFloat(inputs.price);
    if (isNaN(priceNum) || priceNum < 0) return alert(`Please enter a valid price for ${category.label}`);

    const quantityNum = parseInt(inputs.quantity) || 1;
    if (quantityNum < 1) return alert(`Quantity must be at least 1`);

    const newProduct: ProductItem = {
      id: `${Date.now()}-${Math.random()}`,
      category: category.label,
      name: inputs.name.trim(),
      price: priceNum,
      quantity: quantityNum
    };

    setProducts(prev => [...prev, newProduct]);
    setComponentInputs(prev => ({
      ...prev,
      [categoryId]: { name: category.label, price: '', quantity: '1' }
    }));
  };

  const addCustomProduct = () => {
    if (!customProduct.label.trim() || !customProduct.name.trim()) return alert('Please enter label and name');
    
    const priceNum = parseFloat(customProduct.price);
    if (isNaN(priceNum) || priceNum < 0) return alert('Please enter a valid price');

    const quantityNum = parseInt(customProduct.quantity) || 1;
    
    const newProduct: ProductItem = {
      id: `${Date.now()}-${Math.random()}`,
      category: 'Custom',
      name: `${customProduct.label}: ${customProduct.name}`,
      price: priceNum,
      quantity: quantityNum
    };

    setProducts(prev => [...prev, newProduct]);
    setCustomProduct({ label: '', name: '', price: '', quantity: '1' });
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string | number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        if (field === 'price' && (typeof value === 'number' && value < 0)) return p;
        if (field === 'quantity' && (typeof value === 'number' && (value < 1 || value > 1000))) return p;
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const resetForm = () => {
    if (products.length > 0 && !window.confirm('Clear all items and start new invoice?')) return;
    
    setProducts([]);
    setCustomProduct({ label: '', name: '', price: '', quantity: '1' });
    setInvoiceDetails({
      invoiceNo: generateInvoiceNumber(),
      date: new Date().toLocaleDateString('en-US'),
      status: 'Generated',
      customerName: '',
      customerMobile: ''
    });
    
    setComponentInputs(PRODUCT_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = { name: category.label, price: '', quantity: '1' };
      return acc;
    }, {} as Record<string, { name: string; price: string; quantity: string }>));
  };

  const getProductByCategory = (categoryLabel: string) => products.find(p => p.category === categoryLabel);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">iTech Computers</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Professional Computer Solutions
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-6 text-sm">
             <div className="flex flex-col items-end">
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Invoice No</span>
                <span className="font-mono text-slate-700 font-semibold">{invoiceDetails.invoiceNo}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Date</span>
                <span className="text-slate-700 font-semibold">{invoiceDetails.date}</span>
             </div>
          </div>
        </header>

        {/* Customer Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={invoiceDetails.customerName}
                onChange={(e) => setInvoiceDetails(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={invoiceDetails.customerMobile}
                onChange={(e) => setInvoiceDetails(prev => ({ ...prev, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input Area */}
          <div className="xl:col-span-7 space-y-8">
            
            {/* Component Selection Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Select Components
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                   {PRODUCT_CATEGORIES.length} Categories
                </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRODUCT_CATEGORIES.map((category) => {
                  const existingProduct = getProductByCategory(category.label);
                  const inputs = componentInputs[category.id];
                  
                  return (
                    <div 
                      key={category.id} 
                      className={`group relative rounded-xl border transition-all duration-200 p-4 ${
                        existingProduct 
                          ? 'bg-emerald-50/30 border-emerald-200 ring-1 ring-emerald-500/20' 
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon id={category.id} />
                          <h3 className={`font-semibold text-sm ${existingProduct ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {category.label}
                          </h3>
                        </div>
                        {existingProduct && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Added
                          </span>
                        )}
                      </div>
                      
                      {existingProduct ? (
                         // Edit Mode (Compact)
                         <div className="flex items-center justify-between bg-white/50 rounded-lg p-2 border border-emerald-100">
                            <div className="flex flex-col">
                               <span className="text-xs font-medium text-slate-900 truncate max-w-[120px]">{existingProduct.name}</span>
                               <span className="text-xs text-slate-500">{formatCurrency(existingProduct.price)} x {existingProduct.quantity}</span>
                            </div>
                            <button
                              onClick={() => removeProduct(existingProduct.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                         </div>
                      ) : (
                        // Input Mode
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={inputs.name}
                            onChange={(e) => updateComponentInput(category.id, 'name', e.target.value)}
                            placeholder="Model Name"
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder:text-slate-400"
                          />
                          <div className="flex gap-2">
                             <div className="relative flex-1">
                                <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  value={inputs.price}
                                  onChange={(e) => updateComponentInput(category.id, 'price', e.target.value)}
                                  placeholder="Price"
                                  className="w-full pl-5 pr-2 py-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <input
                                type="number"
                                min="1"
                                value={inputs.quantity}
                                onChange={(e) => updateComponentInput(category.id, 'quantity', e.target.value)}
                                className="w-14 px-1 py-1.5 text-center text-sm border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                             <button
                                onClick={() => addProductFromComponent(category.id)}
                                disabled={!inputs.price}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
                             >
                                Add
                             </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Product Add (Collapsed look) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Add Custom Item
              </h2>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                 <div className="flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Label</label>
                    <input type="text" value={customProduct.label} onChange={e => setCustomProduct(p => ({...p, label: e.target.value}))} placeholder="Category" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                 </div>
                 <div className="flex-[2] w-full">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Product Name</label>
                    <input type="text" value={customProduct.name} onChange={e => setCustomProduct(p => ({...p, name: e.target.value}))} placeholder="Item description" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                 </div>
                 <div className="w-24">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Price</label>
                    <input type="number" value={customProduct.price} onChange={e => setCustomProduct(p => ({...p, price: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                 </div>
                 <div className="w-16">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Qty</label>
                    <input type="number" value={customProduct.quantity} onChange={e => setCustomProduct(p => ({...p, quantity: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                 </div>
                 <button onClick={addCustomProduct} disabled={!customProduct.label || !customProduct.price} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Add</button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Invoice Preview */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden sticky top-6">
               <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Invoice Summary
                  </h2>
                  <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">{products.length} Items</span>
               </div>

               <div className="max-h-[500px] overflow-y-auto p-0">
                 {products.length === 0 ? (
                    <div className="text-center py-16 px-6">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                       </div>
                       <p className="text-slate-500 font-medium">Your cart is empty</p>
                       <p className="text-slate-400 text-sm mt-1">Select components from the left to start</p>
                    </div>
                 ) : (
                   <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 sticky top-0">
                         <tr>
                            <th className="px-4 py-3 font-medium">Item</th>
                            <th className="px-4 py-3 font-medium text-center">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Price</th>
                            <th className="px-4 py-3 w-8"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50/50 group">
                               <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800">{product.name}</div>
                                  <div className="text-xs text-slate-500">{product.category}</div>
                               </td>
                               <td className="px-4 py-3 text-center">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={product.quantity} 
                                    onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value)||1)} 
                                    className="w-12 text-center border border-transparent hover:border-slate-200 rounded bg-transparent focus:bg-white focus:border-indigo-500 outline-none p-1"
                                  />
                               </td>
                               <td className="px-4 py-3 text-right font-medium text-slate-700">
                                  {formatCurrency(product.price * product.quantity)}
                               </td>
                               <td className="px-4 py-3 text-right">
                                  <button onClick={() => removeProduct(product.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                 )}
               </div>

               {/* Total Section */}
               <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-3">
                  <div className="flex justify-between text-slate-600">
                     <span>Subtotal</span>
                     <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                     <span className="text-lg font-bold text-slate-900">Grand Total</span>
                     <span className="text-2xl font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 pt-2">
                     <button onClick={resetForm} className="px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-rose-600 transition-colors">
                        Clear Cart
                     </button>
                     {/* Pass PDF generator functionality here */}
                     <div className="w-full">
                        <PDFGenerator
                          products={products}
                          invoiceDetails={invoiceDetails}
                          subtotal={subtotal}
                          grandTotal={grandTotal}
                          disabled={products.length === 0}
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceCalculator;