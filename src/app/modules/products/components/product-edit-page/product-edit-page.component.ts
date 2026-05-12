import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { CategoryDto } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { ProductDto } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  templateUrl: './product-edit-page.component.html',
  styleUrls: ['./product-edit-page.component.css'],
})
export class ProductEditPageComponent implements OnInit, OnDestroy {
  product: ProductDto | null = null;
  categories: CategoryDto[] = [];
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!productId) {
      this.errorMessage = 'Invalid product id.';
      return;
    }

    this.isLoading = true;

    forkJoin({
      product: this.productService.getProductById(productId),
      categories: this.categoryService.getAllCategories(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;

          if (result.product.isSuccess && result.product.data) {
            this.product = result.product.data;
          } else {
            this.errorMessage = 'Product not found.';
          }

          this.categories =
            result.categories.isSuccess && result.categories.data
              ? result.categories.data
              : [];
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load product edit page data:', error);
          this.errorMessage = 'Failed to load product data. Please try again.';
        },
      });
  }

  onSaved(): void {
    this.successMessage = 'Product updated successfully.';
    this.errorMessage = '';
    setTimeout(() => this.router.navigate(['/sellers/dashboard']), 1200);
  }

  onSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  onError(message: string): void {
    this.errorMessage = message;
    if (message) {
      this.successMessage = '';
    }
  }

  retry(): void {
    this.loadInitialData();
  }
}