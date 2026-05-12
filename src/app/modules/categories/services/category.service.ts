import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryDto } from '../models/category.model';
import { GeneralResponse } from '../../shared/models/api-response.model';

/**
 * Category Service
 * Handles all HTTP calls to the Category API endpoints
 * Backend: E-CommerceApi/API/Controllers/CategoryController.cs
 *
 * Base URL: /api/category (added by ApiInterceptor)
 */
@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly endpoint = '/category';

  constructor(private http: HttpClient) {}

  /**
   * Get all categories (public endpoint)
   * GET /api/category
   */
  getAllCategories(): Observable<GeneralResponse<CategoryDto[]>> {
    return this.http.get<GeneralResponse<CategoryDto[]>>(this.endpoint);
  }

  /**
   * Get a single category by ID (public endpoint)
   * GET /api/category/{id}
   */
  getCategoryById(id: number): Observable<GeneralResponse<CategoryDto>> {
    return this.http.get<GeneralResponse<CategoryDto>>(
      `${this.endpoint}/${id}`
    );
  }
}
