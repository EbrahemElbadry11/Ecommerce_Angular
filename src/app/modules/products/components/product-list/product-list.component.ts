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

    this.loadProducts();
  }

  onPriceChange(): void {
    if (this.minPrice !== undefined && this.minPrice !== null && typeof this.minPlaceholderPrice === 'number') {
      if (this.minPrice < this.minPlaceholderPrice) {
        this.minPrice = this.minPlaceholderPrice;
      }
    }
    if (this.maxPrice !== undefined && this.maxPrice !== null && typeof this.maxPlaceholderPrice === 'number') {
      if (this.maxPrice > this.maxPlaceholderPrice) {
        this.maxPrice = this.maxPlaceholderPrice;
      }
    }
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
      alert(`Only ${product.stockQuantity} items available in stock.`);
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
            this.cartService.currentCart = res.data ?? null;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          console.error('Increment cart error:', err);
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
              this.cartService.currentCart = res.data ?? null;
              this.cdr.markForCheck();
            });
          },
          error: (err) => {
            console.error('Remove item error:', err);
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
              this.cartService.currentCart = res.data ?? null;
              this.cdr.markForCheck();
            });
          },
          error: (err) => {
            console.error('Decrement cart error:', err);
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

            this.cartService.currentCart =
              res.data ?? null;
            this.cdr.markForCheck();
          });
        console.log(
          `${product.name} added to cart`
        );
      },
      error: (err) => {
        console.error(
          'Add to cart error:',
          err
        );
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
