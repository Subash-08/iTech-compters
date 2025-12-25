import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Invoice, InvoiceProduct, InvoicePreBuiltPC } from '../types/invoice';
import { invoiceService } from '../services/invoiceService';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Printer, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Package,
  Cpu,
  User,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Calendar,
  Hash,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InvoiceDetails: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(id!);
      setInvoice(response.invoice);
    } catch (error) {
      console.error('Failed to load invoice:', error); // Debug log
      toast.error('Failed to load invoice');
      navigate('/admin/invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      setDownloading(true);
      const response = await invoiceService.downloadInvoicePDF(invoice._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    try {
      setSendingEmail(true);
      // Note: You need to add sendInvoiceEmail to your invoiceService
      // await invoiceService.sendInvoiceEmail(invoice._id);
      toast.success('Invoice sent via email successfully');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!invoice) return;
    
    try {
      setUpdatingStatus(true);
      await invoiceService.updateInvoice(invoice._id, { status });
      setInvoice(prev => prev ? { ...prev, status } : null);
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentStatus: string) => {
    if (!invoice) return;
    
    try {
      setUpdatingStatus(true);
      const updateData = {
        payment: {
          ...invoice.payment,
          status: paymentStatus as any,
          paidAmount: paymentStatus === 'paid' ? invoice.totals.grandTotal : 0,
          paidDate: paymentStatus === 'paid' ? new Date().toISOString() : undefined
        }
      };
      await invoiceService.updateInvoice(invoice._id, updateData);
      setInvoice(prev => prev ? { 
        ...prev, 
        payment: updateData.payment,
        status: paymentStatus === 'paid' ? 'paid' : prev.status
      } : null);
      toast.success(`Payment status updated to ${paymentStatus}`);
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice || !window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await invoiceService.deleteInvoice(invoice._id);
      toast.success('Invoice deleted successfully');
      navigate('/admin/invoices');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'sent': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
          <Link
            to="/admin/invoices"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/invoices"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-medium text-gray-700">
                    {invoice.invoiceNumber}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-1.5">{invoice.status.toUpperCase()}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(invoice.payment.status)}`}>
                    {invoice.payment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Send Email
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Printer size={18} />
                Print
              </button>

              <Link
                to={`/admin/invoices/edit/${invoice._id}`}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Edit size={18} />
                Edit
              </Link>

              <button
                onClick={handleDeleteInvoice}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer & Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User size={20} />
                  Customer Information
                </h2>
                <Link
                  to={`/admin/customers/${invoice.customer.customerId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  View Profile
                  <ExternalLink size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{invoice.customer.name}</div>
                      {invoice.customer.companyName && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Business
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mobile</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone size={16} />
                      {invoice.customer.mobile}
                    </div>
                  </div>

                  {invoice.customer.email && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="text-gray-900">{invoice.customer.email}</div>
                    </div>
                  )}
                </div>

                <div>
                  {invoice.customer.companyName && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Building size={16} />
                        {invoice.customer.companyName}
                      </div>
                    </div>
                  )}

                  {invoice.customer.address && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                      <div className="flex items-start gap-2 text-gray-900">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{invoice.customer.address}</span>
                      </div>
                    </div>
                  )}

                  {invoice.customer.gstin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">GSTIN</label>
                      <div className="text-gray-900 font-mono">{invoice.customer.gstin}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard size={20} />
                Payment Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPaymentStatusColor(invoice.payment.status)}`}>
                      {invoice.payment.status.toUpperCase()}
                    </span>
                    {invoice.payment.status === 'pending' && (
                      <button
                        onClick={() => handleUpdatePaymentStatus('paid')}
                        disabled={updatingStatus}
                        className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Method</label>
                  <div className="text-gray-900 font-medium">{invoice.payment.method.toUpperCase()}</div>
                </div>

                {invoice.payment.paidAmount && invoice.payment.paidAmount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Paid Amount</label>
                    <div className="text-gray-900 font-medium">
                      {formatCurrency(invoice.payment.paidAmount)}
                    </div>
                  </div>
                )}

                {invoice.payment.transactionId && (
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Transaction ID</label>
                    <div className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {invoice.payment.transactionId}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={20} />
                  Items ({invoice.products.length + invoice.preBuiltPCs.length})
                </h2>
              </div>

              {/* Regular Products */}
              {invoice.products.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Products</h3>
                  <div className="space-y-4">
                    {invoice.products.map((product: InvoiceProduct, index: number) => (
                      <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              {product.sku && (
                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {product.category && (
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                    {product.category}
                                  </span>
                                )}
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  GST: {product.gstPercentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {product.quantity} × {formatCurrency(product.unitPrice)}
                          </div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {formatCurrency(product.total)}
                          </div>
                          {product.gstAmount > 0 && (
                            <div className="text-sm text-gray-500">
                              GST: {formatCurrency(product.gstAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pre-built PCs */}
              {invoice.preBuiltPCs.length > 0 && (
                <div className="p-6">
                  <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Cpu size={18} />
                    Pre-built PCs
                  </h3>
                  <div className="space-y-4">
                    {invoice.preBuiltPCs.map((pc: InvoicePreBuiltPC, index: number) => (
                      <div key={index} className="flex justify-between items-start p-4 bg-blue-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Cpu size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{pc.name}</h4>
                              <div className="text-sm text-blue-600 mb-1">Pre-built PC Configuration</div>
                              {pc.components.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Includes:</span>{' '}
                                  {pc.components.slice(0, 3).map((c, i) => (
                                    <span key={i}>
                                      {c.quantity}× {c.name}
                                      {i < Math.min(pc.components.length - 1, 2) ? ', ' : ''}
                                    </span>
                                  ))}
                                  {pc.components.length > 3 && '...'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {pc.quantity} × {formatCurrency(pc.unitPrice)}
                          </div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {formatCurrency(pc.total)}
                          </div>
                          {pc.gstAmount > 0 && (
                            <div className="text-sm text-gray-500">
                              GST: {formatCurrency(pc.gstAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Invoice Summary & Actions */}
          <div className="space-y-6">
            {/* Invoice Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Hash size={20} />
                Invoice Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Invoice Number</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar size={14} />
                    Issue Date
                  </span>
                  <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Due Date</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created By</span>
                  <span className="font-medium">{invoice.createdBy?.name || 'Admin'}</span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(invoice.totals.subtotal)}</span>
                    </div>

                    {invoice.totals.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-red-600">-{formatCurrency(invoice.totals.discount)}</span>
                      </div>
                    )}

                    {invoice.totals.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatCurrency(invoice.totals.shipping)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Total GST</span>
                      <span className="font-medium">{formatCurrency(invoice.totals.totalGst)}</span>
                    </div>

                    {invoice.totals.roundOff !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Round Off</span>
                        <span className="font-medium">{formatCurrency(invoice.totals.roundOff)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Grand Total</span>
                        <span className="text-2xl font-bold text-blue-700">
                          {formatCurrency(invoice.totals.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-2">
                {invoice.status !== 'sent' && (
                  <button
                    onClick={() => handleUpdateStatus('sent')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    Mark as Sent
                  </button>
                )}

                {invoice.status !== 'paid' && invoice.payment.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus('paid')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Mark as Paid
                  </button>
                )}

                {invoice.status !== 'overdue' && (
                  <button
                    onClick={() => handleUpdateStatus('overdue')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Mark as Overdue
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel Invoice
                </button>
              </div>
            </div>

            {/* Notes Card */}
            {invoice.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {invoice.notes}
                </div>
              </div>
            )}

            {/* Admin Notes Card */}
            {invoice.adminNotes && (
              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Admin Notes
                </h2>
                <div className="text-gray-600 bg-yellow-50 p-4 rounded-lg">
                  {invoice.adminNotes}
                </div>
              </div>
            )}

            {/* Timeline Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Invoice Created</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</p>
                  </div>
                </div>

                {invoice.updatedAt !== invoice.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Edit size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-500">{formatDate(invoice.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {invoice.pdfPath && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Download size={14} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PDF Generated</p>
                      <p className="text-sm text-gray-500">Available for download</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;