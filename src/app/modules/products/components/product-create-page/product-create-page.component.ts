import { CommonModule } from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  forkJoin,
  Subject,
  takeUntil,
} from 'rxjs';

import { CategoryDto } from '../../../categories/models/category.model';

import { CategoryService } from '../../../categories/services/category.service';

import { SellerResponseDto } from '../../../sellers/models/seller.model';

import { SellerService } from '../../../sellers/services/seller.service';

import { ProductFormComponent } from '../product-form/product-form.component';

import { SHARED_IMPORTS } from '../../../../shared/shared-imports';

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductFormComponent,
    ...SHARED_IMPORTS,
  ],
  templateUrl:
    './product-create-page.component.html',
  styleUrls: [
    './product-create-page.component.css',
  ],
})
export class ProductCreatePageComponent
  implements OnInit, OnDestroy {
  seller: SellerResponseDto | null =
    null;

  categories: CategoryDto[] = [];

  isLoading = false;

  successMessage = '';

  errorMessage = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    private sellerService: SellerService,
    private categoryService: CategoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  /**
   * Load Seller + Categories
   */
  private loadInitialData(): void {
    this.isLoading = true;

    this.errorMessage = '';

    this.successMessage = '';

    forkJoin({
      seller:
        this.sellerService
          .getCurrentSellerProfile(),

      categories:
        this.categoryService
          .getAllCategories(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;

          // Seller
          if (
            result.seller.isSuccess &&
            result.seller.data
          ) {
            this.seller =
              result.seller.data;
          } else {
            this.errorMessage =
              'Seller profile not found. Please create your store first.';
          }

          // Categories
          if (
            result.categories
              .isSuccess &&
            result.categories.data
          ) {
            this.categories =
              result.categories.data;
          } else {
            this.categories = [];
          }
        },

        error: (error) => {
          this.isLoading = false;

          console.error(
            'Failed to load create page:',
            error
          );

          this.errorMessage =
            'Failed to load product form data. Please try again.';
        },
      });
  }

  /**
   * Product Created
   */
  onSaved(): void {
    this.successMessage =
      'Product created successfully.';

    this.errorMessage = '';

    setTimeout(() => {
      this.router.navigate([
        '/sellers/dashboard',
      ]);
    }, 1200);
  }

  /**
   * Child Success Event
   */
  onSuccess(message: string): void {
    this.successMessage = message;

    this.errorMessage = '';
  }

  /**
   * Child Error Event
   */
  onError(message: string): void {
    this.errorMessage = message;

    if (message) {
      this.successMessage = '';
    }
  }

  /**
   * Retry Loading
   */
  retry(): void {
    this.loadInitialData();
  }

  /**
   * Navigate Back
   */
  goBack(): void {
    this.router.navigate([
      '/sellers/dashboard',
    ]);
  }

  /**
   * Has Seller
   */
  get hasSeller(): boolean {
    return !!this.seller;
  }

  /**
   * Has Error
   */
  get hasError(): boolean {
    return !!this.errorMessage;
  }

  /**
   * Categories Loaded
   */
  get hasCategories(): boolean {
    return this.categories.length > 0;
  }
}
