import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SellerResponseDto,
  RegisterSellerDto,
  UpdateSellerDto,
} from '../models/seller.model';
import { GeneralResponse } from '../../shared/models/api-response.model';

/**
 * Seller Service
 * Handles all HTTP calls to the Seller API endpoints
 * Backend: E-CommerceApi/API/Controllers/SellerController.cs
 *
 * Base URL: /api/seller (added by ApiInterceptor)
 */
@Injectable({
  providedIn: 'root',
})
export class SellerService {
  private readonly endpoint = '/seller';

  constructor(private http: HttpClient) {}

  /**
   * Get all sellers (public endpoint)
   * GET /api/seller
   */
  getAllSellers(): Observable<GeneralResponse<SellerResponseDto[]>> {
    return this.http.get<GeneralResponse<SellerResponseDto[]>>(this.endpoint);
  }

  /**
   * Get a seller by ID (public endpoint)
   * GET /api/seller/{id}
   */
  getSellerById(id: number): Observable<GeneralResponse<SellerResponseDto>> {
    return this.http.get<GeneralResponse<SellerResponseDto>>(
      `${this.endpoint}/${id}`
    );
  }

  /**
   * Get current seller's profile (requires authentication)
   * GET /api/seller/profile
   * Requires: Authorization header with Bearer token
   */
  getCurrentSellerProfile(): Observable<GeneralResponse<SellerResponseDto>> {
    return this.http.get<GeneralResponse<SellerResponseDto>>(
      `${this.endpoint}/profile`
    );
  }

  /**
   * Register as a seller (requires authentication)
   * POST /api/seller/register
   * Requires: Authorization header with Bearer token
   */
  registerSeller(
    dto: RegisterSellerDto
  ): Observable<GeneralResponse<SellerResponseDto>> {
    const formData = new FormData();
    formData.append('storeName', dto.storeName);
    formData.append('description', dto.description || '');
    if (dto.logo) {
      formData.append('logo', dto.logo);
    }

    return this.http.post<GeneralResponse<SellerResponseDto>>(
      `${this.endpoint}/register`,
      formData
    );
  }

  /**
   * Update seller's profile (requires authentication)
   * PUT /api/seller/profile
   * Requires: Authorization header with Bearer token
   */
  updateSellerProfile(
    dto: UpdateSellerDto
  ): Observable<GeneralResponse<SellerResponseDto>> {
    const formData = new FormData();
    if (dto.storeName) {
      formData.append('storeName', dto.storeName);
    }
    if (dto.description) {
      formData.append('description', dto.description);
    }
    if (dto.logo) {
      formData.append('logo', dto.logo);
    }

    return this.http.put<GeneralResponse<SellerResponseDto>>(
      `${this.endpoint}/profile`,
      formData
    );
  }

  /**
   * Delete seller's profile (requires authentication)
   * DELETE /api/seller/profile
   * Requires: Authorization header with Bearer token
   */
  deleteSellerProfile(): Observable<GeneralResponse<string>> {
    return this.http.delete<GeneralResponse<string>>(
      `${this.endpoint}/profile`
    );
  }
}
