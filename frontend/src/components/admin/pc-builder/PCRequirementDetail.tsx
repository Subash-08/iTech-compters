import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  Edit,
  Save,
  X,
  ShoppingBag,
  Package,
  DollarSign,
  Send,
  Download
} from 'lucide-react';
import { pcBuilderAdminService } from '../services/pcBuilderAdminService';
import { PCRequirementDocument } from '../types/pcBuilderAdmin';

const PCRequirementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<PCRequirementDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    adminNotes: '',
    estimatedTotal: 0
  });

  useEffect(() => {
    if (id) {
      loadRequirement();
    }
  }, [id]);

  const loadRequirement = async () => {
    try {
      setLoading(true);
      const response = await pcBuilderAdminService.getPCRequirement(id!);
      setRequirement(response.requirement);
      setFormData({
        status: response.requirement.status,
        adminNotes: response.requirement.adminNotes || '',
        estimatedTotal: response.requirement.estimatedTotal || 0
      });
    } catch (error) {
      console.error('Error loading requirement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      await pcBuilderAdminService.updatePCRequirement(id!, {
        status: formData.status,
        adminNotes: formData.adminNotes,
        estimatedTotal: formData.estimatedTotal
      });
      await loadRequirement();
      setEditing(false);
    } catch (error) {
      console.error('Error updating requirement:', error);
      alert('Failed to update requirement');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contacted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'quoted': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-5 h-5" />;
      case 'processing': return <AlertCircle className="w-5 h-5" />;
      case 'contacted': return <MessageSquare className="w-5 h-5" />;
      case 'quoted': return <CheckCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requirement details...</p>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Requirement not found</h3>
        <p className="text-gray-600 mb-6">The requirement you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/admin/pc-builder/requirements')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Requirements
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
            onClick={() => navigate('/admin/pc-builder/requirements')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PC Requirement Details</h1>
            <p className="text-gray-600">ID: {requirement._id}</p>
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
                    status: requirement.status,
                    adminNotes: requirement.adminNotes || '',
                    estimatedTotal: requirement.estimatedTotal || 0
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
        {/* Left Column - Customer & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="text-lg font-medium text-gray-900">{requirement.customer.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center text-gray-900">
                  <Mail className="w-4 h-4 mr-2" />
                  <a href={`mailto:${requirement.customer.email}`} className="hover:text-blue-600">
                    {requirement.customer.email}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center text-gray-900">
                  <Phone className="w-4 h-4 mr-2" />
                  <a href={`tel:${requirement.customer.phone}`} className="hover:text-blue-600">
                    {requirement.customer.phone}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Location</label>
                <div className="flex items-center text-gray-900">
                  <MapPin className="w-4 h-4 mr-2" />
                  {requirement.customer.city}
                </div>
              </div>
            </div>
            {requirement.customer.additionalNotes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{requirement.customer.additionalNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Requirements Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2" />
              PC Requirements
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <div className="text-lg font-medium text-gray-900">
                    {requirement.requirements.purpose}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <div className="flex items-center text-lg font-medium text-gray-900">
                    <IndianRupee className="w-5 h-5 mr-1" />
                    {requirement.requirements.budget}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Preference</label>
                  <div className="text-lg font-medium text-gray-900">
                    {requirement.requirements.paymentPreference}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Timeline</label>
                  <div className="text-lg font-medium text-gray-900">
                    {requirement.requirements.deliveryTimeline}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="processing">Processing</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Total (₹)</label>
                  <input
                    type="number"
                    value={formData.estimatedTotal}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTotal: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter estimated total"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(requirement.status)}`}>
                    {getStatusIcon(requirement.status)}
                    <span className="ml-1.5">
                      {requirement.status.charAt(0).toUpperCase() + requirement.status.slice(1)}
                    </span>
                  </span>
                </div>
                
                {requirement.estimatedTotal && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estimated Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{requirement.estimatedTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted</span>
                <span className="text-sm text-gray-900">{formatDate(requirement.createdAt)}</span>
              </div>
              {requirement.quotedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quoted</span>
                  <span className="text-sm text-gray-900">{formatDate(requirement.quotedAt)}</span>
                </div>
              )}
              {requirement.completedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm text-gray-900">{formatDate(requirement.completedAt)}</span>
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
                placeholder="Add notes about this requirement..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                {requirement.adminNotes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{requirement.adminNotes}</p>
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
                href={`mailto:${requirement.customer.email}?subject=Regarding your PC requirements (${requirement._id})`}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </a>
              <a
                href={`tel:${requirement.customer.phone}`}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </a>
              <button
                onClick={() => navigate(`/admin/pc-builder/quotes?search=${requirement.customer.email}`)}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                View Related Quotes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRequirementDetail;