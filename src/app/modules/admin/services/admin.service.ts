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

  getPendingSellers(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`/admin/pending-sellers`);
  }

  approveSeller(sellerId: number): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Seller approved successfully.' });
    return this.http.put<ApiResponse<string>>(`/admin/approve-seller/${sellerId}`, {}, { headers });
  }

  // داخل ملف admin.service.ts
getApprovedSellers(): Observable<ApiResponse<string>> {
  return this.http.get<ApiResponse<string>>(`/admin/approved-sellers`); 
}

   rejectSeller(sellerId: number): Observable<ApiResponse<string>> {
  console.log('Calling reject API for seller ID:', sellerId);
  return this.http.delete<ApiResponse<string>>(`/admin/reject-seller/${sellerId}`);
}
}

