import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../../categories/services/category.service';
import { ProductDto, ProductFilterDto } from '../models/product.model';
import { CategoryDto } from '../../categories/models/category.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Data
  products: ProductDto[] = [];
  categories: CategoryDto[] = [];

  // Filter state
  searchText: string = '';
  selectedCategory: number | null = null;
  minPrice: number = 0;
  maxPrice: number = 10000;
  sortBy: 'name' | 'price' | 'createdAt' = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage: number = 1;
  pageSize: number = 12;
  totalProducts: number = 0;

  // UI states
  isLoading: boolean = false;
  errorMessage: string = '';
  showFilters: boolean = false;

  // Auto-unsubscribe
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchDebounce();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup search debounce to avoid excessive API calls
   */
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only fire if search text changed
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page
        this.loadProducts();
      });
  }

  /**
   * Load categories for the filter dropdown
   */
  private loadCategories(): void {
    this.categoryService
      .getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.categories = response.data;
          }
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
        },
      });
  }

  /**
   * Load products with current filters and pagination
   */
  private loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: ProductFilterDto = {
      search: this.searchText.trim() || undefined,
      categoryId: this.selectedCategory || undefined,
      minPrice: this.minPrice > 0 ? this.minPrice : undefined,
      maxPrice: this.maxPrice < 10000 ? this.maxPrice : undefined,
      sortBy: this.sortBy,
      order: this.sortOrder,
      page: this.currentPage,
      pageSize: this.pageSize,
    };

    this.productService
      .getAllProducts(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.products = response.data;
            // Assuming total count is in response or use products.length
            this.totalProducts = response.data.length;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.errorMessage =
            'Failed to load products. Please try again later.';
          this.products = [];
          this.isLoading = false;
        },
      });
  }

  /**
   * Handle search input with debounce
   */
  onSearchChange(searchValue: string): void {
    this.searchText = searchValue;
    this.searchSubject$.next(searchValue);
  }

  /**
   * Handle category filter change
   */
  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Handle price range changes
   */
  onPriceChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Handle sort change
   */
  onSortChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Handle sort order change (asc/desc)
   */
  onSortOrderChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  /**
   * Check if there's a next page
   */
  hasNextPage(): boolean {
    return this.products.length === this.pageSize;
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  /**
   * Toggle filter panel on mobile
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Clear all filters and reset
   */
  resetFilters(): void {
    this.searchText = '';
    this.selectedCategory = null;
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadProducts();
  }

  /**
   * Calculate display price (format currency)
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  /**
   * Truncate description for grid display
   */
  truncateDescription(desc: string | null, length: number = 100): string {
    if (!desc) return '';
    return desc.length > length ? desc.substring(0, length) + '...' : desc;
  }

  /**
   * Navigate to product detail page
   * Will be used for Feature 3: Product Detail Page with Reviews
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }
}
