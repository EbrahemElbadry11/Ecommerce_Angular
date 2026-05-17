import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AdminService } from '../.././../services/admin.service';
import { ApiResponse } from '../../../models/user-admin.model';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
];

export interface OrderItem {
  productId:   number;
  productName: string;
  quantity:    number;
  price:       number;
  imageUrl:    string | null;
}

export interface Order {
  orderId:         number;
  orderDate:       string;
  status:          string;
  shippingAddress: string;
  userId:          string | null;
  guestId:         string | null;
  totalItems:      number;
  subTotal:        number;
  shippingFees:    number;
  totalAmount:     number;
  customerName:    string;  // ← ضيف
  orderItems:      OrderItem[];
}

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, FormsModule, RouterLink],
    templateUrl: './orders-management-component.html',
  styleUrls: ['./orders-management-component.css']
})
export class OrdersManagementComponent implements OnInit, OnDestroy {

  private adminService = inject(AdminService);

  // ── State ────────────────────────────────────────────────────────────────────
  allOrders      = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  loading        = signal(true);
  actionLoading  = signal<number | null>(null);
  expandedOrder  = signal<number | null>(null);

  // ── Alert ────────────────────────────────────────────────────────────────────
  alertMessage = signal<string | null>(null);
  alertType    = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  // ── Filters ──────────────────────────────────────────────────────────────────
  searchTerm    = '';
  statusFilter  = 'all';
  sortBy        = 'date-desc';

  readonly orderStatuses = ORDER_STATUSES;

  // ── Stats ────────────────────────────────────────────────────────────────────
  get totalRevenue(): number {
    return this.allOrders()
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  get statusCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.allOrders().forEach(o => {
      const s = o.status ?? 'Unknown';
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }

  private subs: Subscription[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadOrders(); }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  // ─────────────────────────────────────────────────────────────────────────────
  loadOrders(): void {
  this.loading.set(true);
  const sub = this.adminService.getDashboard()
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe({
      next: (res: any) => {
        const raw: any[] = res.data?.recentOrders ?? [];
        const mapped: Order[] = raw.map((o: any) => ({
          orderId:         o.orderId      ?? 0,
          orderDate:       o.orderDate    ?? new Date().toISOString(),
          status:          o.status       ?? 'Pending',
          shippingAddress: '—',
          userId:          null,
          guestId:         null,
          totalItems:      0,
          subTotal:        o.totalAmount  ?? 0,
          shippingFees:    0,
          totalAmount:     o.totalAmount  ?? 0,
          customerName:    o.customerName ?? 'Guest',
          orderItems:      [],
        }));
        this.allOrders.set(mapped);
        this.applyFilters();
      },
      error: () => this.showAlert('Failed to load orders', 'danger'),
    });
  this.subs.push(sub);
}

  // ─────────────────────────────────────────────────────────────────────────────
  applyFilters(): void {
    let result = [...this.allOrders()];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(o =>
        o.orderId.toString().includes(term) ||
        o.shippingAddress.toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      result = result.filter(o => o.status === this.statusFilter);
    }

    switch (this.sortBy) {
      case 'date-desc':  result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); break;
      case 'date-asc':   result.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()); break;
      case 'amount-desc': result.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case 'amount-asc':  result.sort((a, b) => a.totalAmount - b.totalAmount); break;
    }

    this.filteredOrders.set(result);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  updateStatus(orderId: number, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    this.actionLoading.set(orderId);

    const sub = this.adminService.updateOrderStatus(orderId, status)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.allOrders.update(orders =>
            orders.map(o => o.orderId === orderId ? { ...o, status } : o)
          );
          this.applyFilters();
          this.showAlert(`Order #${orderId} updated to ${status}`, 'success');
        },
        error: () => this.showAlert(`Failed to update order #${orderId}`, 'danger'),
      });

    this.subs.push(sub);
  }

  toggleExpand(orderId: number): void {
    this.expandedOrder.update(id => id === orderId ? null : orderId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      delivered:  'badge-success',
      confirmed:  'badge-info',
      processing: 'badge-warning',
      shipped:    'badge-info',
      pending:    'badge-warning',
      cancelled:  'badge-danger',
    };
    return map[status?.toLowerCase()] ?? 'badge-neutral';
  }

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.alertMessage.set(null), 4000);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}