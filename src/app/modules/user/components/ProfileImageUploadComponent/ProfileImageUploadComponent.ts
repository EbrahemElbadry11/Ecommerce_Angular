// profile-image-upload.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-image-upload.component.html',
  styleUrls: ['./profile-image-upload.component.css']
})
export class ProfileImageUploadComponent {
  @Input() currentImageUrl: string = '';
  @Output() uploaded = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();

  selectedFile: File | null = null;
  selectedFileName: string = '';
  previewUrl: string = '';
  isUploading: boolean = false;
  statusMessage: string = '';

  readonly maxFileSize = 2 * 1024 * 1024; // 2 MB
  readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(private userService: UserService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    this.statusMessage = '';
    this.error.emit('');

    if (!file) {
      this.clearSelection();
      return;
    }

    // Validate File Type
    if (!this.allowedTypes.includes(file.type)) {
      this.error.emit('Only JPG, JPEG, and PNG images are allowed.');
      this.clearSelection();
      return;
    }

    // Validate File Size
    if (file.size > this.maxFileSize) {
      this.error.emit('Image size must not exceed 2 MB.');
      this.clearSelection();
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;

    // Preview
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
    if (!this.selectedFile) {
      this.error.emit('Please select an image first.');
      return;
    }

    this.isUploading = true;
    this.statusMessage = '';
    this.error.emit('');

    // ✅ استخدم الـ API الجديد
    this.userService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.isUploading = false;
        
        if (response.isSuccess) {
          this.statusMessage = 'Profile image uploaded successfully.';
          const newImageUrl = response.data || '';
          this.uploaded.emit(newImageUrl);
          this.clearSelection();
        } else {
          this.error.emit(response.data || 'Unable to upload image.');
        }
      },
      error: (uploadError) => {
        this.isUploading = false;
        console.error('Upload failed:', uploadError);
        this.error.emit('Failed to upload image. Please try again.');
      }
    });
  }

  get hasCurrentPreview(): boolean {
    return !!(this.previewUrl || this.currentImageUrl);
  }

  get displayImage(): string {
    return this.previewUrl || this.currentImageUrl || 'assets/images/default-avatar.png';
  }
}