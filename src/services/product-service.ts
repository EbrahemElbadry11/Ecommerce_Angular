import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Iproduct } from '../models/iproduct';

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  baseUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) {}

  getAllProducts() {
    return this.http.get<Iproduct[]>(this.baseUrl);
  }

  addProduct(product: Iproduct) {
    return this.http.post<Iproduct>(this.baseUrl, product);
  }

  updateProduct(id: number, product: Iproduct) {
    return this.http.put<Iproduct>(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getProductById(id: number) {
    return this.http.get<Iproduct>(`${this.baseUrl}/${id}`);
  }
}