import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { CategoryDto } from '../../models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule], // ✅ من غير Pipe
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
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.errorMessage = 'Failed to load categories. Please try again.';
          this.isLoading = false;
        },
      });
  }

  viewCategory(categoryId: number): void {
    this.router.navigate(['/categories', categoryId]);
  }

  retry(): void {
    this.loadCategories();
  }

  // ✅ دالة تحويل الصورة - هتضبط الرابط
  getImageUrl(icon: string | null | undefined): string {
    // لو مفيش صورة
    if (!icon) {
      return 'assets/images/default-category.png';
    }

    // لو كان رابط خارجي (زي رابط Google)
    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      // لو الرابط من Google، حاول تعرضه مباشرة
      if (icon.includes('googleusercontent.com') || icon.includes('gstatic.com')) {
        return icon;
      }
      return icon;
    }

    // لو كان Base64
    if (icon.startsWith('data:image')) {
      return icon;
    }

    // لو كان من assets
    if (icon.startsWith('assets/')) {
      return icon;
    }

    // لو كان مسار من API
    if (icon.startsWith('/')) {
      return `https://localhost:7017${icon}`;
    }

    // مسار نسبي
    return `https://localhost:7017/${icon}`;
  }

  // ✅ دالة لو فشلت الصورة
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-category.png';
    img.onerror = null; // منع التكرار
  }
}