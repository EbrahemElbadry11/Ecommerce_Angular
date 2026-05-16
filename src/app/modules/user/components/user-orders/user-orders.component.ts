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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

    .orders-page {
      --bg: #ffffff;
      --surface: #ffffff;
      --surface-alt: #faf9f7;
      --ink: #1a1714;
      --muted: #8a867e;
      --line: rgba(26,23,20,.09);
      --accent: #c8602a;
      --accent-deep: #a34d1f;
      --accent-glow: rgba(200,96,42,.18);
      --green: #2d6a4f;
      --green-pale: rgba(45,106,79,.10);
      --danger: #b91c1c;
      --danger-pale: rgba(185,28,28,.10);
      --warn: #b45309;
      --warn-pale: rgba(180,83,9,.10);
      --info: #1d4ed8;
      --info-pale: rgba(59,130,246,.10);
      --shadow-xs: 0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
      --shadow-sm: 0 4px 16px rgba(26,23,20,.08), 0 1px 4px rgba(26,23,20,.05);
      --ff-display: 'Playfair Display', Georgia, serif;
      --ff-body: 'DM Sans', 'Segoe UI', sans-serif;

      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
      font-family: var(--ff-body);
      color: var(--ink);
      min-height: 80vh;
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
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      margin-bottom: 4px;
    }

    h1 {
      margin: 0;
      font-family: var(--ff-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -0.025em;
    }

    .back-btn {
      text-decoration: none;
      color: var(--ink);
      font-weight: 600;
      font-size: 0.85rem;
      border: 1.5px solid var(--line);
      padding: 0.5rem 1.1rem;
      border-radius: 999px;
      transition: all 0.2s;
    }
    .back-btn:hover { background: var(--ink); color: #fff; border-color: var(--ink); }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--muted);
    }

    .spinner-ring {
      width: 40px; height: 40px;
      border: 3px solid rgba(200,96,42,0.15);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state h2 { color: var(--ink); margin: 0 0 0.5rem; font-family: var(--ff-display); }

    .shop-btn {
      display: inline-block;
      margin-top: 1.5rem;
      background: var(--accent);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.25s;
      box-shadow: 0 4px 12px rgba(200,96,42,.25);
    }
    .shop-btn:hover { background: var(--accent-deep); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(200,96,42,.35); }

    .orders-list { display: flex; flex-direction: column; gap: 1.25rem; }

    .order-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 1.5rem;
      box-shadow: var(--shadow-xs);
      transition: transform 0.25s, box-shadow 0.25s;
      animation: riseIn 0.5s cubic-bezier(.22,1,.36,1) both;
    }
    .order-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-sm); }

    .order-top {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .label {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--muted);
      display: block;
    }

    .order-id strong { font-size: 1rem; font-weight: 700; color: var(--accent); }
    .order-date span { color: var(--ink); }
    .order-total { margin-left: auto; }
    .order-total strong { font-family: var(--ff-display); font-size: 1.15rem; font-weight: 700; color: var(--ink); }

    .status-badge {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .badge-success { background: var(--green-pale); color: var(--green); }
    .badge-warning { background: var(--warn-pale); color: var(--warn); }
    .badge-danger  { background: var(--danger-pale); color: var(--danger); }
    .badge-info    { background: var(--info-pale); color: var(--info); }
    .badge-neutral { background: var(--surface-alt); color: var(--muted); border: 1px solid var(--line); }

    .order-items {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--line);
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
    .item-name { flex: 1; color: var(--ink); }
    .item-qty  { color: var(--muted); }
    .item-price { font-weight: 600; color: var(--ink); }

    .order-address {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--muted);
    }

    @keyframes riseIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Dark Mode ── */
    :host-context(body.dark-mode) .orders-page {
      --bg: #0e0d0b;
      --surface: #17150f;
      --surface-alt: #1d1b14;
      --ink: #f5f2ec;
      --muted: #776f63;
      --line: rgba(245,242,236,.09);
      --accent: #e07840;
      --accent-deep: #c8602a;
      --accent-glow: rgba(224,120,64,.2);
      --green: #4ade80;
      --green-pale: rgba(74,222,128,.1);
      --danger: #f87171;
      --danger-pale: rgba(239,68,68,.12);
      --warn: #fbbf24;
      --warn-pale: rgba(234,179,8,.12);
      --info: #60a5fa;
      --info-pale: rgba(59,130,246,.12);
      --shadow-xs: 0 1px 3px rgba(0,0,0,.3);
      --shadow-sm: 0 4px 16px rgba(0,0,0,.4);
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
