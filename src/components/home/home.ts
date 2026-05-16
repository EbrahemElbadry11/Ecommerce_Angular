import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductService } from '../../app/modules/products/services/product.service';
import { CategoryService } from '../../app/modules/categories/services/category.service';
import { ProductDto, ProductCardDto } from '../../app/modules/products/models/product.model';
import { CategoryDto } from '../../app/modules/categories/models/category.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, OnDestroy {
  featuredProducts: ProductCardDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    forkJoin({
      products: this.productService.getAllProducts({ page: 1, pageSize: 8, sortBy: 'createdAt', order: 'desc' }),
      categories: this.categoryService.getAllCategories(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ products, categories }) => {
          if (products.isSuccess && products.data) {
            this.featuredProducts = products.data.products.map((p) => ({
              ...p,
              imageUrl: p.imagesNames?.length ? p.imagesNames[0] : 'assets/images/no-image.png',
              shortDescription: p.description ? p.description.slice(0, 80) : '',
              formattedPrice: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price),
            }));
          }
          if (categories.isSuccess && categories.data) {
            this.categories = Array.isArray(categories.data) ? categories.data : [];
          }
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getImageUrl(icon: string): string {
    if (!icon) return '';
    if (icon.startsWith('data:image')) return icon;
    return `data:image/png;base64,${icon}`;
  }
}
