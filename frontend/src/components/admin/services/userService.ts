import api from '../../config/axiosConfig';
import { 
  User, 
  UserFilters, 
  UserFormData, 
  UpdateUserRoleData, 
  UpdateUserStatusData,
  DetailedUser 
} from '../types/user';

export const userService = {
  // Get all users (admin only)
  async getUsers(filters: UserFilters = { search: '', role: '', status: '', page: 1, limit: 10 }) {
    const response = await api.get('/users', { params: filters });
    return response.data;
  },

  // Get single user by ID (basic info)
  async getUser(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // ✅ ADDED: Get detailed user information with addresses, orders, etc.
  async getUserDetails(id: string): Promise<{ user: DetailedUser }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user role
  async updateUserRole(id: string, roleData: UpdateUserRoleData) {
    const response = await api.put(`/users/${id}/role`, roleData);
    return response.data;
  },

  // Update user status
  async updateUserStatus(id: string, statusData: UpdateUserStatusData) {
    const response = await api.put(`/users/${id}/status`, statusData);
    return response.data;
  },
};