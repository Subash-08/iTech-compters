import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Edit,
  Save,
  X,
  Package,
  ShoppingBag,
  Send,
  Download,
  User,
  Trash2,
  UserCircle // Added UserCircle as alternative to User
} from 'lucide-react';
import { pcBuilderAdminService } from '../services/pcBuilderAdminService';
import { PCQuoteDocument } from '../types/pcBuilderAdmin';

const PCQuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<PCQuoteDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    adminNotes: '',
    assignedTo: ''
  });

  useEffect(() => {
    if (id) {
      loadQuote();
    }
  }, [id]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const response = await pcBuilderAdminService.getPCQuote(id!);
      setQuote(response.quote);
      setFormData({
        status: response.quote.status,
        adminNotes: response.quote.adminNotes || '',
        assignedTo: response.quote.assignedTo?._id || ''
      });
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      await pcBuilderAdminService.updateQuoteStatus(id!, {
        status: formData.status,
        adminNotes: formData.adminNotes
      });
      await loadQuote();
      setEditing(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Failed to update quote');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await pcBuilderAdminService.deleteQuote(id!);
      alert('Quote deleted successfully');
      navigate('/admin/pc-builder/quotes');
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'quoted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <MessageSquare className="w-5 h-5" />;
      case 'contacted': return <MessageSquare className="w-5 h-5" />;
      case 'quoted': return <AlertCircle className="w-5 h-5" />;
      case 'accepted': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
        <p className="text-gray-600 mb-6">The quote you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/admin/pc-builder/quotes')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/pc-builder/quotes')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PC Quote Details</h1>
            <p className="text-gray-600">Quote ID: {quote._id}</p>
            <p className="text-sm text-gray-500">Created: {formatDate(quote.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    status: quote.status,
                    adminNotes: quote.adminNotes || '',
                    assignedTo: quote.assignedTo?._id || ''
                  });
                }}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Components */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCircle className="w-5 h-5 mr-2" /> {/* Changed from User to UserCircle */}
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="text-lg font-medium text-gray-900">{quote.customer.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center text-gray-900">
                  <Mail className="w-4 h-4 mr-2" />
                  <a href={`mailto:${quote.customer.email}`} className="hover:text-blue-600">
                    {quote.customer.email}
                  </a>
                </div>
              </div>
              {quote.customer.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center text-gray-900">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${quote.customer.phone}`} className="hover:text-blue-600">
                      {quote.customer.phone}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(quote.createdAt)}
                </div>
              </div>
            </div>
            {quote.customer.notes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.customer.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Components Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Selected Components
            </h2>
            <div className="space-y-4">
              {quote.components
                .filter(component => component.selected)
                .map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mr-4">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{component.productName}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {component.category.replace(/-/g, ' ')}
                        </div>
                        {component.userNote && (
                          <div className="text-xs text-gray-600 mt-1">
                            Note: {component.userNote}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(component.productPrice)}
                    </div>
                  </div>
                ))}
              
              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-lg font-semibold text-gray-900">Total Estimated Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(quote.totalEstimated)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Status</h2>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add notes about this quote..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)}
                    <span className="ml-1.5">
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quote Value</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(quote.totalEstimated)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Components</span>
                  <span className="text-sm font-medium text-gray-900">
                    {quote.components.filter(c => c.selected).length} selected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Card (Replaces Expiry Card) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(quote.createdAt)}
                </span>
              </div>
              
              {quote.contactedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contacted</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(quote.contactedAt)}
                  </span>
                </div>
              )}
              
              {quote.quotedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quoted</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(quote.quotedAt)}
                  </span>
                </div>
              )}
              
              {quote.respondedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Responded</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(quote.respondedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h2>
            {editing ? (
              <textarea
                value={formData.adminNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about this quote..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                {quote.adminNotes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.adminNotes}</p>
                ) : (
                  <p className="text-gray-500 italic">No notes added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href={`mailto:${quote.customer.email}?subject=Regarding your PC quote (${quote._id})`}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </a>
              {quote.customer.phone && (
                <a
                  href={`tel:${quote.customer.phone}`}
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Customer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quote? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PCQuoteDetail;