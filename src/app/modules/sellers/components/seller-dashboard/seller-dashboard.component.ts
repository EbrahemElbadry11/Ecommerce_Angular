import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductDto } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { SellerResponseDto } from '../../models/seller.model';
import { SellerService } from '../../services/seller.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.css'],
})
export class SellerDashboardComponent implements OnInit, OnDestroy {
  seller: SellerResponseDto | null = null;
  products: ProductDto[] = [];
  isLoadingSeller: boolean = false;
  isLoadingProducts: boolean = false;
  isDeletingProductId: number | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSellerAndProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSellerAndProducts(): void {
    this.isLoadingSeller = true;
    this.errorMessage = '';

    this.sellerService
      .getCurrentSellerProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingSeller = false;
          if (response.isSuccess && response.data) {
            this.seller = response.data;
            this.loadProducts(response.data.id);
          } else {
            this.seller = null;
            this.errorMessage = 'Seller profile not found. Register your store first.';
          }
        },
        error: (error) => {
          this.isLoadingSeller = false;
          console.error('Failed to load seller profile:', error);
          this.errorMessage = 'Failed to load seller profile. Please try again.';
        },
      });
  }

  private loadProducts(sellerProfileId: number): void {
    this.isLoadingProducts = true;

    this.productService
      .getProductsBySeller(sellerProfileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.products = response.data;
          } else {
            this.products = [];
          }
          this.isLoadingProducts = false;
        },
        error: (error) => {
          this.isLoadingProducts = false;
          console.error('Failed to load seller products:', error);
          this.errorMessage = 'Failed to load your products. Please try again.';
          this.products = [];
        },
      });
  }

  retry(): void {
    this.loadSellerAndProducts();
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  deleteProduct(product: ProductDto): void {
    const confirmed = window.confirm(
      `Delete ${product.name}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.isDeletingProductId = product.productId;
    this.successMessage = '';
    this.errorMessage = '';

    this.productService
      .deleteProduct(product.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isDeletingProductId = null;
          if (response.isSuccess) {
            this.products = this.products.filter(
              (item) => item.productId !== product.productId
            );
            this.successMessage = 'Product deleted successfully.';
          } else {
            this.errorMessage = 'Unable to delete this product.';
          }
        },
        error: (error) => {
          this.isDeletingProductId = null;
          console.error('Failed to delete product:', error);
          this.errorMessage = 'Failed to delete product. Please try again.';
        },
      });
  }

  isDeleting(productId: number): boolean {
    return this.isDeletingProductId === productId;
  }

  getImageUrl(product: ProductDto): string {
    const imageName = product.imagesNames?.[0];
    if (!imageName) {
      return '';
    }

    return `https://localhost:7125/Images/Products/${imageName}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  get totalProducts(): number {
    return this.seller?.totalProducts ?? this.products.length;
  }

  get totalEarnings(): number {
    return this.seller?.totalEarnings ?? 0;
  }

  get approvedLabel(): string {
    return this.seller?.isApproved ? 'Approved' : 'Pending approval';
  }
}