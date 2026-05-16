export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  address?: string | null;
  role?: string | null;
  isDeleted: boolean;
  createdAt: string;
  isBlocked: boolean;
  isSellerApproved: boolean;
  storeName?: string | null;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
}

export interface RecentOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  date: string;
}

export type ManagedRole = 'Admin' | 'Seller' | 'User';

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
}
