/**
 * Review models matching backend DTOs
 * Located in E-CommerceApi/Core/DTOs/Review/
 */

export interface ReviewDto {
  reviewId: number;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string; // ISO date
  userName: string;
}

export interface AddReviewDto {
  rating: number;
  comment: string;
}
