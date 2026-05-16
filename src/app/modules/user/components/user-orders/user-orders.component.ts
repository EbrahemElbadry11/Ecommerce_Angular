import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient, } from '@angular/common/http';

import { RouterLink, } from '@angular/router';

interface UserOrder {
  orderId: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  shippingAddress: string;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.css',]
  ,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserOrdersComponent
  implements OnInit {

  private readonly http = inject(HttpClient);

  readonly orders = signal<UserOrder[]>([]);

  readonly loading = signal(true);

  readonly error = signal('');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {

    this.loading.set(true);

    this.http.get<ApiResponse<UserOrder[]>>(
      '/order'
    ).subscribe({
      next: (response) => {

        this.orders.set(
          response.data || []
        );

        this.loading.set(false);
      },

      error: () => {
        this.error.set(
          'Failed to load orders.'
        );
        this.loading.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'pending':
        return 'pending';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'default';
    }
  }

  formatOrderCode(orderId: number): string {
    const random =
      Math.abs(
        (orderId * 7919)
      )
        .toString(16)
        .toUpperCase();

    return `ORD-${random}`;
  }
}
