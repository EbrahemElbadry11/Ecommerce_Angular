import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { CategoryDto } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { SellerResponseDto } from '../../../sellers/models/seller.model';
import { SellerService } from '../../../sellers/services/seller.service';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  templateUrl: './product-create-page.component.html',
  styleUrls: ['./product-create-page.component.css'],
})
export class ProductCreatePageComponent implements OnInit, OnDestroy {
  seller: SellerResponseDto | null = null;
  categories: CategoryDto[] = [];
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private sellerService: SellerService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading = true;

    forkJoin({
      seller: this.sellerService.getCurrentSellerProfile(),
      categories: this.categoryService.getAllCategories(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.seller.isSuccess && result.seller.data) {
            this.seller = result.seller.data;
          } else {
            this.errorMessage = 'Seller profile not found. Register your store first.';
          }

          this.categories =
            result.categories.isSuccess && result.categories.data
              ? result.categories.data
              : [];
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load product create page data:', error);
          this.errorMessage = 'Failed to load product form data. Please try again.';
        },
      });
  }

  onSaved(): void {
    this.successMessage = 'Product created successfully.';
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