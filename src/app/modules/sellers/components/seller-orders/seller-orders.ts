import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { SellerService } from '../../services/seller.service';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-orders.html',
  styleUrls: ['./seller-orders.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOrdersComponent implements OnInit {

  orders: any[] = [];

  paginatedOrders: any[] = [];

  isLoading = false;

  currentPage = 1;

  pageSize = 4;

  totalPages = 0;
  @Output() revenueCalculated = new EventEmitter<number>();

  constructor(
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {

    this.isLoading = true;

    this.sellerService
      .getSellerOrders()
      .subscribe({

        next: (res: any) => {
          console.log('Seller Orders:', res.data);
          this.orders = res.data || [];

          const revenue = this.orders
            .filter(order => {

              const status =
                order.status?.toLowerCase();

              return (
                status === 'shipped' ||
                status === 'delivered'
              );

            })
            .reduce((total, order) => {

              return total + (
                order.totalAmount || 0
              );

            }, 0);

          this.revenueCalculated.emit(revenue);


          this.totalPages = Math.ceil(
            this.orders.length / this.pageSize
          );

          this.applyPagination();

          this.isLoading = false;

          this.cdr.markForCheck();
        },

        error: (err) => {

          console.error(err);

          this.isLoading = false;

          this.cdr.markForCheck();
        }
      });
  }

  applyPagination(): void {

    const start =
      (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    this.paginatedOrders =
      this.orders.slice(start, end);
  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.applyPagination();
    }
  }

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.applyPagination();
    }
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  formatCurrency(value: number): string {

    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD'
      }
    ).format(value);

  }

}
