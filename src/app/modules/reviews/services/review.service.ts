import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewDto, AddReviewDto } from '../models/review.model';
import { GeneralResponse } from '../../../shared/models/api-response.model';

/**
 * Review Service
 * Handles all HTTP calls to the Review API endpoints
 * Backend: E-CommerceApi/API/Controllers/ReviewController.cs
 *
 * Base URL: /api/product (added by ApiInterceptor)
 * Endpoints: /api/product/{productId}/review
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly endpoint = '/product';

  constructor(private http: HttpClient) {}

  /**
   * Get all reviews for a product (public endpoint)
   * GET /api/product/{productId}/review
   */
  getProductReviews(
    productId: number
  ): Observable<GeneralResponse<ReviewDto[]>> {
    return this.http.get<GeneralResponse<ReviewDto[]>>(
      `${this.endpoint}/${productId}/review`
    );
  }

  /**
   * Add a review to a product (requires authentication)
   * POST /api/product/{productId}/review
   * Requires: Authorization header with Bearer token
   */
  addReview(
    productId: number,
    dto: AddReviewDto
  ): Observable<GeneralResponse<ReviewDto>> {
    return this.http.post<GeneralResponse<ReviewDto>>(
      `${this.endpoint}/${productId}/review`,
      dto
    );
  }

  /**
   * Delete a review (requires authentication)
   * DELETE /api/product/{productId}/review/{reviewId}
   * Requires: Authorization header with Bearer token
   * Note: You can only delete your own reviews
   */
  deleteReview(
    productId: number,
    reviewId: number
  ): Observable<GeneralResponse<string>> {
    return this.http.delete<GeneralResponse<string>>(
      `${this.endpoint}/${productId}/review/${reviewId}`
    );
  }
}
