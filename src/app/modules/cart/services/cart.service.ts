import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { CartResponse } from '../models/cartresponse';
import { GeneralResponse } from '../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  baseUrl = '/cart';

  currentCart: CartResponse | null = null;

  private readonly cartCountSubject =
    new BehaviorSubject<number>(0);

  readonly cartCount$ =
    this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) { }

  loadCart(): Observable<GeneralResponse<CartResponse>> {

    return this.http
      .get<GeneralResponse<CartResponse>>(
        this.baseUrl,
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          this.setCart(res.data ?? null);
        })
      );
  }

  getCart(): Observable<GeneralResponse<CartResponse>> {
    return this.loadCart();
  }

  setCart(cart: CartResponse | null): void {

    this.currentCart = cart;

    this.cartCountSubject.next(
      cart?.totalItems ??
      cart?.items?.reduce(
        (sum, item) => sum + item.quantity,
        0
      ) ??
      0
    );
  }

  clearCartState(): void {

    this.setCart(null);
  }

  addToCart(productId: number, quantity: number) {

    return this.http.post(
      this.baseUrl,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  updateCart(productId: number, quantity: number) {

    return this.http.put(
      this.baseUrl,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  updateCartItem(productId: number, quantity: number) {

    return this.http.put(
      this.baseUrl,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  removeItem(productId: number) {

    return this.http.delete(
      `${this.baseUrl}/${productId}`,
      { withCredentials: true }
    );
  }

  clearCart() {

    return this.http.delete(
      this.baseUrl,
      { withCredentials: true }
    );
  }

  getCartItemQuantity(productId: number): number {

    return this.currentCart
      ?.items
      ?.find(x => x.productId === productId)
      ?.quantity ?? 0;
  }

  getImageUrl(image: string): string {

    if (!image) {
      return 'assets/images/no-image.png';
    }

    if (
      image.startsWith('http://') ||
      image.startsWith('https://')
    ) {
      return image;
    }

    return `http://localhost:5053/images/products/${image}`;
  }
}
