import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../../reviews/services/review.service';
import { ProductDto } from '../../models/product.model';
import { ReviewDto, AddReviewDto } from '../../../reviews/models/review.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // Data
  product: ProductDto | null = null;
  reviews: ReviewDto[] = [];

  // Add Review Form
  newReview = {
    rating: 5,
    comment: '',
  };

  // UI States
  isLoadingProduct: boolean = false;
  isLoadingReviews: boolean = false;
  isSubmittingReview: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  currentImageIndex: number = 0;

  // User state (for ownership checks)
  isLoggedIn: boolean = false;
  currentUserName: string = '';

  // Auto-unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const productId = +params['id'];
      if (productId) {
        this.loadProductDetails(productId);
        this.loadProductReviews(productId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if user is logged in
   */
  private checkAuthStatus(): void {
    const token = localStorage.getItem('authToken');
    this.isLoggedIn = !!token;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.currentUserName = userData.userName || userData.email || '';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }

  /**
   * Load product details
   */
  private loadProductDetails(productId: number): void {
    this.isLoadingProduct = true;
    this.errorMessage = '';

    this.productService
      .getProductById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.product = response.data;
          } else {
            this.errorMessage = 'Product not found';
            this.product = null;
          }
          this.isLoadingProduct = false;
        },
        error: (err) => {
          console.error('Failed to load product:', err);
          this.errorMessage = 'Failed to load product details. Please try again.';
          this.isLoadingProduct = false;
        },
      });
  }

  /**
   * Load reviews for the product
   */
  private loadProductReviews(productId: number): void {
    this.isLoadingReviews = true;

    this.reviewService
      .getProductReviews(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.reviews = response.data;
          } else {
            this.reviews = [];
          }
          this.isLoadingReviews = false;
        },
        error: (err) => {
          console.error('Failed to load reviews:', err);
          this.reviews = [];
          this.isLoadingReviews = false;
        },
      });
  }

  /**
   * Submit a new review
   */
  submitReview(): void {
    if (!this.product) return;

    if (this.newReview.comment.trim().length === 0) {
      this.errorMessage = 'Please enter a comment';
      return;
    }

    if (this.newReview.rating < 1 || this.newReview.rating > 5) {
      this.errorMessage = 'Rating must be between 1 and 5 stars';
      return;
    }

    this.isSubmittingReview = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dto: AddReviewDto = {
      rating: this.newReview.rating,
      comment: this.newReview.comment.trim(),
    };

    this.reviewService
      .addReview(this.product.productId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.reviews.unshift(response.data); // Add to top of list
            this.newReview = { rating: 5, comment: '' };
            this.successMessage = 'Review added successfully!';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
          this.isSubmittingReview = false;
        },
        error: (err) => {
          console.error('Failed to add review:', err);
          this.errorMessage = err.error?.message || 'Failed to add review. Please try again.';
          this.isSubmittingReview = false;
        },
      });
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: number, index: number): void {
    if (!this.product) return;

    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService
        .deleteReview(this.product.productId, reviewId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.reviews.splice(index, 1); // Remove from list
              this.successMessage = 'Review deleted successfully!';
              setTimeout(() => (this.successMessage = ''), 3000);
            }
          },
          error: (err) => {
            console.error('Failed to delete review:', err);
            this.errorMessage = 'Failed to delete review. Please try again.';
          },
        });
    }
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    if (this.product?.imagesNames && this.product.imagesNames.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.product.imagesNames.length) %
        this.product.imagesNames.length;
    }
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    if (this.product?.imagesNames && this.product.imagesNames.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.product.imagesNames.length;
    }
  }

  /**
   * Select a specific image
   */
  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  /**
   * Get the current image URL
   */
  getCurrentImageUrl(): string {
    if (
      this.product?.imagesNames &&
      this.product.imagesNames.length > this.currentImageIndex
    ) {
      return (
        'https://localhost:7125/Images/Products/' +
        this.product.imagesNames[this.currentImageIndex]
      );
    }
    return '';
  }

  /**
   * Format price as currency
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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
   * Get star display (⭐⭐⭐⭐⭐)
   */
  getStarDisplay(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  /**
   * Check if product is low on stock
   */
  isLowStock(): boolean {
    return this.product ? this.product.stockQuantity < 10 : false;
  }

  /**
   * Go back to product list
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }
}
