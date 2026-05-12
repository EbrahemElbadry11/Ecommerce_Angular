import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-image-upload.component.html',
  styleUrls: ['./product-image-upload.component.css'],
})
export class ProductImageUploadComponent {
  @Input() productId!: number;
  @Input() productName: string = '';
  @Input() currentImageUrl: string = '';

  @Output() uploaded = new EventEmitter<number>();
  @Output() error = new EventEmitter<string>();

  selectedFile: File | null = null;
  selectedFileName: string = '';
  previewUrl: string = '';
  isUploading: boolean = false;
  statusMessage: string = '';

  constructor(private productService: ProductService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    this.selectedFile = file;
    this.selectedFileName = file?.name || '';
    this.statusMessage = '';

    if (!file) {
      this.previewUrl = this.currentImageUrl || '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewUrl = this.currentImageUrl || '';
    this.statusMessage = '';
  }

  upload(): void {
    if (!this.productId) {
      this.error.emit('Missing product reference for image upload.');
      return;
    }

    if (!this.selectedFile) {
      this.error.emit('Choose an image before uploading.');
      return;
    }

    this.isUploading = true;
    this.statusMessage = '';
    this.error.emit('');

    this.productService.uploadProductImage(this.productId, this.selectedFile).subscribe({
      next: (response) => {
        this.isUploading = false;

        if (response.isSuccess) {
          this.statusMessage = 'Image uploaded successfully.';
          this.uploaded.emit(this.productId);
          this.clearSelection();
          return;
        }

        this.error.emit(response.message || 'Unable to upload product image.');
      },
      error: (uploadError) => {
        this.isUploading = false;
        console.error('Failed to upload product image:', uploadError);
        this.error.emit('Failed to upload product image. Please try again.');
      },
    });
  }

  get hasCurrentPreview(): boolean {
    return !!this.previewUrl || !!this.currentImageUrl;
  }
}