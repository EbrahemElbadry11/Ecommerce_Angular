import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CategoryDto } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { ProductDto, AddProductDto, UpdateProductDto } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

type ProductFormMode = 'create' | 'edit';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent implements OnChanges, OnDestroy {
  @Input() mode: ProductFormMode = 'create';
  @Input() product: ProductDto | null = null;
  @Input() categories: CategoryDto[] = [];
  @Input() sellerId: number | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() success = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();

  form!: FormGroup;

  isSubmitting: boolean = false;
  selectedCategoryName: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.constructorInit();
  }

  // Initialize form after FormBuilder is available
  constructorInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null as number | null, [Validators.required]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] || changes['categories'] || changes['mode']) {
      this.patchFormFromInputs();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchFormFromInputs(): void {
    if (this.mode === 'edit' && this.product) {
      const matchedCategory = this.categories.find(
        (category) => category.name === this.product?.categoryName
      );

      this.form.patchValue({
        name: this.product.name ?? '',
        description: this.product.description ?? '',
        price: this.product.price ?? null,
        stockQuantity: this.product.stockQuantity ?? 0,
        categoryId: matchedCategory?.categoryId ?? null,
      });

      this.selectedCategoryName = this.product.categoryName ?? '';
      return;
    }

    if (this.mode === 'create') {
      this.form.patchValue({
        name: '',
        description: '',
        price: null,
        stockQuantity: 0,
        categoryId: null,
      });
      this.selectedCategoryName = '';
    }
  }

  onCategoryChange(categoryId: string): void {
    const parsedCategoryId = Number(categoryId) || null;
    this.form.patchValue({ categoryId: parsedCategoryId });

    const selectedCategory = this.categories.find(
      (category) => category.categoryId === parsedCategoryId
    );
    this.selectedCategoryName = selectedCategory?.name || '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error.emit('');

    const name = this.form.value.name?.trim() || '';
    const description = this.form.value.description?.trim() || '';
    const price = Number(this.form.value.price);
    const stockQuantity = Number(this.form.value.stockQuantity);
    const categoryId = Number(this.form.value.categoryId);

    if (this.mode === 'create') {
      if (!this.sellerId) {
        this.isSubmitting = false;
        this.error.emit('Missing seller profile. Register your store first.');
        return;
      }

      const payload: AddProductDto = {
        name,
        description,
        price,
        stockQuantity,
        categoryId,
        sellerId: this.sellerId,
      };

      this.productService
        .addProduct(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.isSuccess) {
              this.success.emit('Product created successfully.');
              this.saved.emit();
            } else {
              this.error.emit(response.message || 'Unable to create product.');
            }
          },
          error: (saveError) => {
            this.isSubmitting = false;
            console.error('Failed to create product:', saveError);
            this.error.emit('Failed to create product. Please try again.');
          },
        });
      return;
    }

    if (!this.product) {
      this.isSubmitting = false;
      this.error.emit('Missing product data for update.');
      return;
    }

    const payload: UpdateProductDto = {
      productId: this.product.productId,
      name,
      description,
      price,
      stockQuantity,
      categoryId,
    };

    this.productService
      .updateProduct(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.isSuccess) {
            this.success.emit('Product updated successfully.');
            this.saved.emit();
          } else {
            this.error.emit(response.message || 'Unable to update product.');
          }
        },
        error: (saveError) => {
          this.isSubmitting = false;
          console.error('Failed to update product:', saveError);
          this.error.emit('Failed to update product. Please try again.');
        },
      });
  }

  hasError(controlName: 'name' | 'description' | 'price' | 'stockQuantity' | 'categoryId'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(controlName: 'name' | 'description' | 'price' | 'stockQuantity' | 'categoryId'): string {
    const control = this.form.get(controlName);
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['maxlength']) {
      return controlName === 'name'
        ? 'Name cannot exceed 100 characters.'
        : 'Description cannot exceed 1000 characters.';
    }

    if (control.errors['min']) {
      return controlName === 'price'
        ? 'Price must be greater than 0.'
        : 'Stock quantity cannot be negative.';
    }

    return 'Invalid value.';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }
}
