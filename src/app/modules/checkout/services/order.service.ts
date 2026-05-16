import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, } from '@angular/common/http';

import { Observable, throwError, } from 'rxjs';

import { catchError, } from 'rxjs/operators';

import { GeneralResponse } from '../../../shared/models/api-response.model';

import { CreateOrderRequest } from '../models/create-order.model';

import { CreateOrderResponse } from '../models/order-response.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private endpoint = '/order';

  constructor(private http: HttpClient) { }

  createOrder(dto: CreateOrderRequest): Observable<GeneralResponse<CreateOrderResponse>> {
    return this.http.post<
      GeneralResponse<CreateOrderResponse>>
      (
        this.endpoint,
        dto,
        {
          withCredentials: true
        }
      )
      .pipe(
        catchError(
          this.handleError
        )
      );
  }

  private handleError(error: HttpErrorResponse) {

    let message =
      'Something went wrong';

    if (error.error?.data) {
      message =
        error.error.data;
    }

    return throwError(
      () => new Error(message)
    );
  }

  getOrderStatus(orderId: number): Observable<GeneralResponse<string>> {
    return this.http.get<
      GeneralResponse<string>>(
        `${this.endpoint}/${orderId}/status`,
        {
          withCredentials: true
        }
      )
      .pipe(
        catchError(
          this.handleError
        )
      );
  }
}
