// user-management.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../models/user-admin.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, SlicePipe],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);

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

  // user-management.component.ts

// user-management.component.ts

// user-management.component.ts

changeRole(user: AdminUser, newRole: string): void {
  // ✅ الباك إند بيقبل: 'Admin', 'Seller', 'user'
  const roleMap: Record<string, string> = {
    'user': 'user',      // user بحرف صغير مش Customer
    'seller': 'Seller',  // Seller بحرف كبير S
    'admin': 'Admin'     // Admin بحرف كبير A
  };
  
  const backendRole = roleMap[newRole];
  
  console.log('Sending role:', backendRole);
  
  this.actionLoading.set(user.id);
  
  this.adminService.changeRole(user.id, backendRole).subscribe({
    next: (res) => {
      console.log('Success:', res);
      this.showAlert(`Role changed to ${newRole} for ${user.fullName}`, 'success');
      this.loadUsers();
      this.actionLoading.set(null);
    },
    error: (err) => {
      console.error('Error:', err);
      if (err.error?.errors) {
        this.showAlert(`Error: ${err.error.errors.join(', ')}`, 'danger');
      } else {
        this.showAlert('Failed to change role', 'danger');
      }
      this.actionLoading.set(null);
    }
  });
}

  // حظر مستخدم
  blockUser(user: AdminUser): void {
    if (!confirm(`Block ${user.fullName}? They will not be able to access their account.`)) return;

    this.actionLoading.set(user.id);
    this.adminService.blockUser(user.id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert(`${user.fullName} has been blocked`, 'success');
          this.loadUsers();
        },
        error: () => this.showAlert('Failed to block user', 'danger')
      });
  }

  // إلغاء حظر مستخدم
  unblockUser(user: AdminUser): void {
    this.actionLoading.set(user.id);
    this.adminService.unblockUser(user.id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert(`${user.fullName} has been unblocked`, 'success');
          this.loadUsers();
        },
        error: () => this.showAlert('Failed to unblock user', 'danger')
      });
  }

  // حذف مستخدم
  deleteUser(user: AdminUser): void {
    if (!confirm(`⚠️ Delete ${user.fullName}? This cannot be undone.`)) return;

    this.actionLoading.set(user.id);
    this.adminService.deleteUser(user.id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert(`${user.fullName} has been deleted`, 'success');
          this.loadUsers();
        },
        error: () => this.showAlert('Failed to delete user', 'danger')
      });
  }

  // تحديث القائمة
  refreshUsers(): void {
    this.loadUsers();
    this.showAlert('Refreshing user list...', 'info');
  }

  // جلب أول حرف من الاسم
  getUserInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  // مسح الفلاتر
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterRole.set('all');
    this.filterStatus.set('all');
  }

  // إغلاق التنبيه
  clearAlert(): void {
    this.alertMessage.set(null);
  }

  // عرض التنبيه
  private showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.clearAlert(), 4000);
  }

  // جلب قيمة الرول للـ dropdown
  getRoleValue(user: AdminUser): string {
    const role = user.role?.toLowerCase() || 'customer';
    if (role === 'admin') return 'admin';
    if (role === 'seller') return 'seller';
    return 'user';
  }
}