import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, } from '@angular/router';
import { finalize, Subject, takeUntil, } from 'rxjs';
import { ProductCardDto, ProductDto, ProductFilterDto, ProductListResponse, } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { ReviewDto } from '../../../reviews/models/review.model';
import { ReviewService } from '../../../reviews/services/review.service';
import { ReviewFormComponent } from '../../../reviews/components/review-form/review-form.component';
import { ReviewListComponent } from '../../../reviews/components/review-list/review-list.component';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:
    'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReviewFormComponent,
    ReviewListComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: [
    './product-detail.component.css',
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProductDetailComponent implements OnInit, OnDestroy {
  @ViewChild(ReviewListComponent)
  reviewList?: ReviewListComponent;
  product: ProductDto | null = null;
  isLoadingProduct = false;
  errorMessage = '';
  currentImageIndex = 0;
  currentImageUrl = 'assets/images/no-image.png';
  formattedPrice = '';
  formattedDate = '';
  isLowStockValue = false;
  quantity = 1;
  isAddingToCart = false;
  isLoggedIn = false;
  currentUserName = '';
  userReview: ReviewDto | null = null;
  isLoadingReviews = false;
  reviewSuccessMessage = '';
  reviewErrorMessage = '';
  relatedProducts: ProductCardDto[] = [];
  recommendedProducts: ProductCardDto[] = [];
  isLoadingSuggestions = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.setUserContext();

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const productId = Number(params.get('id'));

        if (!productId) {
          this.errorMessage = 'Invalid product id.';
          this.product = null;
          this.isLoadingProduct = false;
          this.cdr.markForCheck();
          return;
        }

        this.loadProduct(productId);
      });
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  // Product Details
  loadProduct(productId: number): void {

    this.product = null;
    this.userReview = null;
    this.reviewSuccessMessage = '';
    this.reviewErrorMessage = '';
    this.isLoadingReviews = false;
    this.relatedProducts = [];
    this.recommendedProducts = [];
    this.isLowStockValue = false;
    this.currentImageIndex = 0;
    this.currentImageUrl = 'assets/images/no-image.png';

    this.isLoadingProduct = true;

    this.errorMessage = '';

    this.productService
      .getProductById(productId)

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isLoadingProduct = false;

          this.cdr.markForCheck();
        })
      )

      .subscribe({

        next: (response) => {

          if (
            response.isSuccess &&
            response.data
          ) {

            this.product =
              response.data;

            this.quantity = 1;

            // Image
            if (
              this.product.imagesNames
                ?.length
            ) {

              this.currentImageUrl =
                this.product
                  .imagesNames[0];
            }

            // Precomputed Values
            this.formattedPrice =
              new Intl.NumberFormat(
                'en-US',
                {
                  style: 'currency',
                  currency: 'USD',
                }
              ).format(
                this.product.price
              );

            this.formattedDate =
              new Date(
                this.product.createdAt
              ).toLocaleDateString();

            this.isLowStockValue =
              this.product.stockQuantity <=
              3;

            this.loadSuggestions();

            return;
          }

          this.errorMessage =
            'Product not found.';
        },

        error: (err) => {

          console.error(
            'Product details error:',
            err
          );

          this.errorMessage =
            'Failed to load product.';
        },
      });
  }

  // Image Gallery
  nextImage(): void {

    if (
      !this.product?.imagesNames
        ?.length
    ) {
      return;
    }

    this.currentImageIndex =
      (
        this.currentImageIndex + 1
      ) %
      this.product.imagesNames
        .length;

    this.currentImageUrl =
      this.product.imagesNames[
      this.currentImageIndex
      ];

    this.cdr.markForCheck();
  }

  previousImage(): void {

    if (
      !this.product?.imagesNames
        ?.length
    ) {
      return;
    }

    this.currentImageIndex =
      (
        this.currentImageIndex -
        1 +
        this.product.imagesNames
          .length
      ) %
      this.product.imagesNames
        .length;

    this.currentImageUrl =
      this.product.imagesNames[
      this.currentImageIndex
      ];

    this.cdr.markForCheck();
  }

  selectImage(index: number): void {

    if (
      !this.product?.imagesNames
        ?.length
    ) {
      return;
    }

    this.currentImageIndex =
      index;

    this.currentImageUrl =
      this.product.imagesNames[
      this.currentImageIndex
      ];

    this.cdr.markForCheck();
  }

  // Quantity
  increaseQuantity(): void {

    if (!this.product) {
      return;
    }

    if (
      this.quantity <
      this.product.stockQuantity
    ) {

      this.quantity++;

      this.cdr.markForCheck();
    }
  }

  decreaseQuantity(): void {

    if (this.quantity > 1) {

      this.quantity--;

      this.cdr.markForCheck();
    }
  }

  // cart
  onAddToCart(): void {

    if (
      !this.product ||
      this.product.stockQuantity <= 0
    ) {
      return;
    }

    this.isAddingToCart = true;

    this.cartService
      .addToCart(
        this.product.productId,
        this.quantity
      )

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isAddingToCart = false;

          this.cdr.markForCheck();
        })
      )

      .subscribe({

        next: () => {

          this.quantity = 1;

          this.cdr.markForCheck();
        },

        error: (err) => {

          console.error(
            'Add to cart error:',
            err
          );
        },
      });
  }

  // Reviews
  private setUserContext(): void {

    this.isLoggedIn =
      this.authService.isLoggedIn();

    this.currentUserName =
      this.authService.session()?.email ??
      this.authService.session()?.fullName ??
      '';
  }

  onReviewAdded(
    review: ReviewDto
  ): void {

    this.reviewErrorMessage = '';

    this.reviewList?.retryLoadReviews();

    this.cdr.markForCheck();
  }

  onReviewUpdated(review: ReviewDto): void {
    this.reviewErrorMessage = '';

    this.reviewList?.retryLoadReviews();

    this.cdr.markForCheck();
  }

  onReviewError(message: string): void {

    this.reviewSuccessMessage = '';

    this.reviewErrorMessage =
      message;

    this.cdr.markForCheck();
  }

  onReviewSuccess(message: string): void {

    this.reviewErrorMessage = '';

    this.reviewSuccessMessage =
      message;

    this.cdr.markForCheck();
  }

  onDeleteReview(event: {
    productId: number;
    reviewId: number;
    index: number;
  }): void {

    this.reviewService
      .deleteReview(
        event.productId,
        event.reviewId
      )

      .pipe(takeUntil(this.destroy$))

      .subscribe({

        next: () => {

          this.reviewErrorMessage = '';

          this.reviewSuccessMessage =
            'Review deleted.';

          this.reviewList?.retryLoadReviews();

          this.cdr.markForCheck();
        },

        error: (err) => {

          console.error(
            'Failed to delete review:',
            err
          );

          this.reviewErrorMessage =
            'Failed to delete review.';

          this.cdr.markForCheck();
        },
      });
  }

  onReviewsLoadingChange(isLoading: boolean): void {
    this.isLoadingReviews = isLoading;
  }

  onUserReviewChange(review: ReviewDto | null): void {
    this.userReview = review;
    this.cdr.markForCheck();
  }

  // Related products
  private loadSuggestions(): void {

    if (!this.product) {
      return;
    }

    const filter: ProductFilterDto = {
      page: 1,
      pageSize: 24,
      sortBy: 'createdAt',
      order: 'desc',
    };

    this.isLoadingSuggestions = true;

    this.productService
      .getAllProducts(filter)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.isLoadingSuggestions = false;
          this.cdr.markForCheck();
        })
      )

      .subscribe({

        next: (response) => {

          if (response.isSuccess && response.data) {
            const data:
              ProductListResponse =
              response.data;

            const candidates =
              data.products.filter(
                (item) =>
                  item.productId !==
                  this.product?.productId
              );

            const related =
              candidates
                .filter((item) => item.categoryName === this.product?.categoryName)
                .slice(0, 6);

            const relatedIds =
              new Set(related.map((item) => item.productId)
              );

            const recommended =
              candidates
                .filter(
                  (item) => !relatedIds.has(item.productId))
                .slice(0, 6);

            this.relatedProducts =
              related.map((item) => this.mapToCard(item));

            this.recommendedProducts =
              recommended.map((item) => this.mapToCard(item));

            return;
          }
          this.relatedProducts = [];
          this.recommendedProducts = [];
        },

        error: (err) => {
          console.error('Related products error:', err);

          this.relatedProducts = [];

          this.recommendedProducts = [];
        },
      });
  }

  private mapToCard(product: ProductDto): ProductCardDto {
    return {
      ...product,
      imageUrl:
        product.imagesNames?.length
          ? product.imagesNames[0]
          : 'assets/images/no-image.png',
      shortDescription:
        product.description
          ? product.description.slice(0, 90)
          : '',
      formattedPrice:
        new Intl.NumberFormat(
          'en-US',
          {
            style: 'currency',
            currency: 'USD',
          }
        ).format(product.price),
    };
  }

  trackByProductId(index: number, item: ProductCardDto): number {
    return item.productId;
  }

  scrollTrack(track: HTMLElement | null, direction: number): void {

    if (!track) {
      return;
    }

    const scrollAmount =
      Math.max(track.clientWidth * 0.8, 260
      );

    track.scrollBy({
      left: scrollAmount * direction, behavior: 'smooth',
    });
  }

  //Navigation
  goBack(): void {
    this.router.navigate(['/products']);
  }


  addRelatedToCart(product: ProductCardDto): void {
    if (!product || product.stockQuantity <= 0) {
      return;
    }

    this.cartService.addToCart(product.productId, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`${product.name} added to cart`);
        },
        error: (err) => {
          console.error('Add related product error:', err);
        },
      });
  }

}
