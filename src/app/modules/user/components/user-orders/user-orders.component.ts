import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UserOrder {
  id: number | string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
  shippingAddress?: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="orders-page">
      <header class="orders-header">
        <div>
          <span class="eyebrow">My Account</span>
          <h1>My Orders</h1>
        </div>
        <a routerLink="/user/profile" class="back-btn">← Back to Profile</a>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-ring"></div>
          <p>Loading your orders...</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <h2>No orders yet</h2>
          <p>Once you place an order, it will appear here.</p>
          <a routerLink="/products" class="shop-btn">Start Shopping</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <article class="order-card">
              <div class="order-top">
                <div class="order-id">
                  <span class="label">Order</span>
                  <strong>#{{ order.id }}</strong>
                </div>
                <span class="status-badge" [class]="getStatusClass(order.status)">
                  {{ order.status }}
                </span>
                <div class="order-date">
                  <span class="label">Placed</span>
                  <span>{{ order.createdAt | date:'mediumDate' }}</span>
                </div>
                <div class="order-total">
                  <span class="label">Total</span>
                  <strong>{{ order.totalAmount | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
              </div>

              @if (order.items && order.items.length > 0) {
                <div class="order-items">
                  @for (item of order.items; track item.productName) {
                    <div class="order-item">
                      <span class="item-name">{{ item.productName }}</span>
                      <span class="item-qty">× {{ item.quantity }}</span>
                      <span class="item-price">{{ item.totalPrice | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                  }
                </div>
              }

              @if (order.shippingAddress) {
                <div class="order-address">
                  <span class="label">Ship to:</span> {{ order.shippingAddress }}
                </div>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .orders-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
      font-family: 'Outfit', sans-serif;
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .eyebrow {
      display: block;
      color: #6366f1;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.25rem;
    }

    h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
    }

    .back-btn {
      text-decoration: none;
      color: #6366f1;
      font-weight: 600;
      font-size: 0.9rem;
      border: 1.5px solid #6366f1;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .back-btn:hover { background: #6366f1; color: white; }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary, #64748b);
    }

    .spinner-ring {
      width: 40px; height: 40px;
      border: 3px solid rgba(99,102,241,0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
    .empty-state h2 { color: var(--text-primary, #0f172a); margin: 0 0 0.5rem; }

    .shop-btn {
      display: inline-block;
      margin-top: 1.5rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }
    .shop-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }

    .orders-list { display: flex; flex-direction: column; gap: 1rem; }

    .order-card {
      background: var(--bg-card, white);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
      transition: box-shadow 0.2s;
    }
    .order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

    .order-top {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #94a3b8);
      display: block;
    }

    .order-id strong { font-size: 1rem; font-weight: 700; color: #6366f1; }
    .order-date span, .order-total strong { color: var(--text-primary, #0f172a); }
    .order-total { margin-left: auto; }
    .order-total strong { font-size: 1.1rem; font-weight: 700; color: #6366f1; }

    .status-badge {
      padding: 0.3rem 0.85rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef9c3; color: #854d0e; }
    .badge-danger  { background: #fee2e2; color: #b91c1c; }
    .badge-info    { background: #dbeafe; color: #1d4ed8; }
    .badge-neutral { background: #f1f5f9; color: #475569; }

    body.dark-mode .badge-success { background: rgba(34,197,94,0.15);  color: #4ade80; }
    body.dark-mode .badge-warning { background: rgba(234,179,8,0.15);  color: #facc15; }
    body.dark-mode .badge-danger  { background: rgba(239,68,68,0.15);  color: #f87171; }
    body.dark-mode .badge-info    { background: rgba(59,130,246,0.15); color: #60a5fa; }
    body.dark-mode .badge-neutral { background: rgba(255,255,255,0.08);color: #94a3b8; }

    .order-items {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }
    .item-name { flex: 1; color: var(--text-primary, #334155); }
    .item-qty  { color: var(--text-secondary, #64748b); }
    .item-price { font-weight: 600; color: var(--text-primary, #0f172a); }

    .order-address {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--text-secondary, #64748b);
    }

    @media (max-width: 640px) {
      .orders-header { flex-direction: column; align-items: flex-start; }
      .order-top { gap: 0.75rem; }
      .order-total { margin-left: 0; }
    }
  `]
})
export class UserOrdersComponent implements OnInit {
  readonly orders  = signal<UserOrder[]>([]);
  readonly loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>('/order/my-orders').subscribe({
      next: (res) => {
        const data = res.data ?? res;
        this.orders.set(Array.isArray(data) ? data : []);
      },
      error: () => this.orders.set([]),
      complete: () => this.loading.set(false),
    });
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (['delivered','completed'].includes(s)) return 'status-badge badge-success';
    if (['pending','processing','confirmed'].includes(s)) return 'status-badge badge-warning';
    if (s === 'cancelled') return 'status-badge badge-danger';
    if (s === 'shipped')   return 'status-badge badge-info';
    return 'status-badge badge-neutral';
  }
}
