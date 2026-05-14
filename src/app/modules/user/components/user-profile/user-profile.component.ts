import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user-profile.model';

const API_BASE = 'https://localhost:7017';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly profile      = signal<UserProfile | null>(null);
  readonly loading      = signal(true);
  readonly saving       = signal(false);
  readonly message      = signal('');
  readonly success      = signal(false);
  readonly imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    fullName:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    address:     ['', [Validators.maxLength(100)]],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (res) => {
        const p = res.data;
        if (!p) return;
        this.profile.set(p);
        this.form.patchValue({
          fullName:    p.fullName,
          phoneNumber: p.phoneNumber ?? '',
          address:     p.address     ?? '',
        });
        if (p.imagePath)
          this.imagePreview.set(`${API_BASE}/${p.imagePath}`);
      },
      complete: () => this.loading.set(false),
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.message.set('');
    const v = this.form.getRawValue();
    this.userService.updateProfile({
      fullName:    v.fullName    || null,
      phoneNumber: v.phoneNumber || null,
      address:     v.address     || null,
      image:       this.selectedFile,
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.message.set('Profile updated successfully!');
        this.selectedFile = null;
      },
      error: (err) => {
        this.success.set(false);
        this.message.set(err?.error?.data || 'Update failed. Try again.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  getRoleBadgeColor(): string {
    const role = this.profile()?.role;
    if (role === 'Admin')  return '#ef4444';
    if (role === 'Seller') return '#f59e0b';
    return '#6366f1';
  }
}
