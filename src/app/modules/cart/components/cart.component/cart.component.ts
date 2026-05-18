import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart.service';
import { CartResponse } from '../../models/cartresponse';
import { ToastService } from '../../../../../services/toast';

@Component({
  selector: 'app-cart.component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {

  cart: CartResponse | null = null;

  subtotal = 0;
  shippingFees = 0;

  isLoading = true;

  isEmpty = false;

  currentPage = 1;
  pageSize = 3;

  constructor(
    public cartService: CartService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {

    this.isLoading = true;

    this.cartService
      .getCart()
      .subscribe({

        next: (res) => {

          this.cart = res.data ?? null;

          console.log(this.cart);

          if (
            this.cart?.cartId === 0 ||
            !this.cart?.items?.length
          ) {

            this.isEmpty = true;

          } else {

            this.isEmpty = false;
          }

          this.updateSubtotal();

          // clamp currentPage after items loaded
          const totalPages = this.totalPages;
          if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
          } else if (totalPages === 0) {
            this.currentPage = 1;
          }

          this.isLoading = false;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(err);

          this.cart = null;

          this.subtotal = 0;

          this.isEmpty = true;

          this.isLoading = false;
        }

      });
  }

  confirmRemoveItem(
    productId: number,
    productName?: string
  ): void {

    this.toastService.show({
      message:
        `Remove ${productName || 'this item'} from your cart?`,
      type: 'danger',
      isConfirm: true,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: () =>
        this.removeItem(productId),
    });
  }

  private removeItem(productId: number): void {

    this.cartService
      .removeItem(productId)

      .subscribe({

        next: (res: any) => {

          if (!res.isSuccess) {

            console.error(res.data);

            return;
          }

          this.toastService.show(
            'Item removed from cart.',
            'success'
          );

          this.loadCart();
        },

        error: (err) => {

          console.error(err);

          this.toastService.show(
            'Failed to remove item from cart.',
            'danger'
          );
        }

      });
  }

  updateQuantity(
    productId: number,
    currentQuantity: number,
    change: number,
    maxStock: number
  ): void {

    const newQuantity =
      currentQuantity + change;

    if (newQuantity < 1) {

      const item =
        this.cart?.items.find(
          x => x.productId === productId
        );

      this.confirmRemoveItem(
        productId,
        item?.productName
      );

      return;
    }

    // stock limit
    if (newQuantity > maxStock) {
      return;
    }

    this.cartService
      .updateCartItem(
        productId,
        newQuantity
      )

      .subscribe({

        next: (res: any) => {

          if (!res.isSuccess) {

            console.error(res.data);

            return;
          }

          const item =
            this.cart?.items.find(
              x => x.productId === productId
            );

          if (item) {

            item.quantity = newQuantity;

            if (this.cart) {

              this.cart = {
                ...this.cart,

                totalItems:
                  this.cart.items.reduce(

                    (sum, x) =>
                      sum + x.quantity,

                    0
                  )
              };

              this.cartService.setCart(this.cart);
            }
          }

          this.updateSubtotal();

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(err);
        }

      });
  }

  private updateSubtotal(): void {

    if (!this.cart?.items?.length) {

      this.subtotal = 0;
      this.shippingFees = 0;

      return;
    }

    this.subtotal =
      this.cart.items.reduce(

        (sum, item) =>
          sum + (item.price * item.quantity),

        0
      );

    // Calculate shipping: $50 if < $200, free if >= $200
    this.shippingFees = this.subtotal >= 200 ? 0 : 50;
  }

  get paginatedItems(): any[] {
    if (!this.cart || !this.cart.items) {
      return [];
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.cart.items.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    if (!this.cart || !this.cart.items) {
      return 0;
    }
    return Math.ceil(this.cart.items.length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

}
