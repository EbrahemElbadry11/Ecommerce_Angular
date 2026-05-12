import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductDto,
  AddProductDto,
  UpdateProductDto,
  ProductFilterDto,
} from '../models/product.model';
import { GeneralResponse } from '../../../shared/models/api-response.model';

/**
 * Product Service
 * Handles all HTTP calls to the Product API endpoints
 * Backend: E-CommerceApi/API/Controllers/ProductController.cs
 *
 * Base URL: /api/product (added by ApiInterceptor)
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly endpoint = '/product'; // Relative path (interceptor prepends /api)

  constructor(private http: HttpClient) {}

  /**
   * Get all products with optional filtering, sorting, and pagination
   * GET /api/product
   */
  getAllProducts(
    filter?: ProductFilterDto
  ): Observable<GeneralResponse<ProductDto[]>> {
    return this.http.get<GeneralResponse<ProductDto[]>>(this.endpoint, {
      params: {
        ...(filter?.search && { search: filter.search }),
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.minPrice && { minPrice: filter.minPrice }),
        ...(filter?.maxPrice && { maxPrice: filter.maxPrice }),
        ...(filter?.sortBy && { sortBy: filter.sortBy }),
        ...(filter?.order && { order: filter.order }),
        ...(filter?.page && { page: filter.page }),
        ...(filter?.pageSize && { pageSize: filter.pageSize }),
      },
    });
  }

  /**
   * Get a single product by ID
   * GET /api/product/{id}
   */
  getProductById(id: number): Observable<GeneralResponse<ProductDto>> {
    return this.http.get<GeneralResponse<ProductDto>>(
      `${this.endpoint}/${id}`
    );
  }

  /**
   * Create a new product (Seller/Admin only)
   * POST /api/product
   * Requires: Authorization header with Bearer token
   */
  addProduct(dto: AddProductDto): Observable<GeneralResponse<ProductDto>> {
    return this.http.post<GeneralResponse<ProductDto>>(this.endpoint, dto);
  }

  /**
   * Update an existing product (Seller/Admin only)
   * PUT /api/product
   * Requires: Authorization header with Bearer token
   * Note: You can only update products you own
   */
  updateProduct(dto: UpdateProductDto): Observable<GeneralResponse<string>> {
    return this.http.put<GeneralResponse<string>>(this.endpoint, dto);
  }

  /**
   * Delete a product (Seller/Admin only)
   * DELETE /api/product/{id}
   * Requires: Authorization header with Bearer token
   * Note: You can only delete products you own
   */
  deleteProduct(id: number): Observable<GeneralResponse<string>> {
    return this.http.delete<GeneralResponse<string>>(
      `${this.endpoint}/${id}`
    );
  }

  /**
   * Upload an image for a product (Seller/Admin only)
   * POST /api/product/{id}/image
   * Requires: Authorization header with Bearer token
   * Note: You can only upload images for products you own
   */
  uploadProductImage(
    productId: number,
    file: File
  ): Observable<GeneralResponse<string>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<GeneralResponse<string>>(
      `${this.endpoint}/${productId}/image`,
      formData
    );
  }

  /**
   * Get all products by seller (public endpoint)
   * GET /api/product/seller/{sellerProfileId}
   */
  getProductsBySeller(
    sellerProfileId: number
  ): Observable<GeneralResponse<ProductDto[]>> {
    return this.http.get<GeneralResponse<ProductDto[]>>(
      `${this.endpoint}/seller/${sellerProfileId}`
    );
  }
}
