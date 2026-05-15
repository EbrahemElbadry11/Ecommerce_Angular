import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ProductDto,
  AddProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ProductListResponse,
} from '../models/product.model';

import { GeneralResponse } from '../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly endpoint = '/product';

  constructor(private http: HttpClient) { }

  /**
   * GET: /api/product
   */
  getAllProducts(
    filter?: ProductFilterDto
  ): Observable<GeneralResponse<ProductListResponse>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) {
        params = params.set('search', filter.search);
      }

      if (filter.categoryId) {
        params = params.set(
          'categoryId',
          filter.categoryId.toString()
        );
      }

      if (filter.minPrice !== undefined) {
        params = params.set(
          'minPrice',
          filter.minPrice.toString()
        );
      }

      if (filter.maxPrice !== undefined) {
        params = params.set(
          'maxPrice',
          filter.maxPrice.toString()
        );
      }

      if (filter.sortBy) {
        params = params.set('sortBy', filter.sortBy);
      }

      if (filter.order) {
        params = params.set('order', filter.order);
      }

      if (filter.page) {
        params = params.set(
          'page',
          filter.page.toString()
        );
      }

      if (filter.pageSize) {
        params = params.set(
          'pageSize',
          filter.pageSize.toString()
        );
      }
    }

    return this.http.get<
      GeneralResponse<ProductListResponse>
    >(this.endpoint, { params });
  }

  /**
   * GET: /api/product/{id}
   */
  getProductById(
    id: number
  ): Observable<GeneralResponse<ProductDto>> {
    return this.http.get<GeneralResponse<ProductDto>>(
      `${this.endpoint}/${id}`
    );
  }

  /**
   * POST: /api/product
   */
  addProduct(
    dto: AddProductDto
  ): Observable<GeneralResponse<ProductDto>> {
    const headers = new HttpHeaders({
      'X-Success-Message':
        'Product added successfully!',
    });

    return this.http.post<
      GeneralResponse<ProductDto>
    >(this.endpoint, dto, { headers });
  }

  /**
   * PUT: /api/product
   */
  updateProduct(
    dto: UpdateProductDto
  ): Observable<GeneralResponse<ProductDto>> {
    const headers = new HttpHeaders({
      'X-Success-Message':
        'Product updated successfully!',
    });

    return this.http.put<
      GeneralResponse<ProductDto>
    >(this.endpoint, dto, { headers });
  }

  /**
   * DELETE: /api/product/{id}
   */
  deleteProduct(
    id: number
  ): Observable<GeneralResponse<string>> {
    const headers = new HttpHeaders({
      'X-Success-Message':
        'Product deleted successfully!',
    });

    return this.http.delete<
      GeneralResponse<string>
    >(`${this.endpoint}/${id}`, {
      headers,
    });
  }

  /**
   * POST: /api/product/{id}/image
   */
  uploadProductImage(
    productId: number,
    file: File
  ): Observable<GeneralResponse<string>> {
    const formData = new FormData();

    formData.append('image', file);

    const headers = new HttpHeaders({
      'X-Success-Message':
        'Product image uploaded successfully!',
    });

    return this.http.post<
      GeneralResponse<string>
    >(
      `${this.endpoint}/${productId}/image`,
      formData,
      { headers }
    );
  }

  /**
   * GET: /api/product/seller
   */
  getProductsBySeller(): Observable<
    GeneralResponse<ProductDto[]>
  > {
    return this.http.get<
      GeneralResponse<ProductDto[]>
    >(`${this.endpoint}/seller`);
  }
}
