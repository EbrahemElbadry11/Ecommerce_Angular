import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../products/services/product.service';
import { CategoryService } from '../../services/category.service';
import { ProductDto, ProductFilterDto, ProductListResponse } from '../../../products/models/product.model';
import { CategoryDto } from '../../models/category.model';
import { SHARED_IMPORTS } from '../../../../shared/shared-imports';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ...SHARED_IMPORTS],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css'],
})
export class CategoryDetailComponent implements OnInit, OnDestroy {
  // Data
  category: CategoryDto | null = null;
  products: ProductDto[] = [];
  allCategories: CategoryDto[] = [];

  // Filter state
  categoryId: number | null = null;
  searchText: string = '';
  minPrice: number = 0;
  maxPrice: number = 10000;
  sortBy: 'name' | 'price' | 'createdAt' = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage: number = 1;
  pageSize: number = 12;

  // UI states
  isLoadingCategory: boolean = false;
  isLoadingProducts: boolean = false;
  errorMessage: string = '';
  showFilters: boolean = false;

  // Image API URL
  private apiUrl: string = 'https://localhost:7017'; // غير البورت حسب اللي عندك

  // Auto-unsubscribe
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAllCategories();
    this.setupSearchDebounce();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categoryId = +params['id'];
      if (this.categoryId) {
        this.loadCategoryDetails(this.categoryId);
        this.loadProductsByCategory(this.categoryId);
        this.cd.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        if (this.categoryId) {
          this.loadProductsByCategory(this.categoryId);
          this.cd.markForCheck();
        }
      });
  }

  /**
   * Load all categories for the sidebar
   */
  private loadAllCategories(): void {
    this.categoryService
      .getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess && response.data) {
            this.allCategories = Array.isArray(response.data) 
              ? response.data 
              : (response.data.categories || response.data.Categories || []);
            this.cd.markForCheck();
          }
        },
        error: (err: any) => {
          console.error('Failed to load categories:', err);
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Load category details
   */
  private loadCategoryDetails(id: number): void {
    this.isLoadingCategory = true;

    this.categoryService
      .getCategoryById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess && response.data) {
            this.category = response.data;
            this.cd.markForCheck();
          }
          this.isLoadingCategory = false;
        },
        error: (err: any) => {
          console.error('Failed to load category:', err);
          this.isLoadingCategory = false;
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Load products by category
   */
  private loadProductsByCategory(id: number): void {
    this.isLoadingProducts = true;
    this.errorMessage = '';

    const filter: ProductFilterDto = {
      categoryId: id,
      search: this.searchText.trim() || undefined,
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
        next: (response: any) => {
          if (response.isSuccess && response.data) {
            const data = response.data as ProductListResponse;
            this.products = data.products ?? [];
          } else {
            this.products = [];
          }
          this.isLoadingProducts = false;
          this.cd.markForCheck();
        },
        error: (err: any) => {
          console.error('Failed to load products:', err);
          this.errorMessage = 'Failed to load products. Please try again.';
          this.products = [];
          this.isLoadingProducts = false;
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Handle search change
   */
  onSearchChange(searchValue: string): void {
    this.searchText = searchValue;
    this.searchSubject$.next(searchValue);
  }

  /**
   * Change category
   */
  changeCategory(newCategoryId: number): void {
    this.router.navigate(['/categories', newCategoryId]);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage = 1;
    if (this.categoryId) {
      this.loadProductsByCategory(this.categoryId);
    }
  }

  /**
   * Navigate to product detail
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * Go back to categories
   */
  goBack(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onFilterChange();
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.onFilterChange();
    }
  }

  /**
   * Check if has next page
   */
  hasNextPage(): boolean {
    return this.products.length === this.pageSize;
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.searchText = '';
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    if (this.categoryId) {
      this.loadProductsByCategory(this.categoryId);
    }
  }

  /**
   * Format price
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  /**
   * Truncate description
   */
  truncateDescription(desc: string | null, length: number = 100): string {
    if (!desc) return '';
    return desc.length > length ? desc.substring(0, length) + '...' : desc;
  }

  /**
   * Toggle filters on mobile
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * ✅ دالة الحصول على رابط صورة الكاتيجوري (معدلة)
   */
  getCategoryImageUrl(icon: string | null | undefined): string {
    if (!icon) {
      return '';
    }

    // لو كان رابط خارجي (http/https)
    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return icon;
    }

    // لو كان Base64
    if (icon.startsWith('data:image')) {
      return icon;
    }

    // لو كان مسار من API
    if (icon.startsWith('/')) {
      return `${this.apiUrl}${icon}`;
    }

    // مسار نسبي
    return `${this.apiUrl}/${icon}`;
  }

  /**
   * ✅ دالة الحصول على رابط صورة المنتج (مضافة جديدة)
   */
  getProductImageUrl(imageName: string | null | undefined): string {
    if (!imageName) {
      return '';
    }

    // لو كان رابط خارجي
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }

    // لو كان Base64
    if (imageName.startsWith('data:image')) {
      return imageName;
    }

    // مسار صور المنتجات
    return `${this.apiUrl}/Images/Products/${imageName}`;
  }

  /**
   * ✅ دالة معالجة خطأ تحميل الصورة
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-image.png';
    img.onerror = null;
    this.cd.markForCheck();
  }

  /**
   * ✅ دالة معالجة خطأ صورة الكاتيجوري
   */
  onCategoryImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const fallback = document.createElement('div');
      fallback.className = 'category-icon-fallback';
      fallback.textContent = '📦';
      parent.appendChild(fallback);
    }
  }
}