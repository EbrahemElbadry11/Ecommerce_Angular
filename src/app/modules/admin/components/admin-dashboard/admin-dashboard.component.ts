// admin-dashboard.component.ts
import { Component, OnInit, signal, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

import { AdminService } from '../../services/admin.service';
import { AdminDashboardStats, AdminUser, ManagedRole } from '../../models/user-admin.model';
import { SHARED_IMPORTS } from '../../../../shared/shared-imports';
import { FormsModule } from '@angular/forms';

interface OrderStatusItem {
  status: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, FormsModule, ...SHARED_IMPORTS],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['../admin-shared.css', './admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);

  // Dashboard data
  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly loading = signal(true);
  readonly currentYear = new Date().getFullYear();

  // Users data
  allUsers = signal<AdminUser[]>([]);
  filteredUsers = signal<AdminUser[]>([]);
  usersLoading = signal(false);
  actionLoading = signal<string | null>(null);
  showUsersManagement = false;

  // User filters
  userSearchTerm = '';
  userRoleFilter = 'all';
  userStatusFilter = 'all';

  // Alert
  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  // Order status data for pie chart
  orderStatusData: OrderStatusItem[] = [];

  // Chart references
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersPieChart') ordersPieChartCanvas!: ElementRef<HTMLCanvasElement>;
  private revenueChart: Chart | null = null;
  private ordersPieChart: Chart | null = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.ordersPieChart) {
      this.ordersPieChart.destroy();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    const sub = this.adminService.getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.stats.set(res.data);
            this.prepareOrderStatusData(res.data.recentOrders || []);
            setTimeout(() => this.initCharts(), 100);
          }
        },
        error: (err) => {
          this.showAlert('Failed to load dashboard data', 'danger');
          console.error('Dashboard Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  private prepareOrderStatusData(orders: any[]): void {
    const statusCount = new Map<string, number>();
    orders.forEach(order => {
      const status = order.status?.toLowerCase() || 'pending';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    const colorMap: Record<string, string> = {
      'delivered': '#2d6a4f',
      'completed': '#2d6a4f',
      'pending': '#b45309',
      'processing': '#b45309',
      'confirmed': '#b45309',
      'cancelled': '#b91c1c',
      'shipped': '#1d4ed8'
    };

    this.orderStatusData = Array.from(statusCount.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: colorMap[status] || '#8a867e'
    }));
  }

  private initCharts(): void {
    if (!this.stats()) return;
    this.initRevenueChart();
    this.initPieChart();
  }

  private initRevenueChart(): void {
    if (!this.revenueChartCanvas?.nativeElement) return;

    // Sample monthly data - replace with actual data from API
    const monthlyRevenue = [12500, 14200, 16800, 15200, 18900, 21000, 22500, 24800, 26700, 28900, 31200, 33400];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    this.revenueChart = new Chart(this.revenueChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue ($)',
          data: monthlyRevenue,
          borderColor: '#c8602a',
          backgroundColor: 'rgba(200, 96, 42, 0.05)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#c8602a',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `$${context.raw?.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            },
            grid: {
              color: 'rgba(138, 134, 126, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  private initPieChart(): void {
    if (!this.ordersPieChartCanvas?.nativeElement || this.orderStatusData.length === 0) return;

    if (this.ordersPieChart) {
      this.ordersPieChart.destroy();
    }

    this.ordersPieChart = new Chart(this.ordersPieChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.orderStatusData.map(item => item.status),
        datasets: [{
          data: this.orderStatusData.map(item => item.count),
          backgroundColor: this.orderStatusData.map(item => item.color),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} orders`
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  loadUsers(): void {
    if (!this.showUsersManagement) return;
    this.usersLoading.set(true);
    const sub = this.adminService.getUsers()
      .pipe(finalize(() => this.usersLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.allUsers.set(res.data);
            this.filterUsers();
          }
        },
        error: (err) => {
          this.showAlert('Failed to load users', 'danger');
          console.error('Users Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  filterUsers(): void {
    let filtered = [...this.allUsers()];

    // Filter by search term
    if (this.userSearchTerm) {
      const term = this.userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (this.userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.userRoleFilter);
    }

if (status !== 'all') {
  filtered = filtered.filter(user => 
    (status === 'active') 
      ? (!user.isBlocked && !user.isDeleted)  
      : (user.isBlocked || user.isDeleted)     
  );
}

    this.filteredUsers.set(filtered);
  }

  blockUser(id: string): void {
    this.actionLoading.set(id);
    const sub = this.adminService.blockUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert('User blocked successfully', 'success');
          this.refreshUserList();
        },
        error: (err) => {
          this.showAlert('Failed to block user', 'danger');
          console.error('Block Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  unblockUser(id: string): void {
    this.actionLoading.set(id);
    const sub = this.adminService.unblockUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert('User unblocked successfully', 'success');
          this.refreshUserList();
        },
        error: (err) => {
          this.showAlert('Failed to unblock user', 'danger');
          console.error('Unblock Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  deleteUser(id: string): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    this.actionLoading.set(id);
    const sub = this.adminService.deleteUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert('User deleted successfully', 'success');
          this.refreshUserList();
        },
        error: (err) => {
          this.showAlert('Failed to delete user', 'danger');
          console.error('Delete Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  onRoleChange(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as ManagedRole;
    this.actionLoading.set(id);
    const sub = this.adminService.changeRole(id, newRole)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert(`Role changed to ${newRole} successfully`, 'success');
          this.refreshUserList();
        },
        error: (err) => {
          this.showAlert('Failed to change role', 'danger');
          console.error('Role Change Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  approveSeller(sellerId: string): void {
    const numericId = parseInt(sellerId, 10);
    if (isNaN(numericId)) {
      this.showAlert('Invalid seller ID', 'danger');
      return;
    }

    this.actionLoading.set(sellerId);
    const sub = this.adminService.approveSeller(numericId)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert('Seller approved successfully', 'success');
          this.refreshUserList();
        },
        error: (err) => {
          this.showAlert('Failed to approve seller', 'danger');
          console.error('Approve Error:', err);
        }
      });
    this.subscriptions.push(sub);
  }

  private refreshUserList(): void {
    this.loadUsers();
    // Also refresh dashboard stats
    this.loadDashboardData();
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'delivered': 'badge-success',
      'completed': 'badge-success',
      'pending': 'badge-warning',
      'processing': 'badge-warning',
      'confirmed': 'badge-warning',
      'cancelled': 'badge-danger',
      'shipped': 'badge-info'
    };
    return statusMap[status?.toLowerCase()] || 'badge-neutral';
  }

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.clearAlert(), 5000);
  }

  clearAlert(): void {
    this.alertMessage.set(null);
  }

  // Toggle users management with lazy loading
  toggleUsersManagement(): void {
    this.showUsersManagement = !this.showUsersManagement;
    if (this.showUsersManagement && this.allUsers().length === 0) {
      this.loadUsers();
    }
  }
}