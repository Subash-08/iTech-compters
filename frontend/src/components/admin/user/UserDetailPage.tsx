// src/components/admin/user/UserDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailedUser } from '../types/user';
import { userService } from '../services/userService';
import StatusBadge from '../common/StatusBadge';
import { format } from 'date-fns';

// Import Lucide icons
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Phone, 
  Home, 
  Building,
  User as UserIcon,
  Calendar,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Heart,
  CreditCard,
  ArrowRight
} from 'lucide-react';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<DetailedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUserDetails(id!);
      setUser(response.user);
    } catch (err) {
      setError('Failed to fetch user details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

const getOrderStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">User Not Found</h3>
          <p className="mt-2 text-gray-600">{error || 'The user you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">Complete profile information for {user.firstName} {user.lastName}</p>
            </div>
            <div className="flex space-x-3">
              <StatusBadge status={user.status} />
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="mt-1 text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="mt-1 text-gray-900">{user.lastName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="mt-1 text-gray-900">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Verified</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.emailVerified ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member Since
                  </label>
                  <p className="mt-1 text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Social Logins Card */}
            {user.socialLogins.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Logins</h2>
                <div className="space-y-3">
                  {user.socialLogins.map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">G</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{login.displayName}</p>
                          <p className="text-sm text-gray-500">Connected {formatDate(login.connectedAt)}</p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

// In UserDetailPage.tsx - Update the orders section
{/* Orders Card */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
      <Package className="w-5 h-5 mr-2" />
      Recent Orders
    </h2>
    <div className="text-right">
      <span className="text-sm text-gray-500">{user.orderStats.total} total orders</span>
      <p className="text-xs text-gray-400">Showing recent {user.recentOrders.length} orders</p>
    </div>
  </div>

  {/* Order Statistics */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="text-center p-3 bg-blue-50 rounded-lg">
      <p className="text-2xl font-bold text-blue-600">{user.orderStats.total}</p>
      <p className="text-sm text-blue-600">Total</p>
    </div>
    <div className="text-center p-3 bg-green-50 rounded-lg">
      <p className="text-2xl font-bold text-green-600">{user.orderStats.completed}</p>
      <p className="text-sm text-green-600">Completed</p>
    </div>
    <div className="text-center p-3 bg-yellow-50 rounded-lg">
      <p className="text-2xl font-bold text-yellow-600">{user.orderStats.pending}</p>
      <p className="text-sm text-yellow-600">Pending</p>
    </div>
    <div className="text-center p-3 bg-red-50 rounded-lg">
      <p className="text-2xl font-bold text-red-600">{user.orderStats.cancelled}</p>
      <p className="text-sm text-red-600">Cancelled</p>
    </div>
  </div>

  {/* Total Spent */}
  <div className="bg-gray-50 rounded-lg p-4 mb-6">
    <div className="flex justify-between items-center">
      <span className="text-gray-700 font-medium">Total Amount Spent</span>
      <span className="text-2xl font-bold text-green-600">₹{user.orderStats.totalSpent.toLocaleString()}</span>
    </div>
  </div>

  {/* Recent Orders List */}
  {user.recentOrders.length > 0 ? (
    <div className="space-y-3">
      {user.recentOrders.map((order) => (
        <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-medium text-gray-900">#{order.orderNumber}</p>
            <p className="text-sm text-gray-500">
              {order.items?.length || 0} items • ₹{order.pricing?.total || order.totalAmount}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-block px-2 py-1 text-xs rounded ${getOrderStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                order.paymentStatus === 'captured' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.paymentStatus === 'captured' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            {order.pricing?.discount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Saved ₹{order.pricing.discount}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8">
      <Package className="w-12 h-12 text-gray-400 mx-auto" />
      <p className="mt-2 text-gray-500">No orders found</p>
    </div>
  )}
</div>
          </div>

          {/* Right Column - Addresses & Summary */}
          <div className="space-y-6">
            {/* Addresses Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Addresses ({user.addresses.length})
              </h2>
              {user.addresses.length > 0 ? (
                <div className="space-y-4">
                  {user.addresses.map((address) => (
                    <div 
                      key={address._id} 
                      className={`p-4 border rounded-lg ${
                        address._id === user.defaultAddressId 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      {address._id === user.defaultAddressId && (
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {address.firstName} {address.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.addressLine1}
                            {address.addressLine2 && <>, {address.addressLine2}</>}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-gray-600">{address.country}</p>
                          <div className="mt-2 text-sm text-gray-500 space-y-1">
                            <p className="flex items-center">
                              <Phone className="w-3 h-3 mr-2" />
                              {address.phone}
                            </p>
                            <p className="flex items-center">
                              <Mail className="w-3 h-3 mr-2" />
                              {address.email}
                            </p>
                            <p className="flex items-center capitalize">
                              {getAddressIcon(address.type)}
                              <span className="ml-2">{address.type} address</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No addresses saved</p>
                </div>
              )}
            </div>

            {/* Account Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Total Orders
                  </span>
                  <span className="font-medium">{user.orderStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Total Spent
                  </span>
                  <span className="font-medium">₹{user.orderStats.totalSpent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart
                  </span>
                  <span className="font-medium">{user.cartId ? 'Active' : 'No cart'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Wishlist
                  </span>
                  <span className="font-medium">{user.wishlistId ? 'Active' : 'No wishlist'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Social Login</span>
                  <span className="font-medium">{user.isGoogleUser ? 'Google' : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;