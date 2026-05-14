import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { CategoryDto } from '../../models/category.model';
import { SHARED_IMPORTS } from '../../../../shared/shared-imports';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories: CategoryDto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all categories
   */
  private loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService
      .getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const r = response as any;
          if (r.isSuccess && r.data) {
            this.categories = Array.isArray(r.data) ? r.data : (r.data.categories || r.data.Categories || []);
          } else if (Array.isArray(r)) {
            this.categories = r;
          } else {
            this.categories = [];
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.errorMessage = 'Failed to load categories. Please try again.';
          this.isLoading = false;
        },
      });
  }

  /**
   * Navigate to category detail page
   */
  viewCategory(categoryId: number): void {
    this.router.navigate(['/categories', categoryId]);
  }

  /**
   * Retry loading categories
   */
  retry(): void {
    this.loadCategories();
  }

  /**
   * Convert base64 to image data URL
   */
  getImageUrl(icon: string): string {
    if (icon && icon.startsWith('data:image')) {
      return icon;
    }
    // If it's base64 without data URL prefix
    if (icon) {
      return `data:image/png;base64,${icon}`;
    }
    return '';
  }
}
