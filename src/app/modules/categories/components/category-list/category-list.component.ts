import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { CategoryDto } from '../../models/category.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories: CategoryDto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess && response.data) {
            this.categories = Array.isArray(response.data)
              ? response.data
              : (response.data.categories || response.data.Categories || []);
          } else if (Array.isArray(response)) {
            this.categories = response;
          } else {
            this.categories = [];
          }
          this.isLoading = false;

          this.cd.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.errorMessage = 'Failed to load categories. Please try again.';
          this.isLoading = false;

          this.cd.markForCheck();
        },
      });
  }

  viewCategory(categoryId: number): void {
    this.router.navigate(['/categories', categoryId]);
  }

  retry(): void {
    this.loadCategories();
  }

  getImageUrl(icon: string | null | undefined): string {
    if (!icon) {
      return 'assets/images/default-category.png';
    }

    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return icon;
    }

    if (icon.startsWith('data:image')) {
      return icon;
    }

    if (icon.startsWith('assets/')) {
      return icon;
    }

    if (icon.startsWith('/')) {
      return `https://localhost:7017${icon}`;
    }

    return `https://localhost:7017/${icon}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-category.png';
    img.onerror = null;

    // ✅ markForCheck
    this.cd.markForCheck();
  }
}
