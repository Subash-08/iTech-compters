import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Phone,
  MapPin,
  ClipboardList,
  Calendar,
  IndianRupee,
  MoreVertical,
  Eye,
  Edit,
  Mail,
  TrendingUp,
  Download
} from 'lucide-react';
import { pcBuilderAdminService } from '../services/pcBuilderAdminService';
import {
  PCRequirementDocument,
  PCRequirementStats
} from '../types/pcBuilderAdmin';
import StatusBadge from '../common/StatusBadge';
import Pagination from '../common/Pagination';

const PCRequirementsList: React.FC = () => {
  const [requirements, setRequirements] = useState<PCRequirementDocument[]>([]);
  const [stats, setStats] = useState<PCRequirementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadRequirements();
    loadStats();
  }, [filters]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await pcBuilderAdminService.getPCRequirements(filters);
      setRequirements(response.requirements || []);
      setPagination(response.pagination || {
        total: response.total || 0,
        pages: response.pages || 1,
        currentPage: filters.page
      });
    } catch (error) {
      console.error('Error loading requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await pcBuilderAdminService.getPCRequirementsStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? '' : status,
      page: 1
    }));
    setStatusFilter(status);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'quoted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'contacted': return <MessageSquare className="w-4 h-4" />;
      case 'quoted': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PC Requirements</h1>
          <p className="text-gray-600 mt-1">Manage customer PC requirement submissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requirements</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12% from last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Requirements</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.new}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full" 
                  style={{ width: `${(stats.new / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.conversionRate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {Math.round((parseFloat(stats.conversionRate) / 100) * stats.total)} converted to quotes
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{stats.byStatus.find(s => s.status === 'completed')?.avgBudget?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Average completed requirement value</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, city..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All ({stats?.total || 0})
            </button>
            {stats?.byStatus.map((stat) => (
              <button
                key={stat.status}
                onClick={() => handleStatusChange(stat.status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === stat.status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {stat.status.charAt(0).toUpperCase() + stat.status.slice(1)} ({stat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading requirements...</p>
          </div>
        ) : requirements.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
            <p className="text-gray-600">No PC requirements match your current filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requirements.map((requirement) => (
                    <tr key={requirement._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {requirement.customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {requirement.customer.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {requirement.customer.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {requirement.customer.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Purpose:</span>
                            <span className="text-sm text-gray-900 ml-2">{requirement.requirements.purpose}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Budget:</span>
                            <span className="text-sm text-gray-900 ml-2">{requirement.requirements.budget}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Timeline:</span>
                            <span className="text-sm text-gray-900 ml-2">{requirement.requirements.deliveryTimeline}</span>
                          </div>
                          {requirement.customer.city && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {requirement.customer.city}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requirement.status)}`}>
                            {getStatusIcon(requirement.status)}
                            <span className="ml-1.5">
                              {requirement.status.charAt(0).toUpperCase() + requirement.status.slice(1)}
                            </span>
                          </span>
                          {requirement.assignedTo && (
                            <div className="ml-3 text-xs text-gray-500">
                              Assigned to {requirement.assignedTo.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(requirement.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(requirement.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/pc-builder/requirements/${requirement._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </Link>
                          <Link
                            to={`mailto:${requirement.customer.email}`}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-blue-700 hover:bg-blue-50"
                          >
                            <Mail className="w-4 h-4 mr-1.5" />
                            Email
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PCRequirementsList;