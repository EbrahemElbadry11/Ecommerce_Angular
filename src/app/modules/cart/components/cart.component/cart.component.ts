import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart.service';
import { CartResponse } from '../../models/cartresponse';

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

  isLoading = true;

  isEmpty = false;

  constructor(
    private cartService: CartService, private cdr: ChangeDetectorRef
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

          if (this.cart?.cartId === 0 || !this.cart?.items?.length) {
            this.isEmpty = true;
          } else {
            this.isEmpty = false;
          }

          this.updateSubtotal();

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

  removeItem(productId: number): void {

    this.cartService.removeItem(productId)
      .subscribe({

        next: () => {
          this.loadCart();
        },

        error: (err) => {
          console.error(err);
        }

      });
  }

  private updateSubtotal(): void {

    if (!this.cart?.items?.length) {

      this.subtotal = 0;

      return;
    }

    this.subtotal = this.cart.items.reduce(
      (sum, item) =>
        sum + (item.price * item.quantity),
      0
    );
  }

}
