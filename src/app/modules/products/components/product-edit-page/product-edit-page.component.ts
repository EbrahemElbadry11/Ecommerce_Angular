import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  forkJoin,
  Subject,
  takeUntil,
} from 'rxjs';

import { CategoryDto } from '../../../categories/models/category.model';

import { CategoryService } from '../../../categories/services/category.service';

import { ProductDto } from '../../models/product.model';

import { ProductService } from '../../services/product.service';

import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductFormComponent,
  ],
  templateUrl:
    './product-edit-page.component.html',
  styleUrls: [
    './product-edit-page.component.css',
  ],
})
export class ProductEditPageComponent
  implements OnInit, OnDestroy {
  product: ProductDto | null = null;

  categories: CategoryDto[] = [];

  isLoading = false;

  successMessage = '';

  errorMessage = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  /**
   * Load Product + Categories
   */
  private loadInitialData(): void {
    const productId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (
      !productId ||
      isNaN(productId)
    ) {
      this.errorMessage =
        'Invalid product id.';

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.successMessage = '';

    forkJoin({
      product:
        this.productService.getProductById(
          productId
        ),

      categories:
        this.categoryService.getAllCategories(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;

          // Product
          if (
            result.product.isSuccess &&
            result.product.data
          ) {
            this.product =
              result.product.data;
          } else {
            this.errorMessage =
              'Product not found.';
          }

          // Categories
          if (
            result.categories.isSuccess &&
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
            'Failed to load edit page:',
            error
          );

          this.errorMessage =
            'Failed to load product data. Please try again.';
        },
      });
  }

  /**
   * Product Updated
   */
  onSaved(): void {
    this.successMessage =
      'Product updated successfully.';

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
   * Back Navigation
   */
  goBack(): void {
    this.router.navigate([
      '/sellers/dashboard',
    ]);
  }

  /**
   * Check Page State
   */
  get hasError(): boolean {
    return !!this.errorMessage;
  }

  /**
   * Check Product Exists
   */
  get hasProduct(): boolean {
    return !!this.product;
  }
}
