import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUser, ManagedRole } from '../../models/user-admin.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './user-management.component.html',
  styleUrl: '../admin-shared.css',
})
export class UserManagementComponent implements OnInit {
  readonly users      = signal<AdminUser[]>([]);
  readonly loading    = signal(true);
  readonly message    = signal('');
  readonly success    = signal(false);
  readonly searchTerm = signal('');
  readonly filterRole = signal('All');

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const role = this.filterRole();
    return this.users().filter(u => {
      const matchSearch = !term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchRole = role === 'All' || u.role === role;
      return matchSearch && matchRole;
    });
  });

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next:     (res) => this.users.set(res.data ?? []),
      complete: ()    => this.loading.set(false),
    });
  }

  changeRole(user: AdminUser, role: ManagedRole): void {
    this.adminService.changeRole(user.id, role).subscribe({
      next: () => { this.notify(`Role changed to ${role}.`, true); this.loadUsers(); },
      error: () => this.notify('Could not change role.', false),
    });
  }

  block(user: AdminUser): void {
    this.adminService.blockUser(user.id).subscribe({
      next: () => { this.notify('User blocked.', true); this.loadUsers(); },
      error: () => this.notify('Could not block user.', false),
    });
  }

  unblock(user: AdminUser): void {
    this.adminService.unblockUser(user.id).subscribe({
      next: () => { this.notify('User unblocked.', true); this.loadUsers(); },
      error: () => this.notify('Could not unblock user.', false),
    });
  }

  remove(user: AdminUser): void {
    if (!confirm(`Delete ${user.fullName}? This cannot be undone.`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => { this.notify('User deleted.', true); this.loadUsers(); },
      error: () => this.notify('Could not delete user.', false),
    });
  }

  getRoleBadge(role?: string | null): string {
    if (role === 'Admin')    return 'badge-danger';
    if (role === 'Seller')   return 'badge-warning';
    return 'badge-info';
  }

  private notify(msg: string, ok: boolean): void {
    this.success.set(ok);
    this.message.set(msg);
    setTimeout(() => this.message.set(''), 3000);
  }
}
