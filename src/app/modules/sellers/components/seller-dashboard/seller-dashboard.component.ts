import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import { ProductDto } from '../../../products/models/product.model';

import { ProductService } from '../../../products/services/product.service';

import { SellerResponseDto } from '../../models/seller.model';

import { SellerService } from '../../services/seller.service';

import { ProductImageUploadComponent } from '../../../products/components/product-image-upload/product-image-upload.component';

@Component({
  selector: 'app-seller-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    ProductImageUploadComponent
  ],

  templateUrl:
    './seller-dashboard.component.html',

  styleUrls: [
    './seller-dashboard.component.css'
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})

export class SellerDashboardComponent
  implements OnInit, OnDestroy {

  seller: SellerResponseDto | null = null;

  products: ProductDto[] = [];

  isLoadingSeller = false;

  isLoadingProducts = false;

  isDeletingProductId:
    number | null = null;

  successMessage = '';

  errorMessage = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    private sellerService: SellerService,
    public productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSellerAndProducts();
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  // LOAD SELLER + PRODUCTS

  private loadSellerAndProducts(): void {

    this.isLoadingSeller = true;

    this.errorMessage = '';

    this.cdr.markForCheck();

    this.sellerService

      .getCurrentSellerProfile()

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isLoadingSeller = false;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (
            response.isSuccess &&
            response.data
          ) {

            this.seller =
              response.data;

            this.loadProducts();
          }
          else {

            this.seller = null;

            this.errorMessage =
              'Seller profile not found. Register your store first.';
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load seller profile:',
            error
          );

          this.errorMessage =
            'Failed to load seller profile. Please try again.';

          this.cdr.detectChanges();
        },
      });
  }

  // LOAD PRODUCTS

  private loadProducts(): void {

    this.isLoadingProducts = true;

    this.cdr.markForCheck();

    this.productService

      .getProductsBySeller()

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isLoadingProducts = false;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (
            response.isSuccess &&
            response.data
          ) {

            this.products =
              response.data;
          }
          else {

            this.products = [];
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load seller products:',
            error
          );

          this.errorMessage =
            'Failed to load your products. Please try again.';

          this.products = [];

          this.cdr.detectChanges();
        },
      });
  }

  // RETRY

  retry(): void {

    this.loadSellerAndProducts();
  }

  // NAVIGATION

  viewProduct(productId: number): void {

    this.router.navigate([
      '/products',
      productId
    ]);
  }

  editProduct(productId: number): void {

    this.router.navigate([
      '/products',
      productId,
      'edit'
    ]);
  }

  // DELETE PRODUCT

  deleteProduct(product: ProductDto): void {

    const confirmed =
      window.confirm(
        `Delete ${product.name}? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    this.isDeletingProductId =
      product.productId;

    this.successMessage = '';

    this.errorMessage = '';

    this.cdr.markForCheck();

    this.productService

      .deleteProduct(product.productId)

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isDeletingProductId = null;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (response.isSuccess) {

            this.products =
              this.products.filter(
                (item) =>
                  item.productId !==
                  product.productId
              );

            this.successMessage =
              'Product deleted successfully.';
          }
          else {

            this.errorMessage =
              'Unable to delete this product.';
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to delete product:',
            error
          );

          this.errorMessage =
            'Failed to delete product. Please try again.';

          this.cdr.detectChanges();
        },
      });
  }

  // IMAGE UPLOAD

  onImageUploaded(productId: number): void {

    if (!this.seller) {
      return;
    }

    this.successMessage =
      'Product image uploaded successfully.';

    this.errorMessage = '';

    this.loadProducts();

    this.cdr.detectChanges();
  }

  onImageError(message: string): void {

    this.errorMessage = message;

    if (message) {

      this.successMessage = '';
    }

    this.cdr.detectChanges();
  }

  // HELPERS

  isDeleting(productId: number): boolean {

    return (
      this.isDeletingProductId ===
      productId
    );
  }

  formatCurrency(value: number): string {

    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    ).format(value || 0);
  }

  formatDate(date: string): string {

    return new Date(date)
      .toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
      );
  }

  // GETTERS

  get totalProducts(): number {

    return (
      this.seller?.totalProducts ??
      this.products.length
    );
  }

  get totalEarnings(): number {

    return (
      this.seller?.totalEarnings ?? 0
    );
  }

  get approvedLabel(): string {

    return this.seller?.isApproved
      ? 'Approved'
      : 'Pending approval';
  }
}
