export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
}

export interface UpdateUserRoleData {
  role: 'user' | 'admin';
}

export interface UpdateUserStatusData {
  status: 'active' | 'inactive';
  deactivationReason?: string;
}