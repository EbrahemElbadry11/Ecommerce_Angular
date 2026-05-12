import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SellerResponseDto } from '../../models/seller.model';
import { SellerService } from '../../services/seller.service';
import { SellerFormComponent } from '../seller-form/seller-form.component';

@Component({
  selector: 'app-seller-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SellerFormComponent],
  templateUrl: './seller-profile-page.component.html',
  styleUrls: ['./seller-profile-page.component.css'],
})
export class SellerProfilePageComponent implements OnInit, OnDestroy {
  seller: SellerResponseDto | null = null;
  isLoading: boolean = false;
  isDeleting: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private sellerService: SellerService, private router: Router) {}

  ngOnInit(): void {
    this.loadSellerProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSellerProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.sellerService
      .getCurrentSellerProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.seller = response.data;
          } else {
            this.seller = null;
            this.errorMessage = 'Seller profile not found. Register your store first.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load seller profile:', error);
          this.isLoading = false;
          this.errorMessage = 'Failed to load seller profile. Please try again.';
        },
      });
  }

  onSaved(updatedSeller: SellerResponseDto): void {
    this.seller = updatedSeller;
    this.successMessage = 'Seller profile saved successfully.';
    this.errorMessage = '';
  }

  onSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  onError(message: string): void {
    this.errorMessage = message;
    if (message) {
      this.successMessage = '';
    }
  }

  retry(): void {
    this.loadSellerProfile();
  }

  deleteProfile(): void {
    const confirmed = window.confirm(
      'Delete your seller profile? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.sellerService
      .deleteSellerProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isDeleting = false;
          if (response.isSuccess) {
            this.seller = null;
            this.successMessage = 'Seller profile deleted successfully.';
            setTimeout(() => this.router.navigate(['/home']), 1200);
          } else {
            this.errorMessage = 'Unable to delete seller profile.';
          }
        },
        error: (error) => {
          console.error('Failed to delete seller profile:', error);
          this.isDeleting = false;
          this.errorMessage = 'Failed to delete seller profile. Please try again.';
        },
      });
  }

  getLogoUrl(logoBase64?: string): string {
    if (!logoBase64) {
      return '';
    }

    return logoBase64.startsWith('data:image')
      ? logoBase64
      : `data:image/png;base64,${logoBase64}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  }
}