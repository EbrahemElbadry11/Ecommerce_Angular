import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminDashboardStats, AdminUser, ApiResponse, ManagedRole } from '../models/user-admin.model';

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

  changeRole(id: string, role: ManagedRole): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'User role changed successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/change-role/${id}`, { role }, { headers });
  }

  approveSeller(sellerId: number): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Seller approved successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/approve-seller/${sellerId}`, {}, { headers });
  }
}
