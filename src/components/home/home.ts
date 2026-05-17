import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductService } from '../../app/modules/products/services/product.service';
import { CategoryService } from '../../app/modules/categories/services/category.service';
import { ProductDto, ProductCardDto } from '../../app/modules/products/models/product.model';
import { CategoryDto } from '../../app/modules/categories/models/category.model';
import { ChangeDetectorRef } from '@angular/core';
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
    public productService: ProductService,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef
  ) { }

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
              imageUrl: p.imagesNames?.length
                ? this.productService.getImageUrl(p.imagesNames[0])
                : 'assets/images/no-image.png',
              shortDescription: p.description ? p.description.slice(0, 80) : '',
              formattedPrice: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price),
            }));
          }
          if (categories.isSuccess && categories.data) {
            this.categories = Array.isArray(categories.data) ? categories.data : [];
          }
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: () => (this.isLoading = false),
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getImageUrl(icon: string | null | undefined): string {
    if (!icon) {
      return '';
    }

    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return icon;
    }

    if (icon.startsWith('data:image')) {
      return icon;
    }

    if (icon.startsWith('/')) {
      return `https://localhost:7017${icon}`;
    }

    return `https://localhost:7017/${icon}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const placeholder = parent.querySelector('.chip-icon-placeholder');
      if (placeholder) {
        (placeholder as HTMLElement).style.display = 'flex';
      }
    }
  }
}


