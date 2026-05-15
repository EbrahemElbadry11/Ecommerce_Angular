import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl:
    './product-image-upload.component.html',
  styleUrls: [
    './product-image-upload.component.css',
  ],
})
export class ProductImageUploadComponent {
  @Input() productId!: number;

  @Input() productName: string = '';

  @Input() currentImageUrl: string = '';

  @Output() uploaded =
    new EventEmitter<number>();

  @Output() error =
    new EventEmitter<string>();

  selectedFile: File | null = null;

  selectedFileName: string = '';

  previewUrl: string = '';

  isUploading: boolean = false;

  statusMessage: string = '';

  readonly maxFileSize = 2 * 1024 * 1024;

  readonly allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  constructor(
    private productService: ProductService
  ) { }

  /**
   * File Selection
   */
  onFileSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files &&
        input.files.length > 0
        ? input.files[0]
        : null;

    this.statusMessage = '';

    this.error.emit('');

    if (!file) {
      this.clearSelection();

      return;
    }

    // Validate File Type
    if (
      !this.allowedTypes.includes(file.type)
    ) {
      this.error.emit(
        'Only JPG, JPEG, and PNG images are allowed.'
      );

      this.clearSelection();

      return;
    }

    // Validate File Size
    if (file.size > this.maxFileSize) {
      this.error.emit(
        'Image size must not exceed 2 MB.'
      );

      this.clearSelection();

      return;
    }

    this.selectedFile = file;

    this.selectedFileName = file.name;

    // Preview
    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl = String(
        reader.result || ''
      );
    };

    reader.readAsDataURL(file);
  }

  /**
   * Clear Selection
   */
  clearSelection(): void {
    this.selectedFile = null;

    this.selectedFileName = '';

    this.previewUrl =
      this.currentImageUrl || '';

    this.statusMessage = '';
  }

  /**
   * Upload Image
   */
  upload(): void {
    if (!this.productId) {
      this.error.emit(
        'Missing product reference.'
      );

      return;
    }

    if (!this.selectedFile) {
      this.error.emit(
        'Please select an image first.'
      );

      return;
    }

    this.isUploading = true;

    this.statusMessage = '';

    this.error.emit('');

    this.productService
      .uploadProductImage(
        this.productId,
        this.selectedFile
      )
      .subscribe({
        next: (response) => {
          this.isUploading = false;

          if (response.isSuccess) {
            this.statusMessage =
              'Image uploaded successfully.';

            this.uploaded.emit(
              this.productId
            );

            this.clearSelection();

            return;
          }

          this.error.emit(
            response.data ||
            'Unable to upload image.'
          );
        },

        error: (uploadError) => {
          this.isUploading = false;

          console.error(
            'Upload failed:',
            uploadError
          );

          this.error.emit(
            'Failed to upload image. Please try again.'
          );
        },
      });
  }

  /**
   * Current Preview Check
   */
  get hasCurrentPreview(): boolean {
    return !!(
      this.previewUrl ||
      this.currentImageUrl
    );
  }

  /**
   * Display Preview
   */
  get displayImage(): string {
    return (
      this.previewUrl ||
      this.currentImageUrl ||
      'assets/images/no-image.png'
    );
  }
}
