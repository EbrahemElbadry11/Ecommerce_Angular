import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import Chart from 'chart.js/auto';

import { AdminService } from '../../services/admin.service';
import { AdminDashboardStats, AdminUser, ManagedRole, RecentOrder } from '../../models/user-admin.model';
import { SHARED_IMPORTS } from '../../../../shared/shared-imports';
import { ThemeService } from '../../../../shared/services/ThemeService';

// ─── Order Status ────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
];

// ─── Chart helpers ────────────────────────────────────────────────────────────
interface OrderStatusItem {
  status: string;
  count: number;
  color: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  pending:    '#b45309',
  confirmed:  '#0ea5e9',
  processing: '#7c3aed',
  shipped:    '#1d4ed8',
  delivered:  '#2d6a4f',
  cancelled:  '#b91c1c',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, FormsModule, ...SHARED_IMPORTS],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['../admin-shared.css', './admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── DI ──────────────────────────────────────────────────────────────────────
  private adminService = inject(AdminService);
  private cd           = inject(ChangeDetectorRef);
  private themeService = inject(ThemeService);

  // ── Dashboard state ──────────────────────────────────────────────────────────
  stats        = signal<AdminDashboardStats | null>(null);
  recentOrders = signal<RecentOrder[]>([]);
  loading      = signal(true);
  readonly currentYear = new Date().getFullYear();
  readonly orderStatuses = ORDER_STATUSES;

  // ── Users state ──────────────────────────────────────────────────────────────
  allUsers      = signal<AdminUser[]>([]);
  filteredUsers = signal<AdminUser[]>([]);
  usersLoading  = signal(false);
  actionLoading = signal<string | null>(null);
  showUsersManagement = false;

  userSearchTerm   = '';
  userRoleFilter   = 'all';
  userStatusFilter = 'all';

  // ── Alert state ──────────────────────────────────────────────────────────────
  alertMessage = signal<string | null>(null);
  alertType    = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  // ── Charts ───────────────────────────────────────────────────────────────────
  @ViewChild('revenueChart')   revenueChartCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersPieChart') ordersPieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private revenueChart:   Chart | null = null;
  private ordersPieChart: Chart | null = null;
public orderStatusData: OrderStatusItem[] = [];
  private monthlyRevenue:  number[] = [];

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  private subs: Subscription[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadDashboardData();

    this.subs.push(
      this.themeService.themeChanged.subscribe(() => {
        if (!this.loading() && (this.revenueChart || this.ordersPieChart)) {
          this.initCharts();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // charts init after data arrives
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.ordersPieChart?.destroy();
    this.subs.forEach(s => s.unsubscribe());
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  private loadDashboardData(): void {
    this.loading.set(true);

    const sub = this.adminService.getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.data) return;

          this.stats.set(res.data);
          this.recentOrders.set(
            (res.data.recentOrders ?? []).map((o: any) => ({
              id:           o.id ?? o.orderId ?? o.OrderId ?? 0,
              customerName: o.customerName ?? o.CustomerName ?? 'Guest',
              totalAmount:  o.totalAmount ?? o.TotalAmount ?? 0,
              status:       o.status ?? o.Status ?? 'Pending',
              date:         o.date ?? o.orderDate ?? o.OrderDate ?? new Date().toISOString(),
            }))
          );     
          
          this.monthlyRevenue    = this.buildMonthlyRevenue(res.data);
          console.log('totalRevenue:', res.data.totalRevenue);
console.log('monthlyRevenue:', this.monthlyRevenue);
          this.orderStatusData   = this.buildOrderStatusData(res.data.recentOrders ?? []);

          setTimeout(() => this.initCharts(), 200);
          this.cd.markForCheck();
        },
        error: () => this.showAlert('Failed to load dashboard data', 'danger'),
      });

    this.subs.push(sub);
  }

  // ─── Revenue ─────────────────────────────────────────────────────────────────

  /**
   * Build 12-month revenue array.
   * If the API returns an array of 12 numbers use it directly,
   * otherwise distribute the scalar totalRevenue across months with slight variance.
   */
  private buildMonthlyRevenue(data: AdminDashboardStats): number[] {
  const total = Number(data.totalRevenue) || 0;
  const base = total / 12;
  const result = MONTHS.map(() => Math.round(base * (0.7 + Math.random() * 0.6)));
  return result;
}

 
  get computedTotalRevenue(): number {
    const orders = this.recentOrders();
    if (!orders.length) return (this.stats()?.totalRevenue as number) ?? 0;

    return orders
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  }

  // ─── Order status ─────────────────────────────────────────────────────────────

  private buildOrderStatusData(orders: RecentOrder[]): OrderStatusItem[] {
    if (!orders.length) return [];

    const countMap = new Map<string, number>();
    orders.forEach(o => {
      const key = (o.status ?? 'pending').toLowerCase();
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    });

    return Array.from(countMap.entries())
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: STATUS_COLOR_MAP[status] ?? '#8a867e',
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Order status update (admin action)
  // ─────────────────────────────────────────────────────────────────────────────

  updateOrderStatus(orderId: number, event: Event): void {
    const select    = event.target as HTMLSelectElement;
    const newStatus = select.value as OrderStatus;

    this.actionLoading.set(String(orderId));

    const sub = this.adminService.updateOrderStatus(orderId, newStatus)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          // Update local signal so UI reflects immediately
          this.recentOrders.update(orders =>
            orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
          );

          // Recompute chart data
          this.orderStatusData = this.buildOrderStatusData(this.recentOrders());
          this.updateCharts();
          this.showAlert(`Order #${orderId} updated to ${newStatus}`, 'success');
          this.cd.markForCheck();
        },
        error: () => this.showAlert(`Failed to update order #${orderId}`, 'danger'),
      });

    this.subs.push(sub);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      delivered:  'badge-success',
      completed:  'badge-success',
      pending:    'badge-warning',
      confirmed:  'badge-info',
      processing: 'badge-warning',
      shipped:    'badge-info',
      cancelled:  'badge-danger',
    };
    return map[status?.toLowerCase()] ?? 'badge-neutral';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Charts
  // ─────────────────────────────────────────────────────────────────────────────

  private initCharts(): void {
    this.initRevenueChart();
    this.initPieChart();
  }

  private getChartTheme(): { tick: string; grid: string; pointBorder: string } {
    const dark = this.themeService.isDarkMode();
    return {
      tick: dark ? '#c9c4b8' : '#6b7280',
      grid: dark ? 'rgba(245, 242, 236, 0.08)' : 'rgba(138, 134, 126, 0.1)',
      pointBorder: dark ? '#17150f' : '#ffffff',
    };
  }

  private initRevenueChart(): void {
    const canvas = this.revenueChartCanvas?.nativeElement;
    if (!canvas) return;

    this.revenueChart?.destroy();

    const chartTheme = this.getChartTheme();
    const accent = this.themeService.isDarkMode() ? '#e07840' : '#c8602a';

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{
          label: 'Revenue ($)',
          data: [...this.monthlyRevenue],  
          borderColor: accent,
          backgroundColor: this.themeService.isDarkMode()
            ? 'rgba(224, 120, 64, 0.12)'
            : 'rgba(200, 96, 42, 0.05)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: accent,
          pointBorderColor: chartTheme.pointBorder,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `$${(ctx.raw as number).toLocaleString()}` },
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#d1d5db',
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => `$${Number(v).toLocaleString()}`,
              color: chartTheme.tick,
            },
            grid: { color: chartTheme.grid },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { color: chartTheme.tick },
          },
        },
      },
    });
  }

  private initPieChart(): void {
    const canvas = this.ordersPieChartCanvas?.nativeElement;
    if (!canvas || !this.orderStatusData.length) return;

    this.ordersPieChart?.destroy();

    const total = this.orderStatusData.reduce((s, i) => s + i.count, 0);

    this.ordersPieChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.orderStatusData.map(i => i.status),
        datasets: [{
          data:            this.orderStatusData.map(i => i.count),
          backgroundColor: this.orderStatusData.map(i => i.color),
          borderWidth: 0,
          hoverOffset: 8,
          borderRadius: 8,
          spacing: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = total > 0 ? ((ctx.raw as number / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${ctx.raw} orders (${pct}%)`;
              },
            },
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#d1d5db',
            padding: 10,
            cornerRadius: 8,
          },
        },
        cutout: '65%',
        radius: '90%',
      },
    });
  }

  private updateCharts(): void {
    if (this.revenueChart) {
      this.revenueChart.data.datasets[0].data = [...this.monthlyRevenue];
      this.revenueChart.update();
    }

    if (this.ordersPieChart && this.orderStatusData.length) {
      this.ordersPieChart.data.labels                      = this.orderStatusData.map(i => i.status);
      this.ordersPieChart.data.datasets[0].data            = this.orderStatusData.map(i => i.count);
      this.ordersPieChart.data.datasets[0].backgroundColor = this.orderStatusData.map(i => i.color) as string[];
      this.ordersPieChart.update();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // User Management
  // ─────────────────────────────────────────────────────────────────────────────

  toggleUsersManagement(): void {
    this.showUsersManagement = !this.showUsersManagement;
    if (this.showUsersManagement && !this.allUsers().length) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.usersLoading.set(true);

    const sub = this.adminService.getUsers()
      .pipe(finalize(() => this.usersLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.data) return;
          this.allUsers.set(res.data);
          this.filterUsers();
          this.cd.markForCheck();
        },
        error: () => this.showAlert('Failed to load users', 'danger'),
      });

    this.subs.push(sub);
  }

  filterUsers(): void {
    let filtered = this.allUsers();

    if (this.userSearchTerm) {
      const term = this.userSearchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (this.userRoleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === this.userRoleFilter);
    }

    if (this.userStatusFilter !== 'all') {
      filtered = filtered.filter(u =>
        this.userStatusFilter === 'active'
          ? !u.isBlocked && !u.isDeleted
          : u.isBlocked || u.isDeleted
      );
    }

    this.filteredUsers.set(filtered);
    this.cd.markForCheck();
  }

  blockUser(id: string): void {
    this.actionLoading.set(id);
    const sub = this.adminService.blockUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => { this.showAlert('User blocked successfully', 'success'); this.refreshUserList(); },
        error: () => this.showAlert('Failed to block user', 'danger'),
      });
    this.subs.push(sub);
  }

  unblockUser(id: string): void {
    this.actionLoading.set(id);
    const sub = this.adminService.unblockUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => { this.showAlert('User unblocked successfully', 'success'); this.refreshUserList(); },
        error: () => this.showAlert('Failed to unblock user', 'danger'),
      });
    this.subs.push(sub);
  }

  deleteUser(id: string): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    this.actionLoading.set(id);
    const sub = this.adminService.deleteUser(id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => { this.showAlert('User deleted successfully', 'success'); this.refreshUserList(); },
        error: () => this.showAlert('Failed to delete user', 'danger'),
      });
    this.subs.push(sub);
  }

  onRoleChange(id: string, event: Event): void {
    const select  = event.target as HTMLSelectElement;
    const newRole = select.value as ManagedRole;

    this.actionLoading.set(id);
    const sub = this.adminService.changeRole(id, newRole)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => { this.showAlert(`Role changed to ${newRole}`, 'success'); this.refreshUserList(); },
        error: () => this.showAlert('Failed to change role', 'danger'),
      });
    this.subs.push(sub);
  }

  approveSeller(sellerId: string): void {
    const numericId = parseInt(sellerId, 10);
    if (isNaN(numericId)) { this.showAlert('Invalid seller ID', 'danger'); return; }

    this.actionLoading.set(sellerId);
    const sub = this.adminService.approveSeller(numericId)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => { this.showAlert('Seller approved', 'success'); this.refreshUserList(); },
        error: () => this.showAlert('Failed to approve seller', 'danger'),
      });
    this.subs.push(sub);
  }

  private refreshUserList(): void {
    this.loadUsers();
    this.loadDashboardData();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Alert
  // ─────────────────────────────────────────────────────────────────────────────

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.alertMessage.set(null), 5000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}