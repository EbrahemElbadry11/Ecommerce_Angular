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

import { CartService } from '../../../cart/services/cart.service';

import { ToastService } from '../../../../../services/toast';

import { finalize } from 'rxjs/operators';


import {
  ProductCardDto,
  ProductDto,
  ProductFilterDto,
  normalizeProductListResponse,
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

  // Global min/max prices from ALL filtered products (persists across pages)
  globalMinPrice: number = 0;

  globalMaxPrice: number = 999999;

  minPlaceholderPrice: number | string = 'Min';
  
  maxPlaceholderPrice: number | string = 'Max';

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

  private addingToCartIds = new Set<number>();

  private requestedCategoryName:
    string | null = null;

  private destroy$ =
    new Subject<void>();

  private searchSubject$ =
    new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.listenToQueryParams();

    this.loadCategories();

    this.setupSearchDebounce();

    this.loadPriceRange();

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  //search
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;

        this.loadPriceRange();

        this.loadProducts();
      });
  }

  //categories
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

  // Products

  // Load price range from ALL products matching current search/category (without price filters)
  private loadPriceRange(): void {
    const priceRangeFilter: ProductFilterDto = {
      search:
        this.searchText.trim() ||
        undefined,
      categoryId:
        this.selectedCategory,
      // NO minPrice/maxPrice filters - we want the full range
      sortBy: 'price',
      order: 'asc',
      page: 1,
      pageSize: 99999, // Get all products to calculate accurate range
    };

    this.productService
      .getAllProducts(priceRangeFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (
            response.isSuccess &&
            response.data
          ) {
            const data = normalizeProductListResponse(response.data);
            if (data.products.length > 0) {
              const prices = data.products.map(p => p.price);
              this.globalMinPrice = Math.min(...prices);
              this.globalMaxPrice = Math.max(...prices);
            } else {
              this.globalMinPrice = 0;
              this.globalMaxPrice = 999999;
            }
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to load price range:', err);
        },
      });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('🔍 A — loadProducts called, isLoading=true');

    const filter: ProductFilterDto = {
      search: this.searchText.trim() || undefined,
      categoryId: this.selectedCategory,
      minPrice: (this.minPrice !== null && this.minPrice !== undefined && !isNaN(this.minPrice)) ? this.minPrice : undefined,
      maxPrice: (this.maxPrice !== null && this.maxPrice !== undefined && !isNaN(this.maxPrice)) ? this.maxPrice : undefined,
      sortBy: this.sortBy,
      order: this.sortOrder,
      page: this.currentPage,
      pageSize: this.pageSize,
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

            const data = normalizeProductListResponse(response.data);

            this.products =
              data.products.map(
                (product) => ({

                  ...product,

                  imageUrl:
                    product.imagesNames?.length
                      ? this.productService.getImageUrl(
                        product.imagesNames[0]
                      )
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

            if (this.products.length > 0) {
              const prices = this.products.map(p => p.price);
              this.minPlaceholderPrice = Math.min(...prices);
              this.maxPlaceholderPrice = Math.max(...prices);
            } else {
              this.minPlaceholderPrice = 'Min';
              this.maxPlaceholderPrice = 'Max';
            }

            this.totalProducts = data.totalCount;

            this.totalPages =
              data.totalCount > 0
                ? Math.max(1, Math.ceil(data.totalCount / this.pageSize))
                : 0;

            return;
          }

          this.products = [];

          this.totalProducts = 0;

          this.totalPages = 0;
          this.minPlaceholderPrice = 'Min';
          this.maxPlaceholderPrice = 'Max';
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


  // Search
  onSearchChange(
    value: string
  ): void {
    this.searchText = value;

    this.searchSubject$.next(value);
  }

  // Filter & Sort Changes
  onCategoryChange(): void {
    this.currentPage = 1;

    this.loadPriceRange();

    this.loadProducts();
  }

  onPriceChange(): void {
    // Validate and clamp price inputs to allowed ranges
    this.validateAndClampPrices();

    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Validate and clamp price inputs to ensure they're within valid ranges
   */
  private validateAndClampPrices(): void {
    const globalMin = this.globalMinPrice;
    const globalMax = this.globalMaxPrice;

    let hasChanged = false;

    // Ensure global limits are valid
    if (globalMin > globalMax) {
      console.warn('Invalid global price range:', { globalMin, globalMax });
      return;
    }

    // Validate and clamp min price
    if (this.minPrice !== undefined && this.minPrice !== null && !isNaN(this.minPrice)) {
      let newMinPrice = this.minPrice;

      // Clamp to global minimum
      if (newMinPrice < globalMin) {
        newMinPrice = globalMin;
        hasChanged = true;
      }

      // Clamp to global maximum
      if (newMinPrice > globalMax) {
        newMinPrice = globalMax;
        hasChanged = true;
      }

      // Ensure min doesn't exceed max (if max is set)
      if (this.maxPrice !== undefined && this.maxPrice !== null && !isNaN(this.maxPrice)) {
        if (newMinPrice > this.maxPrice) {
          newMinPrice = this.maxPrice;
          hasChanged = true;
        }
      }

      if (hasChanged) {
        this.minPrice = newMinPrice;
      }
    }

    // Validate and clamp max price
    if (this.maxPrice !== undefined && this.maxPrice !== null && !isNaN(this.maxPrice)) {
      let newMaxPrice = this.maxPrice;

      // Clamp to global minimum
      if (newMaxPrice < globalMin) {
        newMaxPrice = globalMin;
        hasChanged = true;
      }

      // Clamp to global maximum
      if (newMaxPrice > globalMax) {
        newMaxPrice = globalMax;
        hasChanged = true;
      }

      // Ensure max doesn't go below min (if min is set)
      if (this.minPrice !== undefined && this.minPrice !== null && !isNaN(this.minPrice)) {
        if (newMaxPrice < this.minPrice) {
          newMaxPrice = this.minPrice;
          hasChanged = true;
        }
      }

      if (hasChanged) {
        this.maxPrice = newMaxPrice;
      }
    }

    // Trigger UI update if any corrections were made
    if (hasChanged) {
      this.cdr.detectChanges();
    }
  }

  getMinPriceInputLimit(): number {
    return this.globalMinPrice;
  }

  getMaxPriceInputLimitForMin(): number {
    // If user has set a max price, min cannot exceed it
    if (this.maxPrice !== undefined && this.maxPrice !== null) {
      return this.maxPrice;
    }
    // Otherwise, max allowed is the global maximum
    return this.globalMaxPrice;
  }

  getMinPriceInputLimitForMax(): number {
    // If user has set a min price, max cannot go below it
    if (this.minPrice !== undefined && this.minPrice !== null) {
      return this.minPrice;
    }
    // Otherwise, min allowed is the global minimum
    return this.globalMinPrice;
  }

  getMaxPriceInputLimit(): number {
    // Return globalMaxPrice (max of ALL filtered products, not just current page)
    return this.globalMaxPrice;
  }


  onSortChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  onSortOrderChange(): void {
    this.currentPage = 1;

    this.loadProducts();
  }

  //pagination
  previousPage(): void {
    if (
      this.currentPage > 1
    ) {
      this.currentPage--;

      this.loadProducts();
    }
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage++;

    this.loadProducts();
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    if (this.products.length < this.pageSize) {
      return false;
    }

    if (this.totalProducts > 0) {
      return this.currentPage * this.pageSize < this.totalProducts;
    }

    return this.currentPage < this.totalPages;
  }


  //filter toggle
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

    this.globalMinPrice = 0;

    this.globalMaxPrice = 999999;

    this.loadPriceRange();

    this.loadProducts();
  }

  // navigate to product detail
  viewProduct(
    productId: number
  ): void {
    this.router.navigate([
      '/products',
      productId,
    ]);
  }

  getCartQuantity(productId: number): number {
    return this.cartService.getCartItemQuantity(productId);
  }

  incrementCart(product: ProductCardDto): void {
    const currentQty = this.getCartQuantity(product.productId);
    if (currentQty >= product.stockQuantity) {
      this.toastService.show({
        type: 'warning',
        message: `Only ${product.stockQuantity} items available in stock.`
      });
      return;
    }

    if (this.addingToCartIds.has(product.productId)) {
      return;
    }

    this.addingToCartIds.add(product.productId);
    this.cdr.markForCheck();

    this.cartService.updateCart(product.productId, currentQty + 1)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.addingToCartIds.delete(product.productId);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.cartService.loadCart().subscribe((res) => {
            this.cdr.markForCheck();
          });
          this.toastService.show({
            type: 'success',
            message: `${product.name} quantity increased`
          });
        },
        error: (err) => {
          console.error('Increment cart error:', err);
          this.toastService.show({
            type: 'danger',
            message: 'Failed to update cart'
          });
        }
      });
  }

  decrementCart(product: ProductCardDto): void {
    const currentQty = this.getCartQuantity(product.productId);
    if (currentQty <= 0) {
      return;
    }

    if (this.addingToCartIds.has(product.productId)) {
      return;
    }

    this.addingToCartIds.add(product.productId);
    this.cdr.markForCheck();

    if (currentQty === 1) {
      // Remove item completely from the cart
      this.cartService.removeItem(product.productId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.addingToCartIds.delete(product.productId);
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.cartService.loadCart().subscribe((res) => {
              this.cdr.markForCheck();
            });
            this.toastService.show({
              type: 'warning',
              message: `${product.name} removed from cart`
            });
          },
          error: (err) => {
            console.error('Remove item error:', err);
            this.toastService.show({
              type: 'danger',
              message: 'Failed to remove item from cart'
            });
          }
        });
    } else {
      // Decrement quantity
      this.cartService.updateCart(product.productId, currentQty - 1)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.addingToCartIds.delete(product.productId);
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.cartService.loadCart().subscribe((res) => {
              this.cdr.markForCheck();
            });
            this.toastService.show({
              type: 'warning',
              message: `${product.name} quantity decreased`
            });
          },
          error: (err) => {
            console.error('Decrement cart error:', err);
            this.toastService.show({
              type: 'danger',
              message: 'Failed to update cart'
            });
          }
        });
    }
  }

  /// Add to Cart
  addToCart(product: ProductCardDto): void {

    if (
      !product ||
      product.stockQuantity <= 0
    ) {
      return;
    }

    if (
      this.addingToCartIds.has(
        product.productId
      )
    ) {
      return;
    }

    this.addingToCartIds.add(product.productId);
    this.cdr.markForCheck();
    this.cartService.addToCart(
      product.productId,
      1
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => {

        this.addingToCartIds.delete(
          product.productId
        );

        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        // refresh cart cache
        this.cartService.loadCart()
          .subscribe((res) => {
            this.cdr.markForCheck();
          });
        this.toastService.show({
          type: 'success',
          message: `${product.name} added to cart`
        });
      },
      error: (err) => {
        console.error(
          'Add to cart error:',
          err
        );
        this.toastService.show({
          type: 'danger',
          message: 'Failed to add item to cart'
        });
      },
    });
  }

  isAddingToCart(productId: number): boolean {
    return this.addingToCartIds.has(productId);
  }

  /// TrackBy for ngFor
  trackByProductId(
    index: number,
    product: ProductDto
  ): number {
    return product.productId;
  }

  // Helper to determine if we should show "No products found"
  get isEmpty(): boolean {
    return (
      !this.isLoading &&
      this.products.length === 0
    );
  }
}
