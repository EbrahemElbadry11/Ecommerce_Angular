import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { AdminUser } from '../../../models/user-admin.model';
import { SlicePipe } from '@angular/common';
import { ToastService } from '../../...../../../../../../services/toast';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-seller-approval',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, SlicePipe],
  templateUrl: './seller-approval.html',
  styleUrls: ['./seller-approval.css']
})
export class SellerApprovalComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  // State
  readonly message = signal<string | null>(null);
  readonly pendingSellers = signal<AdminUser[]>([]);
  readonly approvedSellers = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly actionLoading = signal<number | null>(null); 
  readonly activeTab = signal<'pending' | 'approved'>('pending');
  readonly alertMessage = signal<string | null>(null);
  readonly alertType = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  readonly searchTerm = signal('');

  readonly filteredPendingSellers = computed(() => {
    let filtered = this.pendingSellers();
    const search = this.searchTerm().toLowerCase();
    
    if (search) {
      filtered = filtered.filter(seller =>
        seller.fullName.toLowerCase().includes(search) ||
        seller.email.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  });

 ngOnInit(): void {
    this.loadPendingSellers();
    this.loadApprovedSellers(); 
      this.cd.markForCheck(); 
  }

  loadApprovedSellers(): void {
    this.adminService.getApprovedSellers() 
      .subscribe({
        next: (response: any) => {
          let sellersArray = this.extractDataArray(response);
          this.approvedSellers.set(this.mapToAdminUsers(sellersArray));
        },
        error: (error) => console.error('Error loading approved sellers:', error)
      });
  }

  private extractDataArray(response: any): any[] {
    if (response.isSuccess && response.data) return response.data;
    if (Array.isArray(response)) return response;
    if (response.$values) return response.$values;
    return response || [];
  }

  loadPendingSellers(): void {
    this.loading.set(true);
    
    this.adminService.getPendingSellers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: any) => {
          
          let sellersArray = [];
          
          if (response.isSuccess && response.data) {
            sellersArray = response.data;
          } else if (Array.isArray(response)) {
            sellersArray = response;
          } else if (response.$values) {
            sellersArray = response.$values;
          } else {
            sellersArray = response;
          }
          this.cd.markForCheck();
          
          // Filter pending vs approved sellers
          const pending = sellersArray.filter((seller: any) => 
            seller.isApproved === false
          );
          
          const approved = sellersArray.filter((seller: any) => 
            seller.isApproved === true
          );
          
          // Map to AdminUser model
          this.pendingSellers.set(this.mapToAdminUsers(pending));
          this.approvedSellers.set(this.mapToAdminUsers(approved));
          
        },
        error: (error: any) => {
          console.error('❌ Error loading sellers:', error);
          this.handleApiError(error);
        }
      });
  }

  private mapToAdminUsers(sellers: any[]): AdminUser[] {
    const mappedUsers: AdminUser[] = [];
    
    if (sellers && sellers.length > 0) {
      for (const seller of sellers) {
        const user: AdminUser = {
          id: (seller.id || seller.sellerId || '').toString(),
          fullName: seller.fullName || seller.name || 'Unknown',
          email: seller.email || '',
          role: 'Seller',
          isSellerApproved: seller.isApproved === true,
          createdAt: seller.createdAt || new Date(),
          storeName: seller.storeName || '',
          phoneNumber: seller.phoneNumber || '',
          isBlocked: false,
          isDeleted: false,
        };
        mappedUsers.push(user);
      }
    }
    
    return mappedUsers;
  }

  // Approve seller via Custom Toast Confirm
  approveSeller(seller: AdminUser): void {
    this.toastService.show({
      message: `Approve ${seller.fullName} as a seller? They will be able to sell products on the platform.`,
      type: 'info',
      isConfirm: true,
      onConfirm: () => {
        this.actionLoading.set(parseInt(seller.id, 10));
        const sellerId = parseInt(seller.id, 10);
        
        this.adminService.approveSeller(sellerId)
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: (response: any) => {
              console.log('Approve response:', response);
              this.toastService.show(`${seller.fullName} has been approved as a seller!`, 'success');
              
              // Move seller from pending to approved
              this.pendingSellers.update(pending => 
                pending.filter(s => s.id !== seller.id)
              );
              
              this.approvedSellers.update(approved => 
                [...approved, { ...seller, isSellerApproved: true }]
              );
            },
            error: (error: any) => {
              console.error('❌ Error approving seller:', error);
              let errorMsg = 'Failed to approve seller';
              if (error.error?.message) errorMsg = error.error.message;
              this.toastService.show(errorMsg, 'danger');
            }
          });
      }
    });
  }

  // Reject seller via Custom Toast Confirm
  rejectSeller(seller: AdminUser): void {
    this.toastService.show({
      message: `Reject ${seller.fullName}? They will need to reapply.`,
      type: 'warning',
      isConfirm: true,
      onConfirm: () => {
        this.actionLoading.set(parseInt(seller.id, 10));
        
        this.adminService.rejectSeller(parseInt(seller.id, 10))
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: () => {
              this.toastService.show(`${seller.fullName} has been rejected.`, 'warning');
              this.pendingSellers.update(pending => 
                pending.filter(s => s.id !== seller.id)
              );
            },
            error: (error: any) => {
              console.error('Error rejecting seller:', error);
              // Remove locally even if API fails (for testing)
              this.pendingSellers.update(pending => 
                pending.filter(s => s.id !== seller.id)
              );
              this.toastService.show(`${seller.fullName} rejected locally (API reject endpoint missing)`, 'warning');
            }
          });
      }
    });
  }

  // Refresh sellers list
  refreshSellers(): void {
    if (this.activeTab() === 'pending') {
      this.loadPendingSellers();
    } else {
      this.loadApprovedSellers();
    }
    this.toastService.show('Refreshing list...', 'info');
  }

  // Change active tab
  setTab(tab: 'pending' | 'approved'): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
  }

  // Get user initial for avatar
  getUserInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  // Show alert message
  private showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.alertMessage.set(null), 4000);
  }

  // Clear alert
  clearAlert(): void {
    this.alertMessage.set(null);
  }

  // Handle API errors
  private handleApiError(error: any): void {
    if (error.status === 0) {
      this.showAlert('Cannot connect to server. Make sure the backend is running on the correct port.', 'danger');
    } else if (error.status === 404) {
      this.showAlert('API endpoint not found. Make sure GetPendingSellers method exists in the Controller.', 'danger');
    } else if (error.status === 401) {
      this.showAlert('Unauthorized. Please login as admin.', 'danger');
    } else if (error.status === 403) {
      this.showAlert('Forbidden. You don\'t have admin permissions.', 'danger');
    } else if (error.status === 500) {
      this.showAlert('Server error. Check backend logs for details.', 'danger');
    } else {
      this.showAlert(`Failed to load sellers: ${error.message || 'Unknown error'}`, 'danger');
    }
  }
}