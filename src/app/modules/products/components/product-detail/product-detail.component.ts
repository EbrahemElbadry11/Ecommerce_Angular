import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../../reviews/services/review.service';
import { ProductDto } from '../../models/product.model';
import { ReviewDto } from '../../../reviews/models/review.model';
import { ReviewListComponent } from '../../../reviews/components/review-list/review-list.component';
import { ReviewFormComponent } from '../../../reviews/components/review-form/review-form.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewListComponent, ReviewFormComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // Data
  product: ProductDto | null = null;
  reviews: ReviewDto[] = [];

  // UI States
  isLoadingProduct: boolean = false;
  isLoadingReviews: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  currentImageIndex: number = 0;

  // User state
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
        next: (response: any) => {
          if (response.isSuccess && response.data) {
            this.product = response.data;
          } else {
            this.errorMessage = 'Product not found';
            this.product = null;
          }
          this.isLoadingProduct = false;
        },
        error: (err: any) => {
          console.error('Failed to load product:', err);
          this.errorMessage = 'Failed to load product details. Please try again.';
          this.isLoadingProduct = false;
        },
      });
  }

  /**
   * Handle review added event from ReviewFormComponent
   */
  onReviewAdded(review: ReviewDto): void {
    this.reviews.unshift(review); // Add to top of list
    this.successMessage = 'Review added successfully!';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  /**
   * Handle review delete event from ReviewListComponent
   */
  onDeleteReview(event: {
    productId: number;
    reviewId: number;
    index: number;
  }): void {
    this.reviewService
      .deleteReview(event.productId, event.reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess) {
            this.reviews.splice(event.index, 1);
            this.successMessage = 'Review deleted successfully!';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: (err: any) => {
          console.error('Failed to delete review:', err);
          this.errorMessage = 'Failed to delete review. Please try again.';
        },
      });
  }

  /**
   * Handle error from ReviewFormComponent
   */
  onReviewError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 5000);
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

  // Debug handlers (delegates console usage to component methods)
  onDebugAddToCart(): void {
    console.log('Add to cart - Feature from Dev1');
  }

  onDebugSave(): void {
    console.log('Add to wishlist - Feature from Dev1');
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
