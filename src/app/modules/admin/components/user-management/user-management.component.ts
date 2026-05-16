// user-management.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../models/user-admin.model';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../../../../services/toast';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, SlicePipe],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private cd = inject(ChangeDetectorRef);
  private toast = inject(ToastService); 

  // State
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly actionLoading = signal<string | null>(null);
  readonly alertMessage = signal<string | null>(null);
  readonly alertType = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  // Filters
  readonly searchTerm = signal('');
  readonly filterRole = signal('all');
  readonly filterStatus = signal('all');

  // Computed filtered users
  readonly filteredUsers = computed(() => {
    let filtered = this.users();
    const search = this.searchTerm().toLowerCase();
    const role = this.filterRole();
    const status = this.filterStatus();

    if (search) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (role !== 'all') {
      const roleMap: Record<string, string> = {
        'admin': 'Admin',
        'seller': 'Seller', 
        'user': 'Customer'
      };
      filtered = filtered.filter(user => user.role === roleMap[role]);
    }

    if (status !== 'all') {
      filtered = filtered.filter(user =>
        status === 'active' ? !user.isBlocked && !user.isDeleted : user.isBlocked || user.isDeleted
      );
    }

    return filtered;
  });

  // Stats
  readonly activeUsersCount = computed(() =>
    this.users().filter(user => !user.isBlocked && !user.isDeleted).length
  );

  readonly blockedUsersCount = computed(() =>
    this.users().filter(user => user.isBlocked || user.isDeleted).length
  );

  readonly sellersCount = computed(() =>
    this.users().filter(user => user.role === 'Seller').length
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.data && Array.isArray(res.data)) {
            this.users.set(res.data);
            this.cd.markForCheck();
            console.log('✅ Loaded:', this.users().length, 'users');
          } else {
            console.warn('⚠️ No data array found');
          }
        },
        error: (err) => {
          console.error('❌ Error:', err);
          this.showAlert('Failed to load users', 'danger');
        }
      });
  }

  changeRole(user: AdminUser, newRole: string): void {
    const roleMap: Record<string, string> = {
      'user': 'Customer',      
      'seller': 'Seller',  
      'admin': 'Admin'     
    };
    
    const backendRole = roleMap[newRole];
    const roleDisplay = newRole.charAt(0).toUpperCase() + newRole.slice(1);
    
    this.toast.show({
      message: `Are you sure you want to change ${user.fullName}'s role from ${user.role} to ${roleDisplay}?`,
      type: 'warning',
      isConfirm: true,
      onConfirm: () => {
        this.actionLoading.set(user.id);
        
        console.log('Sending role:', backendRole);
        
        this.adminService.changeRole(user.id, backendRole).subscribe({
          next: (res) => {
            console.log('Success:', res);
            this.toast.show(`Role changed to ${roleDisplay} for ${user.fullName}`, 'success');
            this.loadUsers();
            this.actionLoading.set(null);
          },
          error: (err) => {
            console.error('Error:', err);
            if (err.error?.errors) {
              this.toast.show(`Error: ${err.error.errors.join(', ')}`, 'danger');
            } else if (err.error?.message) {
              this.toast.show(err.error.message, 'danger');
            } else {
              this.toast.show('Failed to change role', 'danger');
            }
            this.actionLoading.set(null);
          }
        });
      }
    });
  }

  blockUser(user: AdminUser): void {
    this.toast.show({
      message: `Block ${user.fullName}? They will not be able to access their account.`,
      type: 'danger',
      isConfirm: true,
      onConfirm: () => {
        this.actionLoading.set(user.id);
        this.adminService.blockUser(user.id)
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: () => {
              this.toast.show(`${user.fullName} has been blocked`, 'success');
              this.loadUsers();
              this.cd.markForCheck();
            },
            error: () => this.toast.show('Failed to block user', 'danger')
          });
      }
    });
  }

  // ✅ Unblock user with confirmation
  unblockUser(user: AdminUser): void {
    this.toast.show({
      message: `Unblock ${user.fullName}? They will be able to access their account again.`,
      type: 'info',
      isConfirm: true,
      onConfirm: () => {
        this.actionLoading.set(user.id);
        this.adminService.unblockUser(user.id)
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: () => {
              this.toast.show(`${user.fullName} has been unblocked`, 'success');
              this.loadUsers();
              this.cd.markForCheck();
            },
            error: () => this.toast.show('Failed to unblock user', 'danger')
          });
      }
    });
  }

  // ✅ Delete user with confirmation
  deleteUser(user: AdminUser): void {
    this.toast.show({
      message: `⚠️ Delete ${user.fullName}? This action cannot be undone. All their data will be permanently removed.`,
      type: 'danger',
      isConfirm: true,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.actionLoading.set(user.id);
        this.adminService.deleteUser(user.id)
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: () => {
              this.toast.show(`${user.fullName} has been deleted permanently`, 'success');
              this.loadUsers();
            },
            error: (err) => {
              console.error('Delete error:', err);
              this.toast.show('Failed to delete user', 'danger');
            }
          });
      }
    });
  }

  // ✅ Approve seller with confirmation
  approveSeller(seller: AdminUser): void {
    this.toast.show({
      message: `Approve ${seller.fullName} as a seller? They will be able to sell products on the platform.`,
      type: 'success',
      isConfirm: true,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.actionLoading.set(seller.id);
        const sellerId = parseInt(seller.id, 10);
        
        this.adminService.approveSeller(sellerId)
          .pipe(finalize(() => this.actionLoading.set(null)))
          .subscribe({
            next: () => {
              this.toast.show(`${seller.fullName} has been approved as a seller!`, 'success');
              this.loadUsers();
            },
            error: (err) => {
              console.error('Approve error:', err);
              this.toast.show('Failed to approve seller', 'danger');
            }
          });
      }
    });
  }

  // Update list
  refreshUsers(): void {
    this.loadUsers();
    this.toast.show('Refreshing user list...', 'info');
  }

  // Get first letter of name
  getUserInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  // Clear filters
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterRole.set('all');
    this.filterStatus.set('all');
  }

  // Clear alert
  clearAlert(): void {
    this.alertMessage.set(null);
  }

  // Show alert
  private showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.clearAlert(), 4000);
  }

  // Get role value for dropdown
  getRoleValue(user: AdminUser): string {
    const role = user.role?.toLowerCase() || 'customer';
    if (role === 'admin') return 'admin';
    if (role === 'seller') return 'seller';
    return 'user';
  }

  // Get status badge class
  getStatusBadgeClass(user: AdminUser): string {
    if (user.isDeleted) return 'badge-danger';
    if (user.isBlocked) return 'badge-warning';
    return 'badge-success';
  }

  // Get status text
  getStatusText(user: AdminUser): string {
    if (user.isDeleted) return 'Deleted';
    if (user.isBlocked) return 'Blocked';
    return 'Active';
  }
}