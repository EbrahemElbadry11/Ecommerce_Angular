import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ReviewService } from '../../services/review.service';
import { ReviewDto } from '../../models/review.model';

/**
 * Reusable Review List Display Component
 * Displays reviews and handles deletion
 *
 * Usage:
 * <app-review-list
 *   [productId]="productId"
 *   [reviews]="reviews"
 *   [isLoggedIn]="isLoggedIn"
 *   [currentUserName]="currentUserName"
 *   (onDeleteReview)="handleDeleteReview($event)"
 *   (reviewsLoadingChange)="handleLoadingChange($event)">
 * </app-review-list>
 */
@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.css'],
})
export class ReviewListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() productId!: number;
  @Input() reviews: ReviewDto[] = [];
  @Input() isLoggedIn: boolean = false;
  @Input() currentUserName: string = '';
  @Input() isLoading: boolean = false;

  @Output() onDeleteReview = new EventEmitter<{
    productId: number;
    reviewId: number;
    index: number;
  }>();
  @Output() onEditReview = new EventEmitter<ReviewDto>();
  @Output() userReviewChange = new EventEmitter<ReviewDto | null>();
  @Output() reviewsLoadingChange = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();

  constructor(private reviewService: ReviewService) { }

  ngOnInit(): void {
    if (!this.reviews.length && this.productId) {
      this.loadReviews();
      return;
    }

    this.emitUserReview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.loadReviews();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load reviews for the product
   */
  private loadReviews(): void {
    if (!this.productId) {
      return;
    }

    this.reviewsLoadingChange.emit(true);

    this.reviewService
      .getProductReviews(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.reviews = response.data;
          } else {
            this.reviews = [];
          }
          this.emitUserReview();
          this.reviewsLoadingChange.emit(false);
        },
        error: (err) => {
          console.error('Failed to load reviews:', err);
          this.reviews = [];
          this.emitUserReview();
          this.reviewsLoadingChange.emit(false);
        },
      });
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: number, index: number): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.onDeleteReview.emit({
        productId: this.productId,
        reviewId,
        index,
      });
    }
  }

  /**
   * Format date to readable format
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get star display
   */
  getStarDisplay(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  /**
   * Check if current user is the reviewer
   */
  isUserReview(review: ReviewDto): boolean {
    const current = (this.currentUserName || '').trim().toLowerCase();
    if (!this.isLoggedIn || !current) {
      return false;
    }

    const candidates = [review.userName, review.userFullName]
      .filter((name): name is string => !!name && name.trim().length > 0)
      .map((name) => name.trim().toLowerCase());

    return candidates.includes(current);
  }

  startEdit(review: ReviewDto): void {
    if (this.isUserReview(review)) {
      this.onEditReview.emit(review);
    }
  }

  /**
   * Retry loading reviews
   */
  retryLoadReviews(): void {
    this.loadReviews();
  }

  private emitUserReview(): void {
    if (!this.isLoggedIn || !this.currentUserName) {
      this.userReviewChange.emit(null);
      return;
    }

    const existing = this.reviews.find((review) =>
      this.isUserReview(review)
    );
    this.userReviewChange.emit(existing ?? null);
  }
}
