import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDashboardStats, AdminUser, ApiResponse, ManagedRole } from '../models/user-admin.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
  }

  getUsers(): Observable<ApiResponse<AdminUser[]>> {
    return this.http.get<ApiResponse<AdminUser[]>>('/admin/users');
  }

  getUserById(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.get<ApiResponse<AdminUser>>(`/admin/users/${id}`);
  }

  blockUser(id: string): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'User blocked successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/block-user/${id}`, {}, { headers });
  }

  unblockUser(id: string): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'User unblocked successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/unblock-user/${id}`, {}, { headers });
  }

  deleteUser(id: string): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'User deleted successfully.' });
    return this.http.delete<ApiResponse<string>>(`/admin/delete-user/${id}`, { headers });
  }

  changeRole(id: string, role: string): Observable<ApiResponse<string>> {
  const headers = new HttpHeaders({ 
    'Content-Type': 'application/json'
  });
  
  const body = { role: role };
  console.log('Sending request:', {
    url: `/Admin/change-role/${id}`,
    body: body
  });
  return this.http.put<ApiResponse<string>>(
    `/Admin/change-role/${id}`, 
    body, 
    { headers }
  );
}

  getPendingSellers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`/admin/pending-sellers`);
  }

  approveSeller(sellerId: number): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Seller approved successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/approve-seller/${sellerId}`, {}, { headers });
  }

  getApprovedSellers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`/admin/approved-sellers`); 
  }

  rejectSeller(sellerId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`/admin/reject-seller/${sellerId}`);
  }

  getOrderStatus(orderId: number): Observable<ApiResponse<{ status: string }>> {
    return this.http.get<ApiResponse<{ status: string }>>(`/orders/${orderId}/status`);
  }

 updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<string>> {
  return this.http.put<ApiResponse<string>>(`/Order/${orderId}/status`, { status });
}

  bulkUpdateOrderStatus(orderIds: number[], status: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`/orders/bulk-status`, { orderIds, status });
  }

  getOrders(page: number = 1, pageSize: number = 5, status?: string): Observable<ApiResponse<any>> {
  let url = `/orders?page=${page}&pageSize=${pageSize}`;
  if (status) { url += `&status=${status}`; }
  return this.http.get<ApiResponse<any>>(url);
}

getAllOrders(): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(`/orders?page=1&pageSize=1000`);
}
getOrderById(id: number): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(`/Order/${id}`);
}
}