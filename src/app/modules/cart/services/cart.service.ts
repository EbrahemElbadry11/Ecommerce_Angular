import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartResponse } from '../models/cartresponse';
import { GeneralResponse } from '../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  baseUrl = 'https://ecommerceiti.runasp.net/api/cart';

  constructor(private http: HttpClient) { }

  getCart(): Observable<GeneralResponse<CartResponse>> {
    return this.http.get<GeneralResponse<CartResponse>>(
      this.baseUrl,
      {
        withCredentials: true
      }
    );
  }

  addToCart(productId: number, quantity: number) {
    return this.http.post(
      this.baseUrl,
      {
        productId,
        quantity
      },
      {
        withCredentials: true
      }
    );
  }

  updateCart(productId: number, quantity: number) {
    return this.http.put(
      this.baseUrl,
      {
        productId,
        quantity
      },
      {
        withCredentials: true
      }
    );
  }

  removeItem(productId: number) {
    return this.http.delete(
      `${this.baseUrl}/${productId}`,
      {
        withCredentials: true
      }
    );
  }

  clearCart() {
    return this.http.delete(
      this.baseUrl,
      {
        withCredentials: true
      }
    );
  }
}
