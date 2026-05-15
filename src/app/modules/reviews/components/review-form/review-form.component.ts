import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReviewService } from '../../services/review.service';
import { AddReviewDto, ReviewDto, UpdateReviewDto } from '../../models/review.model';

/**
 * Reusable Review Form Component
 * Form for adding new reviews to a product
 *
 * Usage:
 * <app-review-form
 *   [productId]="productId"
 *   [isLoggedIn]="isLoggedIn"
 *   (onReviewAdded)="handleReviewAdded($event)"
 *   (onError)="handleError($event)">
 * </app-review-form>
 */
@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent implements OnDestroy {
  @Input() productId!: number;
  @Input() isLoggedIn: boolean = false;
  @Input() set existingReview(value: ReviewDto | null) {
    this._existingReview = value;
    if (value) {
      this.setFormFromReview(value);
    } else {
      this.resetForm();
    }
  }
  get existingReview(): ReviewDto | null {
    return this._existingReview;
  }

  @Output() onReviewAdded = new EventEmitter<ReviewDto>();
  @Output() onReviewUpdated = new EventEmitter<ReviewDto>();
  @Output() onError = new EventEmitter<string>();
  @Output() onSuccess = new EventEmitter<string>();

  // Form state
  rating: number = 5;
  comment: string = '';
  isSubmitting: boolean = false;
  private _existingReview: ReviewDto | null = null;

  private destroy$ = new Subject<void>();

  constructor(private reviewService: ReviewService) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Submit review
   */
  submitReview(): void {
    if (!this.productId) {
      this.onError.emit('Invalid product. Please refresh and try again.');
      return;
    }

    // Validation
    if (!this.comment.trim()) {
      this.onError.emit('Please enter a comment');
      return;
    }

    if (this.rating < 1 || this.rating > 5) {
      this.onError.emit('Rating must be between 1 and 5 stars');
      return;
    }

    if (this.comment.length > 500) {
      this.onError.emit('Comment cannot exceed 500 characters');
      return;
    }

    this.isSubmitting = true;

    const trimmedComment = this.comment.trim();

    if (this.isEditMode && this.existingReview) {
      const dto: UpdateReviewDto = {
        rating: this.rating,
        comment: trimmedComment,
      };

      this.reviewService
        .updateReview(this.productId, this.existingReview.reviewId, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.isSuccess && response.data) {
              this._existingReview = response.data;
              this.setFormFromReview(response.data);
              this.onReviewUpdated.emit(response.data);
              this.onSuccess.emit('Review updated successfully!');
            }
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('Failed to update review:', err);
            this.onError.emit(
              err.error?.message || 'Failed to update review. Please try again.'
            );
            this.isSubmitting = false;
          },
        });

      return;
    }

    const dto: AddReviewDto = {
      rating: this.rating,
      comment: trimmedComment,
    };

    this.reviewService
      .addReview(this.productId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.onReviewAdded.emit(response.data);
            this.resetForm();
            this.onSuccess.emit('Review added successfully!');
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Failed to add review:', err);
          this.onError.emit(
            err.error?.message || 'Failed to add review. Please try again.'
          );
          this.isSubmitting = false;
        },
      });
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    this.rating = 5;
    this.comment = '';
  }

  private setFormFromReview(review: ReviewDto): void {
    this.rating = review.rating ?? 5;
    this.comment = review.comment ?? '';
  }

  get isEditMode(): boolean {
    return !!this.existingReview;
  }

  /**
   * Set rating
   */
  setRating(newRating: number): void {
    this.rating = newRating;
  }

  /**
   * Get star display
   */
  getStarDisplay(starValue: number): string {
    return '★';
  }

  /**
   * Check if star is filled
   */
  isStarFilled(starValue: number): boolean {
    return starValue <= this.rating;
  }
}
