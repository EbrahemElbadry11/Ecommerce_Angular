import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs';

import { ProductService } from '../../services/product.service';

import { CategoryService } from '../../../categories/services/category.service';

import { finalize } from 'rxjs/operators';


import {
  ProductCardDto,
  ProductDto,
  ProductFilterDto,
  ProductListResponse,
} from '../../models/product.model';

import { CategoryDto } from '../../../categories/models/category.model';

@Component({
  selector: 'app-product-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl:
    './product-list.component.html',

  styleUrls: [
    './product-list.component.css',
  ],
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: ProductCardDto[] = [];

  categories: CategoryDto[] = [];

  searchText = '';

  selectedCategory?: number;

  minPrice?: number;

  maxPrice?: number;

  sortBy:
    | 'name'
    | 'price'
    | 'createdAt' = 'createdAt';

  sortOrder:
    | 'asc'
    | 'desc' = 'desc';

  currentPage = 1;

  pageSize = 12;

  totalProducts = 0;

  totalPages = 0;

  isLoading = false;

  errorMessage = '';

  showFilters = false;

  private requestedCategoryName:
    string | null = null;

  private destroy$ =
    new Subject<void>();

  private searchSubject$ =
    new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.listenToQueryParams();

    this.loadCategories();

    this.setupSearchDebounce();

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  /**
   * Search Debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;

        this.loadProducts();
      });
  }

  /**
   * Categories
   */
  private loadCategories(): void {
    this.categoryService
      .getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (
            response.isSuccess &&
            response.data
          ) {
            this.categories =
              response.data;

            this.applyCategoryFromQuery();
          }
        },

        error: (err) => {
          console.error(
            'Categories error:',
            err
          );
        },
      });
  }

  private listenToQueryParams(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const category =
          params.get('category');

        this.requestedCategoryName =
          category?.trim() || null;

        this.applyCategoryFromQuery();
      });
  }

  private applyCategoryFromQuery(): void {
    if (
      !this.requestedCategoryName ||
      !this.categories.length
    ) {
      return;
    }

    const normalized =
      this.requestedCategoryName
        .toLowerCase();

    const matchedCategory =
      this.categories.find(
        (category) =>
          category.name
            .toLowerCase() ===
          normalized
      );

    if (
      matchedCategory &&
      this.selectedCategory !==
      matchedCategory.categoryId
    ) {
      this.selectedCategory =
        matchedCategory.categoryId;

      this.currentPage = 1;

      this.loadProducts();
    }
  }

  /**
   * Products
   */

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('🔍 A — loadProducts called, isLoading=true');

    const filter: ProductFilterDto = {
      search:
        this.searchText.trim() ||
        undefined,
      categoryId:
        this.selectedCategory,
      minPrice:
        this.minPrice,
      maxPrice:
        this.maxPrice,
      sortBy:
        this.sortBy,
      order:
        this.sortOrder,
      page:
        this.currentPage,
      pageSize:
        this.pageSize,
    };

    this.productService
      .getAllProducts(filter)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🔍 D — finalize fired, setting isLoading=false');
          // ALWAYS runs
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          console.log('🔍 C-next — got response', response);
          if (
            response.isSuccess &&
            response.data
          ) {

            const data:
              ProductListResponse =
              response.data;

            this.products =
              data.products.map(
                (product) => ({

                  ...product,

                  imageUrl:
                    product.imagesNames?.length
                      ? product.imagesNames[0]
                      : 'assets/images/no-image.png',

                  shortDescription:
                    product.description
                      ? product.description.slice(0, 100)
                      : '',

                  formattedPrice:
                    new Intl.NumberFormat(
                      'en-US',
                      {
                        style: 'currency',
                        currency: 'USD',
                      }
                    ).format(product.price),

                })
              );

            this.totalProducts =
              data.totalCount;

            this.totalPages =
              Math.ceil(
                data.totalCount /
                data.pageSize
              );

            return;
          }

          this.products = [];

          this.totalProducts = 0;

          this.totalPages = 0;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('🔍 C-error — got error', err);

          console.error('Products error:', err);

          this.errorMessage =
            'Failed to load products.';
          this.cdr.detectChanges();
        },
      });
  }


  /**
   * Search
   */
  onSearchChange(
    value: string
  ): void {
    this.searchText = value;

    this.searchSubject$.next(value);
  }

  /**
   * Filters
   */
  onCategoryChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  onPriceChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  onSortOrderChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  /**
   * Pagination
   */
  previousPage(): void {
    if (
      this.currentPage > 1
    ) {
      this.currentPage--;

      this.loadProducts();
    }
  }

  nextPage(): void {
    if (
      this.currentPage <
      this.totalPages
    ) {
      this.currentPage++;

      this.loadProducts();
    }
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    return (
      this.currentPage <
      this.totalPages
    );
  }

  /**
   * Filters
   */
  toggleFilters(): void {
    this.showFilters =
      !this.showFilters;
  }

  resetFilters(): void {

    this.searchText = '';

    this.selectedCategory =
      undefined;

    this.minPrice = undefined;

    this.maxPrice = undefined;

    this.sortBy = 'createdAt';

    this.sortOrder = 'desc';

    this.currentPage = 1;

    this.loadProducts();
  }

  /**
   * Navigation
   */
  viewProduct(
    productId: number
  ): void {
    this.router.navigate([
      '/products',
      productId,
    ]);
  }

  /**
   * TrackBy
   */
  trackByProductId(
    index: number,
    product: ProductDto
  ): number {
    return product.productId;
  }

  /**
   * Empty State
   */
  get isEmpty(): boolean {
    return (
      !this.isLoading &&
      this.products.length === 0
    );
  }
}
